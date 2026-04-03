import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

export async function assignConversationRoundRobin(workspaceId, department = "support") {
  const agents = await User.find({
    workspace: workspaceId,
    department,
    status: { $in: ["online", "away"] },
    isActive: true,
    role: { $in: ["owner", "admin", "support_agent"] }
  }).sort({ "stats.conversationsHandled": 1, lastSeenAt: -1 });

  return agents[0] || null;
}

export async function hydrateConversation(conversationId, workspaceId) {
  return Conversation.findOne({ _id: conversationId, workspace: workspaceId })
    .populate("assignedTo", "name email avatar title role status department")
    .populate("contact")
    .populate("visitor");
}
