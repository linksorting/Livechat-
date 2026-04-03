import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Visitor from "../models/Visitor.js";
import Workspace from "../models/Workspace.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { openWidgetSession, getWidgetConfigBySlug } from "../services/widget.service.js";
import {
  createNotification,
  emitConversation,
  emitWorkspace
} from "../services/notification.service.js";
import User from "../models/User.js";

export const getWidgetConfig = asyncHandler(async (req, res) => {
  const config = await getWidgetConfigBySlug(req.params.workspaceSlug);
  if (!config) throw new ApiError(404, "Workspace not found");
  res.json({ success: true, data: config });
});

export const createSession = asyncHandler(async (req, res) => {
  const session = await openWidgetSession(req.body);

  res.status(201).json({
    success: true,
    data: {
      visitorToken: session.visitor.anonymousId,
      workspaceId: session.workspace._id,
      visitor: session.visitor,
      contact: session.contact,
      conversation: session.conversation,
      messages: session.messages,
      widget: session.workspace.widget
    }
  });
});

export const getPublicConversation = asyncHandler(async (req, res) => {
  const { visitorToken } = req.query;
  const conversation = await Conversation.findById(req.params.conversationId)
    .populate("visitor")
    .populate("contact");

  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!visitorToken || conversation.visitor?.anonymousId !== visitorToken) {
    throw new ApiError(403, "Invalid visitor token");
  }

  const messages = await Message.find({
    conversation: conversation._id,
    isInternalNote: false
  }).sort({ createdAt: 1 });

  res.json({
    success: true,
    data: { conversation, messages }
  });
});

export const sendPublicMessage = asyncHandler(async (req, res) => {
  const { visitorToken, content, attachments = [], messageType = "text" } = req.body;
  const conversation = await Conversation.findById(req.params.conversationId).populate("visitor").populate("assignedTo");
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!visitorToken || conversation.visitor?.anonymousId !== visitorToken) {
    throw new ApiError(403, "Invalid visitor token");
  }
  if (!content && !attachments.length) throw new ApiError(400, "Message content or attachments required");

  const message = await Message.create({
    workspace: conversation.workspace,
    conversation: conversation._id,
    senderType: "customer",
    senderVisitor: conversation.visitor._id,
    senderName: conversation.visitor.name || "Visitor",
    content: content || "Sent an attachment",
    attachments,
    messageType
  });

  conversation.lastMessagePreview = message.content;
  conversation.lastMessageAt = message.createdAt;
  conversation.unreadCount += 1;
  await conversation.save();

  const admins = await User.find({
    workspace: conversation.workspace,
    status: { $in: ["online", "away"] },
    isActive: true,
    role: { $in: ["owner", "admin", "support_agent"] }
  }).limit(6);

  await Promise.all(
    admins.map((user) =>
      createNotification(req.app.locals.io, {
        workspace: conversation.workspace,
        user: user._id,
        type: "conversation.new_message",
        title: "New visitor reply",
        body: `${conversation.visitor.name || "Visitor"} sent a new message`,
        conversation: conversation._id
      })
    )
  );

  emitConversation(req.app.locals.io, conversation._id, "conversation:message:new", message);
  emitWorkspace(req.app.locals.io, conversation.workspace, "conversation:updated", {
    conversationId: conversation._id
  });

  res.status(201).json({ success: true, data: message });
});

export const trackVisitor = asyncHandler(async (req, res) => {
  const { workspaceId, visitorToken, page = "/", title = "", referrer = "Direct" } = req.body;
  if (!workspaceId || !visitorToken) throw new ApiError(400, "workspaceId and visitorToken are required");

  const visitor = await Visitor.findOne({ workspace: workspaceId, anonymousId: visitorToken });
  if (!visitor) throw new ApiError(404, "Visitor not found");

  visitor.currentPage = page;
  visitor.currentlyBrowsing = page;
  visitor.lastActive = new Date();
  visitor.isOnline = true;
  visitor.referrer = referrer;
  visitor.pagesVisited.push({ url: page, title, visitedAt: new Date() });
  await visitor.save();

  emitWorkspace(req.app.locals.io, workspaceId, "visitor:activity", {
    visitorId: visitor._id,
    currentPage: page,
    lastActive: visitor.lastActive
  });

  res.json({ success: true, data: visitor });
});

export const markPublicRead = asyncHandler(async (req, res) => {
  const { visitorToken } = req.body;
  const conversation = await Conversation.findById(req.params.conversationId).populate("visitor");
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!visitorToken || conversation.visitor?.anonymousId !== visitorToken) {
    throw new ApiError(403, "Invalid visitor token");
  }

  await Message.updateMany(
    { conversation: conversation._id, senderType: "agent", isRead: false },
    { $set: { isRead: true, seenAt: new Date() } }
  );

  res.json({ success: true, message: "Messages marked as read" });
});
