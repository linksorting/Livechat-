import Conversation from "../models/Conversation.js";
import Contact from "../models/Contact.js";
import Visitor from "../models/Visitor.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) {
    return res.json({
      success: true,
      data: { conversations: [], contacts: [], visitors: [] }
    });
  }

  const regex = new RegExp(q, "i");

  const [conversations, contacts, visitors] = await Promise.all([
    Conversation.find({
      workspace: req.workspaceId,
      $or: [{ subject: regex }, { lastMessagePreview: regex }, { tags: regex }]
    })
      .populate("contact", "name email avatar")
      .sort({ lastMessageAt: -1 })
      .limit(8),
    Contact.find({
      workspace: req.workspaceId,
      mergedInto: null,
      $or: [{ name: regex }, { email: regex }, { company: regex }, { tags: regex }]
    })
      .sort({ updatedAt: -1 })
      .limit(8),
    Visitor.find({
      workspace: req.workspaceId,
      $or: [{ name: regex }, { email: regex }, { currentPage: regex }]
    })
      .sort({ lastActive: -1 })
      .limit(8)
  ]);

  res.json({
    success: true,
    data: { conversations, contacts, visitors }
  });
});
