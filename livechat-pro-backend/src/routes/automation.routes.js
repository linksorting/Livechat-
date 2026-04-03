import { Router } from "express";
import {
  createAutomation,
  deleteAutomation,
  getFlowTemplates,
  listAutomation,
  updateAutomation
} from "../controllers/automation.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("automation.read"), listAutomation);
router.get("/flow-templates", requirePermission("automation.read"), getFlowTemplates);
router.post("/", requirePermission("automation.write"), createAutomation);
router.patch("/:id", requirePermission("automation.write"), updateAutomation);
router.delete("/:id", requirePermission("automation.write"), deleteAutomation);

export default router;
