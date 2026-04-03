import Workspace from "../models/Workspace.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";

async function getWorkspace(req) {
  const workspace = await Workspace.findById(req.workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found");
  return workspace;
}

export const getWorkspaceSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  res.json({
    success: true,
    data: workspace
  });
});

export const updateWorkspaceSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  const allowed = ["name", "locale", "timezone", "branding", "apiPlaceholders"];
  allowed.forEach((field) => {
    if (field in req.body) workspace[field] = req.body[field];
  });
  await workspace.save();
  res.json({ success: true, data: workspace });
});

export const getWidgetSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  res.json({ success: true, data: workspace.widget });
});

export const updateWidgetSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  workspace.widget = {
    ...workspace.widget.toObject(),
    ...req.body,
    texts: {
      ...workspace.widget.texts,
      ...(req.body.texts || {})
    },
    preChatFields: {
      ...workspace.widget.preChatFields,
      ...(req.body.preChatFields || {})
    }
  };
  await workspace.save();
  res.json({ success: true, data: workspace.widget });
});

export const getBusinessHours = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  res.json({ success: true, data: workspace.businessHours });
});

export const updateBusinessHours = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  workspace.businessHours = {
    ...workspace.businessHours.toObject(),
    ...req.body
  };
  await workspace.save();
  res.json({ success: true, data: workspace.businessHours });
});

export const getNotificationSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  res.json({ success: true, data: workspace.notifications });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  workspace.notifications = {
    ...workspace.notifications.toObject(),
    ...req.body
  };
  await workspace.save();
  res.json({ success: true, data: workspace.notifications });
});

export const getRoutingSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  res.json({ success: true, data: workspace.routing });
});

export const updateRoutingSettings = asyncHandler(async (req, res) => {
  const workspace = await getWorkspace(req);
  workspace.routing = {
    ...workspace.routing.toObject(),
    ...req.body
  };
  await workspace.save();
  res.json({ success: true, data: workspace.routing });
});
