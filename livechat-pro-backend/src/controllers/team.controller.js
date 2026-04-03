import crypto from "crypto";
import User from "../models/User.js";
import TeamInvite from "../models/TeamInvite.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createActivity } from "../services/notification.service.js";

export const listTeam = asyncHandler(async (req, res) => {
  const [users, invites] = await Promise.all([
    User.find({ workspace: req.workspaceId, isActive: true }).select("-password").sort({ createdAt: 1 }),
    TeamInvite.find({ workspace: req.workspaceId, status: "pending" }).sort({ createdAt: -1 })
  ]);

  res.json({
    success: true,
    data: { users, invites }
  });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const { email, role, department = "support" } = req.body;
  if (!email || !role) throw new ApiError(400, "email and role are required");

  const existing = await User.findOne({ workspace: req.workspaceId, email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "User already exists in this workspace");

  const invite = await TeamInvite.create({
    workspace: req.workspaceId,
    email,
    role,
    department,
    token: crypto.randomBytes(24).toString("hex"),
    invitedBy: req.user._id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  });

  await createActivity({
    workspace: req.workspaceId,
    actorUser: req.user._id,
    actorName: req.user.name,
    type: "team.invited",
    description: `Invited ${email} as ${role}`,
    targetType: "team_invite",
    targetId: invite._id
  });

  res.status(201).json({
    success: true,
    data: {
      invite,
      delivery: {
        mode: "placeholder",
        note: "Email sending is intentionally stubbed. Use the invite token/link in your frontend or mailer integration."
      }
    }
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!member) throw new ApiError(404, "Team member not found");

  const allowed = ["role", "title", "status", "department", "permissions", "name", "avatar"];
  allowed.forEach((field) => {
    if (field in req.body) member[field] = req.body[field];
  });

  await member.save();

  res.json({ success: true, data: member });
});

export const deactivateMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({ _id: req.params.id, workspace: req.workspaceId });
  if (!member) throw new ApiError(404, "Team member not found");

  member.isActive = false;
  member.status = "offline";
  await member.save();

  res.json({ success: true, message: "Team member deactivated" });
});
