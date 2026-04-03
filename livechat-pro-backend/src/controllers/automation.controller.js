import AutomationRule from "../models/AutomationRule.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAutomation = asyncHandler(async (req, res) => {
  const items = await AutomationRule.find({ workspace: req.workspaceId }).sort({ updatedAt: -1 });
  res.json({ success: true, data: items });
});

export const createAutomation = asyncHandler(async (req, res) => {
  const { name, type, conditions = {}, actions = {}, flow = null } = req.body;
  if (!name || !type) throw new ApiError(400, "name and type are required");

  const item = await AutomationRule.create({
    workspace: req.workspaceId,
    name,
    type,
    conditions,
    actions,
    flow
  });

  res.status(201).json({ success: true, data: item });
});

export const updateAutomation = asyncHandler(async (req, res) => {
  const item = await AutomationRule.findOneAndUpdate(
    { _id: req.params.id, workspace: req.workspaceId },
    { $set: req.body },
    { new: true }
  );

  if (!item) throw new ApiError(404, "Automation rule not found");
  res.json({ success: true, data: item });
});

export const deleteAutomation = asyncHandler(async (req, res) => {
  const item = await AutomationRule.findOneAndDelete({ _id: req.params.id, workspace: req.workspaceId });
  if (!item) throw new ApiError(404, "Automation rule not found");
  res.json({ success: true, message: "Automation rule deleted" });
});

export const getFlowTemplates = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "support-triage",
        name: "Support triage",
        nodes: [
          { id: "start", type: "ask_question", label: "How can we help today?" },
          { id: "buttons", type: "button_choices", options: ["Order issue", "Billing", "Talk to sales"] },
          { id: "collect_email", type: "collect_email" },
          { id: "route", type: "route_to_team", department: "support" },
          { id: "handoff", type: "handoff_to_live_agent" }
        ]
      }
    ]
  });
});
