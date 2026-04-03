import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({
    workspace: req.workspaceId,
    $or: [{ user: req.user._id }, { user: null }]
  })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, data: items });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, workspace: req.workspaceId },
    { $set: { isRead: true } },
    { new: true }
  );

  res.json({ success: true, data: item });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { workspace: req.workspaceId, $or: [{ user: req.user._id }, { user: null }] },
    { $set: { isRead: true } }
  );

  res.json({ success: true, message: "All notifications marked as read" });
});
