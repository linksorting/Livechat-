import dayjs from "dayjs";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { getDateRange } from "../utils/dates.js";

export async function getDashboardOverview(workspaceId, range = "7d") {
  const { start, end } = getDateRange(range);
  const baseMatch = { workspace: workspaceId, createdAt: { $gte: start, $lte: end } };

  const [activeVisitors, openChats, resolvedChats, agentsOnline, csatAgg, responseAgg] = await Promise.all([
    Visitor.countDocuments({ workspace: workspaceId, isOnline: true }),
    Conversation.countDocuments({ workspace: workspaceId, status: "open" }),
    Conversation.countDocuments({ workspace: workspaceId, status: "resolved", resolvedAt: { $gte: start, $lte: end } }),
    User.countDocuments({ workspace: workspaceId, status: "online", isActive: true }),
    Conversation.aggregate([
      { $match: baseMatch },
      { $match: { "csat.rating": { $in: ["happy", "neutral", "unhappy"] } } },
      {
        $group: {
          _id: "$csat.rating",
          count: { $sum: 1 }
        }
      }
    ]),
    Conversation.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          avgFirstResponse: { $avg: "$firstResponseTime" },
          avgResolution: { $avg: "$resolutionTime" }
        }
      }
    ])
  ]);

  const csatTotal = csatAgg.reduce((sum, item) => sum + item.count, 0);
  const happyCount = csatAgg.find((item) => item._id === "happy")?.count || 0;

  return {
    cards: {
      activeVisitors,
      openChats,
      resolvedChats,
      responseTime: Number(((responseAgg[0]?.avgFirstResponse || 0) / 60).toFixed(1)),
      satisfactionScore: csatTotal ? Number(((happyCount / csatTotal) * 100).toFixed(1)) : 0,
      agentOnlineCount: agentsOnline
    }
  };
}

export async function getChatVolume(workspaceId, range = "7d") {
  const { start, end } = getDateRange(range);

  const volume = await Conversation.aggregate([
    { $match: { workspace: workspaceId, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        chats: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
          }
        }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  return volume.map((item) => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`,
    chats: item.chats,
    resolved: item.resolved
  }));
}

export async function getBusiestHours(workspaceId, range = "7d") {
  const { start, end } = getDateRange(range);

  const hours = await Message.aggregate([
    { $match: { workspace: workspaceId, createdAt: { $gte: start, $lte: end }, senderType: { $in: ["customer", "agent"] } } },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        messages: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return Array.from({ length: 24 }).map((_, hour) => ({
    hour,
    messages: hours.find((item) => item._id === hour)?.messages || 0
  }));
}

export async function getAgentPerformance(workspaceId, range = "7d") {
  const { start, end } = getDateRange(range);

  const rows = await Conversation.aggregate([
    {
      $match: {
        workspace: workspaceId,
        createdAt: { $gte: start, $lte: end },
        assignedTo: { $ne: null }
      }
    },
    {
      $group: {
        _id: "$assignedTo",
        handled: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
          }
        },
        avgFirstResponse: { $avg: "$firstResponseTime" },
        avgResolution: { $avg: "$resolutionTime" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "agent"
      }
    },
    { $unwind: "$agent" },
    { $sort: { handled: -1 } }
  ]);

  return rows.map((item) => ({
    id: item._id,
    name: item.agent.name,
    email: item.agent.email,
    avatar: item.agent.avatar,
    department: item.agent.department,
    handled: item.handled,
    resolved: item.resolved,
    avgFirstResponseMins: Number(((item.avgFirstResponse || 0) / 60).toFixed(1)),
    avgResolutionMins: Number(((item.avgResolution || 0) / 60).toFixed(1))
  }));
}

export async function getCsatBreakdown(workspaceId, range = "30d") {
  const { start, end } = getDateRange(range);

  const rows = await Conversation.aggregate([
    {
      $match: {
        workspace: workspaceId,
        createdAt: { $gte: start, $lte: end },
        "csat.rating": { $in: ["happy", "neutral", "unhappy"] }
      }
    },
    {
      $group: {
        _id: "$csat.rating",
        total: { $sum: 1 }
      }
    }
  ]);

  const result = { happy: 0, neutral: 0, unhappy: 0 };
  rows.forEach((item) => {
    result[item._id] = item.total;
  });
  return result;
}

export async function getRecentActivity(workspaceId) {
  return ActivityLog.find({ workspace: workspaceId }).sort({ createdAt: -1 }).limit(10);
}

export async function buildFullAnalytics(workspaceId, range = "30d") {
  const [overview, volume, busiestHours, agentPerformance, csat] = await Promise.all([
    getDashboardOverview(workspaceId, range),
    getChatVolume(workspaceId, range),
    getBusiestHours(workspaceId, range),
    getAgentPerformance(workspaceId, range),
    getCsatBreakdown(workspaceId, range)
  ]);

  const missedChats = await Conversation.countDocuments({
    workspace: workspaceId,
    status: "missed"
  });

  return {
    ...overview,
    chatVolume: volume,
    busiestHours,
    agentPerformance,
    missedChats,
    csat
  };
}
