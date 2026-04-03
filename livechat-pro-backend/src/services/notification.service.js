import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";

export async function createNotification(io, payload) {
  const notification = await Notification.create(payload);

  if (payload.user) {
    io?.to(`user:${payload.user.toString()}`).emit("notification:new", notification);
  }

  io?.to(`workspace:${payload.workspace.toString()}`).emit("workspace:notification", notification);
  return notification;
}

export async function createActivity(payload) {
  return ActivityLog.create(payload);
}

export function emitConversation(io, conversationId, event, payload) {
  io?.to(`conversation:${conversationId.toString()}`).emit(event, payload);
}

export function emitWorkspace(io, workspaceId, event, payload) {
  io?.to(`workspace:${workspaceId.toString()}`).emit(event, payload);
}
