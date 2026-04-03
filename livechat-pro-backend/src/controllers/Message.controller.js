import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { emitConversation } from "../services/notification.service.js";

// ─────────────────────────────────────────────
// GET /api/v1/conversations/:id/messages
// Agent: fetch paginated message history
// ─────────────────────────────────────────────
export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    workspace: req.workspaceId
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const query = {
    conversation: conversation._id,
    isDeleted: false
  };

  const [items, total] = await Promise.all([
    Message.find(query)
      .populate("senderUser", "name avatar title")
      .populate("senderVisitor", "name email")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: { items, pagination: { page, limit, total } }
  });
});

// ─────────────────────────────────────────────
// PATCH /api/v1/conversations/:id/messages/:messageId
// Agent: edit their own message
// ─────────────────────────────────────────────
export const editMessage = asyncHandler(async (req, res) => {
  const { message: newContent } = req.body;
  if (!newContent?.trim()) throw new ApiError(400, "Message content is required");

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    workspace: req.workspaceId
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const message = await Message.findOne({
    _id: req.params.messageId,
    conversation: conversation._id,
    senderType: "agent",
    isDeleted: false
  });
  if (!message) throw new ApiError(404, "Message not found");

  if (String(message.senderUser) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed to edit this message");
  }

  // ✅ Correct field name: 'message' not 'content'
  message.message = newContent.trim();
  message.editedAt = new Date();
  await message.save();

  emitConversation(
    req.app.locals.io,
    conversation._id,
    "conversation:message:edited",
    {
      messageId: message._id,
      conversationId: conversation._id,
      message: message.message,
      editedAt: message.editedAt
    }
  );

  res.json({ success: true, data: message });
});

// ─────────────────────────────────────────────
// DELETE /api/v1/conversations/:id/messages/:messageId
// Agent: soft-delete a message
// ─────────────────────────────────────────────
export const deleteMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    workspace: req.workspaceId
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const message = await Message.findOne({
    _id: req.params.messageId,
    conversation: conversation._id
  });
  if (!message) throw new ApiError(404, "Message not found");

  if (
    message.senderType === "agent" &&
    String(message.senderUser) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not allowed to delete this message");
  }

  message.isDeleted = true;
  await message.save();

  emitConversation(
    req.app.locals.io,
    conversation._id,
    "conversation:message:deleted",
    { messageId: message._id, conversationId: conversation._id }
  );

  res.json({ success: true, data: { messageId: message._id } });
});

// ─────────────────────────────────────────────
// PATCH /api/v1/conversations/:id/messages/:messageId/read
// Agent: mark a single message as read (multi-agent tracking)
// ─────────────────────────────────────────────
export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findOne({
    _id: req.params.messageId,
    workspace: req.workspaceId,
    isDeleted: false
  });
  if (!message) throw new ApiError(404, "Message not found");

  const alreadyRead = message.readBy.some(
    (r) => String(r.user) === String(req.user._id)
  );

  if (!alreadyRead) {
    message.readBy.push({ user: req.user._id, readAt: new Date() });
    message.isRead = true;
    message.seenAt = new Date();
    await message.save();
  }

  res.json({ success: true, data: { messageId: message._id, isRead: true } });
});