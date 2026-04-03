import Visitor from "../models/Visitor.js";
import Conversation from "../models/Conversation.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

export const listVisitors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { active, search } = req.query;

  const query = { workspace: req.workspaceId };
  if (active === "true") query.isOnline = true;
  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { currentPage: new RegExp(search, "i") }
    ];
  }

  const [items, total] = await Promise.all([
    Visitor.find(query).populate("contact", "name email company tags").sort({ isOnline: -1, lastActive: -1 }).skip(skip).limit(limit),
    Visitor.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total }
    }
  });
});

export const getVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findOne({ _id: req.params.id, workspace: req.workspaceId }).populate("contact");
  if (!visitor) throw new ApiError(404, "Visitor not found");

  const conversations = await Conversation.find({ workspace: req.workspaceId, visitor: visitor._id })
    .sort({ lastMessageAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: { visitor, conversations }
  });
});

export const listActiveVisitors = asyncHandler(async (req, res) => {
  const items = await Visitor.find({ workspace: req.workspaceId, isOnline: true })
    .populate("contact", "name email company")
    .sort({ lastActive: -1 })
    .limit(100);

  res.json({
    success: true,
    data: items
  });
});
