import { Router } from "express";
import {
  getBusinessHours,
  getNotificationSettings,
  getRoutingSettings,
  getWidgetSettings,
  getWorkspaceSettings,
  updateBusinessHours,
  updateNotificationSettings,
  updateRoutingSettings,
  updateWidgetSettings,
  updateWorkspaceSettings
} from "../controllers/settings.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/workspace", requirePermission("settings.read"), getWorkspaceSettings);
router.patch("/workspace", requirePermission("settings.write"), updateWorkspaceSettings);

router.get("/widget", requirePermission("settings.read"), getWidgetSettings);
router.patch("/widget", requirePermission("settings.write"), updateWidgetSettings);

router.get("/business-hours", requirePermission("settings.read"), getBusinessHours);
router.patch("/business-hours", requirePermission("settings.write"), updateBusinessHours);

router.get("/notifications", requirePermission("settings.read"), getNotificationSettings);
router.patch("/notifications", requirePermission("settings.write"), updateNotificationSettings);

router.get("/routing", requirePermission("settings.read"), getRoutingSettings);
router.patch("/routing", requirePermission("settings.write"), updateRoutingSettings);

export default router;
