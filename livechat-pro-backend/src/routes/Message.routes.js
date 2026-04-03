import { Router } from "express";
import {
  listMessages,
  editMessage,
  deleteMessage,
  markMessageRead
} from "../controllers/Message.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", requirePermission("inbox.read"), listMessages);
router.patch("/:messageId", requirePermission("inbox.write"), editMessage);
router.delete("/:messageId", requirePermission("inbox.write"), deleteMessage);
router.patch("/:messageId/read", requirePermission("inbox.write"), markMessageRead);

export default router; // ✅ Default export