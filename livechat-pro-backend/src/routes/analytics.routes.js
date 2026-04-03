import { Router } from "express";
import {
  getAnalytics,
  getBusiest,
  getCsat,
  getPerformance,
  getVolume
} from "../controllers/analytics.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("analytics.read"), getAnalytics);
router.get("/volume", requirePermission("analytics.read"), getVolume);
router.get("/performance", requirePermission("analytics.read"), getPerformance);
router.get("/busiest-hours", requirePermission("analytics.read"), getBusiest);
router.get("/csat", requirePermission("analytics.read"), getCsat);

export default router;
