import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildFullAnalytics, getRecentActivity } from "../services/analytics.service.js";

export const getOverview = asyncHandler(async (req, res) => {
  const range = req.query.range || "7d";
  const workspaceId = req.workspaceId;

  const [analytics, recentActivity, onlineAgents] = await Promise.all([
    buildFullAnalytics(workspaceId, range),
    getRecentActivity(workspaceId),
    User.find({ workspace: workspaceId, status: { $in: ["online", "away"] }, isActive: true })
      .select("name email avatar title role status department stats")
      .sort({ status: 1, name: 1 })
  ]);

  res.json({
    success: true,
    data: {
      ...analytics,
      recentActivity,
      keyboardShortcuts: {
        globalSearch: "⌘K",
        nextConversation: "J",
        previousConversation: "K",
        resolve: "⌘↵",
        assignToMe: "A"
      },
      onlineAgents
    }
  });
});
