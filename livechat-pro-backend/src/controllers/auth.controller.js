import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { signToken } from "../utils/tokens.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const { workspaceName, name, email, password } = req.body;

  if (!workspaceName || !name || !email || !password) {
    throw new ApiError(400, "workspaceName, name, email and password are required");
  }

  const slug = workspaceName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existingWorkspace = await Workspace.findOne({ slug });
  if (existingWorkspace) {
    throw new ApiError(409, "Workspace slug already exists");
  }

  const workspace = await Workspace.create({
    name: workspaceName,
    slug
  });

  const user = await User.create({
    workspace: workspace._id,
    name,
    email,
    password,
    role: "owner",
    title: "Owner"
  });

  const token = signToken({ sub: user._id.toString(), workspaceId: workspace._id.toString() });

  res.status(201).json({
    success: true,
    message: "Workspace created",
    data: {
      token,
      user: {
        id: user._id,
        workspaceId: workspace._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password").populate("workspace");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastSeenAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id.toString(), workspaceId: user.workspace._id.toString() });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        workspaceId: user.workspace._id,
        workspaceName: user.workspace.name,
        workspaceSlug: user.workspace.slug,
        name: user.name,
        email: user.email,
        title: user.title,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        department: user.department,
        shortcuts: user.workspace.shortcuts
      }
    }
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      workspaceId: req.user.workspace._id,
      workspaceName: req.user.workspace.name,
      workspaceSlug: req.user.workspace.slug,
      name: req.user.name,
      email: req.user.email,
      title: req.user.title,
      role: req.user.role,
      status: req.user.status,
      avatar: req.user.avatar,
      department: req.user.department,
      permissions: req.user.permissions,
      shortcuts: req.user.workspace.shortcuts
    }
  });
});

export const setPresence = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["online", "away", "offline"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  req.user.status = status;
  req.user.lastSeenAt = new Date();
  await req.user.save();

  req.app.locals.io?.to(`workspace:${req.user.workspace._id.toString()}`).emit("agent:presence", {
    userId: req.user._id,
    status,
    name: req.user.name
  });

  res.json({
    success: true,
    data: {
      status
    }
  });
});
