import { asyncHandler } from "../utils/asyncHandler.js";
import {
  buildFullAnalytics,
  getAgentPerformance,
  getBusiestHours,
  getChatVolume,
  getCsatBreakdown
} from "../services/analytics.service.js";

export const getAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const data = await buildFullAnalytics(req.workspaceId, range);
  res.json({ success: true, data });
});

export const getVolume = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const data = await getChatVolume(req.workspaceId, range);
  res.json({ success: true, data });
});

export const getPerformance = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const data = await getAgentPerformance(req.workspaceId, range);
  res.json({ success: true, data });
});

export const getBusiest = asyncHandler(async (req, res) => {
  const range = req.query.range || "7d";
  const data = await getBusiestHours(req.workspaceId, range);
  res.json({ success: true, data });
});

export const getCsat = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const data = await getCsatBreakdown(req.workspaceId, range);
  res.json({ success: true, data });
});
