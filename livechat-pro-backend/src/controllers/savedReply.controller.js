import SavedReply from "../models/SavedReply.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listSavedReplies = asyncHandler(async (req, res) => {
  const items = await SavedReply.find({ workspace: req.workspaceId }).sort({ usageCount: -1, title: 1 });
  res.json({ success: true, data: items });
});

export const createSavedReply = asyncHandler(async (req, res) => {
  const { title, shortcut, content, category } = req.body;
  if (!title || !shortcut || !content) throw new ApiError(400, "title, shortcut and content are required");

  const reply = await SavedReply.create({
    workspace: req.workspaceId,
    title,
    shortcut,
    content,
    category: category || "General"
  });

  res.status(201).json({ success: true, data: reply });
});

export const updateSavedReply = asyncHandler(async (req, res) => {
  const reply = await SavedReply.findOneAndUpdate(
    { _id: req.params.id, workspace: req.workspaceId },
    { $set: req.body },
    { new: true }
  );

  if (!reply) throw new ApiError(404, "Saved reply not found");
  res.json({ success: true, data: reply });
});

export const deleteSavedReply = asyncHandler(async (req, res) => {
  const reply = await SavedReply.findOneAndDelete({ _id: req.params.id, workspace: req.workspaceId });
  if (!reply) throw new ApiError(404, "Saved reply not found");
  res.json({ success: true, message: "Saved reply deleted" });
});
