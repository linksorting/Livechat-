import { Router } from "express";
import { getVisitor, listActiveVisitors, listVisitors } from "../controllers/visitor.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("visitors.read"), listVisitors);
router.get("/active", requirePermission("visitors.read"), listActiveVisitors);
router.get("/:id", requirePermission("visitors.read"), getVisitor);

export default router;
