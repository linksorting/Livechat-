// import Conversation from "../models/Conversation.js";
// import Message from "../models/Message.js";
// import Contact from "../models/Contact.js";
// import User from "../models/User.js";
// import ApiError from "../utils/apiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { getPagination } from "../utils/pagination.js";
// import {
//   createActivity,
//   createNotification,
//   emitConversation,
//   emitWorkspace
// } from "../services/notification.service.js";
// import { hydrateConversation } from "../services/conversation.service.js";

// export const listConversations = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = getPagination(req.query);
//   const {
//     status,
//     assignedTo,
//     tag,
//     department,
//     priority,
//     search,
//     pinned,
//     starred,
//     startDate,
//     endDate
//   } = req.query;

//   const query = { workspace: req.workspaceId };

//   if (status && status !== "all") query.status = status;
//   if (department) query.department = department;
//   if (priority) query.priority = priority;
//   if (pinned === "true") query.isPinned = true;
//   if (starred === "true") query.isStarred = true;
//   if (assignedTo === "me") query.assignedTo = req.user._id;
//   if (assignedTo && assignedTo !== "me") query.assignedTo = assignedTo;
//   if (tag) query.tags = tag;
//   if (startDate || endDate) {
//     query.lastMessageAt = {};
//     if (startDate) query.lastMessageAt.$gte = new Date(startDate);
//     if (endDate) query.lastMessageAt.$lte = new Date(endDate);
//   }
//   if (search) {
//     query.$or = [
//       { subject: new RegExp(search, "i") },
//       { lastMessagePreview: new RegExp(search, "i") }
//     ];
//   }

//   const [items, total] = await Promise.all([
//     Conversation.find(query)
//       .populate("assignedTo", "name avatar title status")
//       .populate("contact", "name email company avatar tags")
//       .populate("visitor", "name email currentPage location browser device")
//       .sort({ isPinned: -1, lastMessageAt: -1 })
//       .skip(skip)
//       .limit(limit),
//     Conversation.countDocuments(query)
//   ]);

//   res.json({
//     success: true,
//     data: {
//       items,
//       pagination: { page, limit, total }
//     }
//   });
// });

// export const getConversation = asyncHandler(async (req, res) => {
//   const conversation = await hydrateConversation(req.params.id, req.workspaceId);
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   const messages = await Message.find({ conversation: conversation._id })
//     .populate("senderUser", "name avatar title")
//     .sort({ createdAt: 1 });

//   res.json({
//     success: true,
//     data: {
//       conversation,
//       messages
//     }
//   });
// });

// export const sendMessage = asyncHandler(async (req, res) => {
//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   const { content, attachments = [], messageType = "text" } = req.body;
//   if (!content && !attachments.length) throw new ApiError(400, "Message content or attachments required");

//   const message = await Message.create({
//     workspace: req.workspaceId,
//     conversation: conversation._id,
//     senderType: "agent",
//     senderUser: req.user._id,
//     senderName: req.user.name,
//     senderAvatar: req.user.avatar,
//     content: content || (attachments.length ? "Shared an attachment" : ""),
//     attachments,
//     messageType
//   });

//   const firstAgentMessage = await Message.countDocuments({
//     conversation: conversation._id,
//     senderType: "agent"
//   });

//   conversation.lastMessagePreview = message.content;
//   conversation.lastMessageAt = message.createdAt;
//   conversation.unreadCount = 0;

//   if (!conversation.assignedTo) {
//     conversation.assignedTo = req.user._id;
//   }

//   if (firstAgentMessage === 1) {
//     conversation.firstResponseTime = Math.max(0, Math.round((message.createdAt.getTime() - conversation.createdAt.getTime()) / 1000));
//   }

//   await conversation.save();

//   await User.findByIdAndUpdate(req.user._id, {
//     $inc: { "stats.conversationsHandled": 1 }
//   });

//   await createActivity({
//     workspace: req.workspaceId,
//     actorUser: req.user._id,
//     actorName: req.user.name,
//     type: "message.sent",
//     description: `Replied to ${conversation.subject || "conversation"}`,
//     targetType: "conversation",
//     targetId: conversation._id
//   });

//   const populatedMessage = await Message.findById(message._id).populate("senderUser", "name avatar title");

//   emitConversation(req.app.locals.io, conversation._id, "conversation:message:new", populatedMessage);
//   emitWorkspace(req.app.locals.io, req.workspaceId, "conversation:updated", {
//     conversationId: conversation._id
//   });

//   res.status(201).json({
//     success: true,
//     data: populatedMessage
//   });
// });

// export const addInternalNote = asyncHandler(async (req, res) => {
//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   const { content } = req.body;
//   if (!content) throw new ApiError(400, "Note content is required");

//   const note = await Message.create({
//     workspace: req.workspaceId,
//     conversation: conversation._id,
//     senderType: "agent",
//     senderUser: req.user._id,
//     senderName: req.user.name,
//     senderAvatar: req.user.avatar,
//     content,
//     messageType: "note",
//     isInternalNote: true
//   });

//   emitConversation(req.app.locals.io, conversation._id, "conversation:message:new", note);

//   res.status(201).json({
//     success: true,
//     data: note
//   });
// });

// export const assignConversation = asyncHandler(async (req, res) => {
//   const { assigneeId } = req.body;
//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   const assignee = await User.findOne({ _id: assigneeId, workspace: req.workspaceId });
//   if (!assignee) throw new ApiError(404, "Assignee not found");

//   conversation.assignedTo = assignee._id;
//   await conversation.save();

//   await createNotification(req.app.locals.io, {
//     workspace: req.workspaceId,
//     user: assignee._id,
//     type: "conversation.assigned",
//     title: "Conversation assigned",
//     body: `${req.user.name} assigned a conversation to you`,
//     conversation: conversation._id
//   });

//   await createActivity({
//     workspace: req.workspaceId,
//     actorUser: req.user._id,
//     actorName: req.user.name,
//     type: "conversation.assigned",
//     description: `Assigned conversation to ${assignee.name}`,
//     targetType: "conversation",
//     targetId: conversation._id
//   });

//   emitConversation(req.app.locals.io, conversation._id, "conversation:updated", {
//     conversationId: conversation._id,
//     assignedTo: assignee
//   });

//   res.json({
//     success: true,
//     data: conversation
//   });
// });

// export const updateStatus = asyncHandler(async (req, res) => {
//   const { status } = req.body;
//   if (!["open", "resolved", "missed", "spam"].includes(status)) {
//     throw new ApiError(400, "Invalid status");
//   }

//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   conversation.status = status;
//   if (status === "resolved") {
//     conversation.resolvedAt = new Date();
//     conversation.resolutionTime = Math.max(0, Math.round((conversation.resolvedAt.getTime() - conversation.createdAt.getTime()) / 1000));
//   } else {
//     conversation.resolvedAt = null;
//   }
//   await conversation.save();

//   emitConversation(req.app.locals.io, conversation._id, "conversation:updated", {
//     conversationId: conversation._id,
//     status
//   });

//   res.json({
//     success: true,
//     data: conversation
//   });
// });

// export const updateMeta = asyncHandler(async (req, res) => {
//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   const allowed = ["priority", "tags", "department", "isPinned", "isStarred", "subject"];
//   allowed.forEach((field) => {
//     if (field in req.body) conversation[field] = req.body[field];
//   });

//   await conversation.save();

//   emitWorkspace(req.app.locals.io, req.workspaceId, "conversation:updated", {
//     conversationId: conversation._id
//   });

//   res.json({
//     success: true,
//     data: conversation
//   });
// });

// export const markRead = asyncHandler(async (req, res) => {
//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   conversation.unreadCount = 0;
//   await conversation.save();

//   await Message.updateMany(
//     { conversation: conversation._id, isRead: false },
//     { $set: { isRead: true, seenAt: new Date() } }
//   );

//   emitConversation(req.app.locals.io, conversation._id, "conversation:read", {
//     conversationId: conversation._id,
//     actor: req.user.name,
//     readAt: new Date().toISOString()
//   });

//   res.json({ success: true, data: { conversationId: conversation._id, unreadCount: 0 } });
// });

// export const submitCsat = asyncHandler(async (req, res) => {
//   const { rating, feedback = "" } = req.body;
//   if (!["happy", "neutral", "unhappy"].includes(rating)) {
//     throw new ApiError(400, "Invalid CSAT rating");
//   }

//   const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
//   if (!conversation) throw new ApiError(404, "Conversation not found");

//   conversation.csat = {
//     rating,
//     feedback,
//     respondedAt: new Date()
//   };
//   await conversation.save();

//   res.json({
//     success: true,
//     data: conversation.csat
//   });
// });

// export const createConversation = asyncHandler(async (req, res) => {
//   const { contactId, visitorId, subject, priority = "medium", department = "support", tags = [] } = req.body;
//   const conversation = await Conversation.create({
//     workspace: req.workspaceId,
//     contact: contactId || null,
//     visitor: visitorId || null,
//     subject: subject || "New conversation",
//     priority,
//     department,
//     tags,
//     assignedTo: req.user._id,
//     status: "open",
//     lastMessageAt: new Date()
//   });

//   if (contactId) {
//     await Contact.findByIdAndUpdate(contactId, {
//       $inc: { totalChats: 1 },
//       $set: { lastConversation: conversation._id }
//     });
//   }

//   res.status(201).json({
//     success: true,
//     data: conversation
//   });
// });


import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import {
  createActivity,
  createNotification,
  emitConversation,
  emitWorkspace
} from "../services/notification.service.js";
import { hydrateConversation } from "../services/conversation.service.js";

export const listConversations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const {
    status,
    assignedTo,
    tag,
    department,
    priority,
    search,
    pinned,
    starred,
    startDate,
    endDate
  } = req.query;

  const query = { workspace: req.workspaceId };

  if (status && status !== "all") query.status = status;
  if (department) query.department = department;
  if (priority) query.priority = priority;
  if (pinned === "true") query.isPinned = true;
  if (starred === "true") query.isStarred = true;
  if (assignedTo === "me") query.assignedTo = req.user._id;
  if (assignedTo && assignedTo !== "me") query.assignedTo = assignedTo;
  if (tag) query.tags = tag;
  if (startDate || endDate) {
    query.lastMessageAt = {};
    if (startDate) query.lastMessageAt.$gte = new Date(startDate);
    if (endDate) query.lastMessageAt.$lte = new Date(endDate);
  }
  if (search) {
    query.$or = [
      { subject: new RegExp(search, "i") },
      { lastMessagePreview: new RegExp(search, "i") }
    ];
  }

  const [items, total] = await Promise.all([
    Conversation.find(query)
      .populate("assignedTo", "name avatar title status")
      .populate("contact", "name email company avatar tags")
      .populate("visitor", "name email currentPage location browser device")
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .skip(skip)
      .limit(limit),
    Conversation.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total }
    }
  });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await hydrateConversation(req.params.id, req.workspaceId);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const messages = await Message.find({ conversation: conversation._id })
    .populate("senderUser", "name avatar title")
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: {
      conversation,
      messages
    }
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const { content, attachments = [], messageType = "text" } = req.body;
  if (!content && !attachments.length) throw new ApiError(400, "Message content or attachments required");

  const message = await Message.create({
    workspace: req.workspaceId,
    conversation: conversation._id,
    senderType: "agent",
    senderUser: req.user._id,
    senderName: req.user.name,
    senderAvatar: req.user.avatar,
    content: content || (attachments.length ? "Shared an attachment" : ""),
    attachments,
    messageType
  });

  const firstAgentMessage = await Message.countDocuments({
    conversation: conversation._id,
    senderType: "agent"
  });

  conversation.lastMessagePreview = message.content;
  conversation.lastMessageAt = message.createdAt;
  conversation.unreadCount = 0;

  if (!conversation.assignedTo) {
    conversation.assignedTo = req.user._id;
  }

  if (firstAgentMessage === 1) {
    conversation.firstResponseTime = Math.max(0, Math.round((message.createdAt.getTime() - conversation.createdAt.getTime()) / 1000));
  }

  await conversation.save();

  await User.findByIdAndUpdate(req.user._id, {
    $inc: { "stats.conversationsHandled": 1 }
  });

  await createActivity({
    workspace: req.workspaceId,
    actorUser: req.user._id,
    actorName: req.user.name,
    type: "message.sent",
    description: `Replied to ${conversation.subject || "conversation"}`,
    targetType: "conversation",
    targetId: conversation._id
  });

  const populatedMessage = await Message.findById(message._id).populate("senderUser", "name avatar title");

  const io = req.app.locals.io;
  const conversationId = conversation._id.toString();

  // ✅ FIX 1: Emit "newMessage" to the conversation room so the WIDGET receives it
  io.to(`conversation:${conversationId}`).emit("newMessage", {
    _id: message._id.toString(),
    conversationId,
    senderType: "agent",
    senderName: req.user.name,
    senderAvatar: req.user.avatar,
    content: message.content,
    messageType: message.messageType,
    createdAt: message.createdAt.toISOString()
  });

  // ✅ FIX 2: Also emit "conversation:message:new" so the DASHBOARD updates without refresh
  emitConversation(io, conversation._id, "conversation:message:new", populatedMessage);

  // ✅ FIX 3: Notify workspace room so conversation list re-orders
  emitWorkspace(io, req.workspaceId, "conversation:updated", {
    conversationId: conversation._id
  });

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

export const addInternalNote = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const { content } = req.body;
  if (!content) throw new ApiError(400, "Note content is required");

  const note = await Message.create({
    workspace: req.workspaceId,
    conversation: conversation._id,
    senderType: "agent",
    senderUser: req.user._id,
    senderName: req.user.name,
    senderAvatar: req.user.avatar,
    content,
    messageType: "note",
    isInternalNote: true
  });

  emitConversation(req.app.locals.io, conversation._id, "conversation:message:new", note);

  res.status(201).json({
    success: true,
    data: note
  });
});

export const assignConversation = asyncHandler(async (req, res) => {
  const { assigneeId } = req.body;
  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const assignee = await User.findOne({ _id: assigneeId, workspace: req.workspaceId });
  if (!assignee) throw new ApiError(404, "Assignee not found");

  conversation.assignedTo = assignee._id;
  await conversation.save();

  await createNotification(req.app.locals.io, {
    workspace: req.workspaceId,
    user: assignee._id,
    type: "conversation.assigned",
    title: "Conversation assigned",
    body: `${req.user.name} assigned a conversation to you`,
    conversation: conversation._id
  });

  await createActivity({
    workspace: req.workspaceId,
    actorUser: req.user._id,
    actorName: req.user.name,
    type: "conversation.assigned",
    description: `Assigned conversation to ${assignee.name}`,
    targetType: "conversation",
    targetId: conversation._id
  });

  emitConversation(req.app.locals.io, conversation._id, "conversation:updated", {
    conversationId: conversation._id,
    assignedTo: assignee
  });

  res.json({
    success: true,
    data: conversation
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["open", "resolved", "missed", "spam"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.status = status;
  if (status === "resolved") {
    conversation.resolvedAt = new Date();
    conversation.resolutionTime = Math.max(0, Math.round((conversation.resolvedAt.getTime() - conversation.createdAt.getTime()) / 1000));
  } else {
    conversation.resolvedAt = null;
  }
  await conversation.save();

  emitConversation(req.app.locals.io, conversation._id, "conversation:updated", {
    conversationId: conversation._id,
    status
  });

  res.json({
    success: true,
    data: conversation
  });
});

export const updateMeta = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const allowed = ["priority", "tags", "department", "isPinned", "isStarred", "subject"];
  allowed.forEach((field) => {
    if (field in req.body) conversation[field] = req.body[field];
  });

  await conversation.save();

  emitWorkspace(req.app.locals.io, req.workspaceId, "conversation:updated", {
    conversationId: conversation._id
  });

  res.json({
    success: true,
    data: conversation
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.unreadCount = 0;
  await conversation.save();

  await Message.updateMany(
    { conversation: conversation._id, isRead: false },
    { $set: { isRead: true, seenAt: new Date() } }
  );

  emitConversation(req.app.locals.io, conversation._id, "conversation:read", {
    conversationId: conversation._id,
    actor: req.user.name,
    readAt: new Date().toISOString()
  });

  res.json({ success: true, data: { conversationId: conversation._id, unreadCount: 0 } });
});

export const submitCsat = asyncHandler(async (req, res) => {
  const { rating, feedback = "" } = req.body;
  if (!["happy", "neutral", "unhappy"].includes(rating)) {
    throw new ApiError(400, "Invalid CSAT rating");
  }

  const conversation = await Conversation.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.csat = {
    rating,
    feedback,
    respondedAt: new Date()
  };
  await conversation.save();

  res.json({
    success: true,
    data: conversation.csat
  });
});

export const createConversation = asyncHandler(async (req, res) => {
  const { contactId, visitorId, subject, priority = "medium", department = "support", tags = [] } = req.body;
  const conversation = await Conversation.create({
    workspace: req.workspaceId,
    contact: contactId || null,
    visitor: visitorId || null,
    subject: subject || "New conversation",
    priority,
    department,
    tags,
    assignedTo: req.user._id,
    status: "open",
    lastMessageAt: new Date()
  });

  if (contactId) {
    await Contact.findByIdAndUpdate(contactId, {
      $inc: { totalChats: 1 },
      $set: { lastConversation: conversation._id }
    });
  }

  res.status(201).json({
    success: true,
    data: conversation
  });
});