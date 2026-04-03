import { Router } from "express";
import {
  addInternalNote,
  assignConversation,
  createConversation,
  getConversation,
  listConversations,
  markRead,
  sendMessage,
  submitCsat,
  updateMeta,
  updateStatus
} from "../controllers/conversation.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("inbox.read"), listConversations);
router.post("/", requirePermission("inbox.write"), createConversation);
router.get("/:id", requirePermission("inbox.read"), getConversation);
router.post("/:id/messages", requirePermission("inbox.write"), sendMessage);
router.post("/:id/notes", requirePermission("inbox.write"), addInternalNote);
router.patch("/:id/assign", requirePermission("inbox.write"), assignConversation);
router.patch("/:id/status", requirePermission("inbox.write"), updateStatus);
router.patch("/:id/meta", requirePermission("inbox.write"), updateMeta);
router.patch("/:id/read", requirePermission("inbox.write"), markRead);
router.post("/:id/csat", requirePermission("inbox.write"), submitCsat);

export default router;
