import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
    MessageSquare, X, Smile, Paperclip, Send, FileText
} from "lucide-react";
import io from 'socket.io-client';

const API_BASE_URL = "http://localhost:5000/api/v1";
const WORKSPACE_ID = "69cf93b50e0624d56bb7b7dc";
const UPLOAD_URL = "http://localhost:5000/api/v1/upload";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function initials(name = "LP") {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function WebsiteChatWidget({ settings = {}, workspace = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState("form");
    const [form, setForm] = useState({ name: "", email: "", phone: "", orderNumber: "" });
    const [message, setMessage] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const brand = settings.primaryColor || "#5B6CFF";
    const bubblePosition = settings.position || "right";
    const companyName = workspace.name || "LiveChat Pro";

    const avatarStyle = useMemo(() => ({
        backgroundColor: `${brand}20`, color: brand
    }), [brand]);

    const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '🙌', '🙏', '😢', '😡', '😴', '🤯', '💯', '🚀', '⭐', '📱', '💻'];

    // ✅ 1. SOCKET CONNECTION
    useEffect(() => {
        const newSocket = io("http://localhost:5000", {
            auth: {
                workspaceId: WORKSPACE_ID,
                visitorToken: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            },
            transports: ['websocket', 'polling']
        });

        newSocket.on("connect", () => console.log("✅ Socket connected:", newSocket.id));
        newSocket.on("disconnect", () => console.log("❌ Socket disconnected"));

        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    // ✅ 2. LISTEN FOR MESSAGES ON CONVERSATION ROOM
    // KEY FIX: listen for "newMessage" (what backend emits), filter to only show AGENT messages
    useEffect(() => {
        if (!socket || !conversationId) return;

        socket.emit("conversation:join", { conversationId });
        console.log(`✅ Widget joined room: conversation:${conversationId}`);

        const handleNewMessage = (data) => {
            console.log("🔔 newMessage received:", data);

            // ✅ Only add AGENT messages — user's own messages are added optimistically
            if (data.senderType !== 'customer') {
                setChatMessages(prev => {
                    const exists = prev.some(msg => msg._id === data._id);
                    if (exists) return prev;
                    return [...prev, {
                        _id: data._id,
                        content: data.content,
                        sender: 'AGENT',
                        senderName: data.senderName || 'Agent',
                        type: data.messageType || 'text',
                        timestamp: data.createdAt
                    }];
                });
            }
        };

        // ✅ FIXED: was "agentReply" — backend actually emits "newMessage"
        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.emit("conversation:leave", { conversationId });
            console.log(`❌ Widget left room: conversation:${conversationId}`);
        };
    }, [socket, conversationId]);

    // ✅ 3. LOAD EXISTING MESSAGES
    const loadInitialMessages = useCallback(async (convId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/messages/${convId}`);
            const data = await response.json();

            if (data.success) {
                setChatMessages(data.messages.map(msg => ({
                    _id: msg._id,
                    content: msg.content,
                    sender: msg.senderType === 'customer' ? 'USER' : 'AGENT',
                    senderName: msg.senderName,
                    type: msg.messageType || 'text'
                })));
            }
        } catch (error) {
            console.error('❌ Load messages error:', error);
        }
    }, []);

    // ✅ 4. START CONVERSATION (form submit)
    const handleStartConversation = useCallback(async () => {
        if (!form.name.trim()) {
            alert("Please enter your name");
            return;
        }

        setIsCreatingConversation(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat/website-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `New conversation started by ${form.name}`,
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    orderNumber: form.orderNumber,
                    workspaceId: WORKSPACE_ID,
                    website: window.location.href,
                    action: 'start_conversation'
                }),
            });

            const data = await response.json();

            if (data.success) {
                setConversationId(data.conversationId);
                setStep("chat");
                loadInitialMessages(data.conversationId);
            } else {
                alert("Failed to start conversation. Please try again.");
            }
        } catch (error) {
            console.error('❌ Error creating conversation:', error);
            alert("Error starting conversation. Please try again.");
        } finally {
            setIsCreatingConversation(false);
        }
    }, [form, loadInitialMessages]);

    // ✅ 5. SEND MESSAGE
    const handleSubmitMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!message.trim() || !conversationId) return;

        const text = message.trim();
        const tempId = Date.now();

        // Optimistic update
        setChatMessages(prev => [...prev, {
            content: text,
            sender: 'USER',
            type: 'text',
            tempId
        }]);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/chat/website-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationId,
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    orderNumber: form.orderNumber,
                    workspaceId: WORKSPACE_ID,
                    website: window.location.href
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Mark optimistic message as permanent
                setChatMessages(prev =>
                    prev.map(msg => msg.tempId === tempId ? { ...msg, tempId: null } : msg)
                );
            }
        } catch (error) {
            console.error('❌ Send error:', error);
            setChatMessages(prev =>
                prev.map(msg => msg.tempId === tempId ? { ...msg, type: 'failed' } : msg)
            );
        }
    }, [message, form, conversationId]);

    // ✅ 6. EMOJI
    const handleEmojiClick = useCallback((emoji) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    }, []);

    // ✅ 7. FILE UPLOAD
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const tempId = Date.now();
        setChatMessages(prev => [...prev, {
            content: `Uploading ${file.name}...`,
            sender: 'USER',
            type: 'uploading',
            tempId
        }]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
            const data = await response.json();

            if (data.success) {
                setChatMessages(prev =>
                    prev.filter(msg => msg.tempId !== tempId).concat({
                        content: data.file.url,
                        sender: 'USER',
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        fileName: file.name,
                        fileSize: file.size
                    })
                );
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            setChatMessages(prev => prev.filter(msg => msg.tempId !== tempId));
        }
    };

    // ✅ 8. AUTO-SCROLL
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // ✅ 9. EMOJI OUTSIDE CLICK
    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ 10. ENTER TO SEND
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitMessage(e);
        }
    };

    // ✅ 11. RENDER MESSAGE CONTENT
    const renderMessageContent = (msg) => {
        switch (msg.type) {
            case 'image':
                return (
                    <div className="max-w-[200px]">
                        <img src={msg.content} alt="Uploaded" className="w-full h-48 object-cover rounded-2xl" />
                        <div className="text-xs text-slate-500 mt-1 truncate">{msg.fileName}</div>
                    </div>
                );
            case 'file':
                return (
                    <div className="flex items-center gap-2 max-w-[200px] p-3 bg-slate-100/50 rounded-2xl">
                        <FileText size={20} className="text-slate-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{msg.fileName}</div>
                            <div className="text-xs text-slate-500">{(msg.fileSize / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                );
            case 'uploading':
                return (
                    <div className="flex items-center gap-2 p-1">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-slate-500">{msg.content}</span>
                    </div>
                );
            case 'failed':
                return (
                    <>
                        <span>{msg.content}</span>
                        <div className="text-xs mt-1 text-red-400">Failed to send. Try again.</div>
                    </>
                );
            default:
                return <span>{msg.content}</span>;
        }
    };

    return (
        <div className={cx("fixed bottom-6 z-[9999]", bubblePosition === "left" ? "left-6" : "right-6")}>
            {isOpen && (
                <div className="mb-4 w-[360px] max-h-[600px] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-2xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 flex flex-col">

                    {/* HEADER */}
                    <div className="flex items-center justify-between rounded-t-[2rem] px-5 py-4 text-white flex-shrink-0" style={{ backgroundColor: brand }}>
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 font-semibold text-lg">
                                {initials(companyName)}
                            </div>
                            <div>
                                <div className="font-semibold">{companyName}</div>
                                <div className="text-xs text-white/70">
                                    {conversationId ? `Conv: ${conversationId.slice(-8)}` : "New chat"}
                                </div>
                            </div>
                        </div>
                        <button className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20" onClick={() => setIsOpen(false)}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex flex-col flex-1 min-h-0">

                        {/* FORM STEP */}
                        {step === "form" && (
                            <div className="flex flex-col gap-3 p-4 overflow-y-auto">
                                <div className="rounded-3xl bg-slate-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    👋 Hi! Fill in your details and we'll connect you with our team.
                                </div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Before we connect you</div>
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                                    placeholder="Full Name *"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                                    placeholder="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                                        placeholder="Phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                    <input
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                                        placeholder="Order #"
                                        value={form.orderNumber}
                                        onChange={(e) => setForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                                    />
                                </div>
                                <button
                                    className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ backgroundColor: brand }}
                                    onClick={handleStartConversation}
                                    disabled={isCreatingConversation || !form.name.trim()}
                                >
                                    {isCreatingConversation ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : 'Start conversation'}
                                </button>
                            </div>
                        )}

                        {/* CHAT STEP */}
                        {step === "chat" && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
                                    {chatMessages.length === 0 && (
                                        <div className="text-center text-sm text-slate-400 py-10">
                                            Send a message to get started 👋
                                        </div>
                                    )}

                                    {chatMessages.map((msg, index) => (
                                        <div
                                            key={msg._id || msg.tempId || index}
                                            className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'items-end gap-2'}`}
                                        >
                                            {msg.sender !== 'USER' && (
                                                <div
                                                    className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2xl text-xs font-semibold"
                                                    style={avatarStyle}
                                                >
                                                    {msg.senderName?.[0]?.toUpperCase() || 'A'}
                                                </div>
                                            )}
                                            <div className={`max-w-[78%] px-4 py-2.5 text-sm rounded-3xl shadow-sm leading-relaxed ${msg.sender === 'USER'
                                                    ? 'rounded-tr-md bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                    : 'rounded-tl-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                                                } ${msg.type === 'failed' ? '!bg-red-50 !border !border-red-200 !text-red-700 dark:!bg-red-950/40' : ''}`}>
                                                {renderMessageContent(msg)}
                                            </div>
                                        </div>
                                    ))}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* INPUT AREA */}
                                <div className="flex-shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">

                                    {/* Emoji Picker */}
                                    {showEmojiPicker && (
                                        <div
                                            ref={emojiPickerRef}
                                            className="grid grid-cols-10 gap-1 p-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-lg"
                                        >
                                            {emojis.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    className="text-lg hover:scale-125 transition-transform leading-none p-0.5"
                                                    onClick={() => handleEmojiClick(emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input Row */}
                                    <form
                                        onSubmit={handleSubmitMessage}
                                        className="flex items-center gap-2 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(prev => !prev)}
                                            className={`flex-shrink-0 p-1.5 rounded-xl transition-colors ${showEmojiPicker
                                                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/40'
                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <Smile size={18} />
                                        </button>

                                        <label className="flex-shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                                            <Paperclip size={18} />
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                accept="image/*,.pdf,.doc,.docx,.txt"
                                            />
                                        </label>

                                        <textarea
                                            className="flex-1 min-w-0 bg-transparent text-sm outline-none dark:text-white placeholder-slate-400 resize-none leading-snug max-h-24"
                                            placeholder="Type your message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            rows={1}
                                        />

                                        <button
                                            type="submit"
                                            disabled={!message.trim()}
                                            className="flex-shrink-0 rounded-2xl p-2 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                                            style={{ backgroundColor: brand }}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>

                                    <div className="text-center text-[10px] text-slate-400 dark:text-slate-600">
                                        Powered by LiveChat Pro
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* BUBBLE BUTTON */}
            <button
                type="button"
                className="inline-flex items-center gap-3 rounded-full px-5 py-4 text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
                style={{ backgroundColor: brand }}
                onClick={() => setIsOpen(prev => !prev)}
            >
                {isOpen ? <X size={18} /> : <MessageSquare size={18} />}
                <span className="font-medium">{isOpen ? 'Close' : 'Chat with us'}</span>
            </button>
        </div>
    );
}