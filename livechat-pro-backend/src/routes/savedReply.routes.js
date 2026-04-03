import { Router } from "express";
import {
  createSavedReply,
  deleteSavedReply,
  listSavedReplies,
  updateSavedReply
} from "../controllers/savedReply.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("settings.read"), listSavedReplies);
router.post("/", requirePermission("settings.write"), createSavedReply);
router.patch("/:id", requirePermission("settings.write"), updateSavedReply);
router.delete("/:id", requirePermission("settings.write"), deleteSavedReply);

export default router;
