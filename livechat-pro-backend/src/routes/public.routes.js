import { Router } from "express";
import {
  createSession,
  getPublicConversation,
  getWidgetConfig,
  markPublicRead,
  sendPublicMessage,
  trackVisitor
} from "../controllers/publicWidget.controller.js";

const router = Router();

router.get("/widget/:workspaceSlug/config", getWidgetConfig);
router.post("/widget/session", createSession);
router.get("/widget/conversations/:conversationId", getPublicConversation);
router.post("/widget/conversations/:conversationId/messages", sendPublicMessage);
router.post("/widget/conversations/:conversationId/read", markPublicRead);
router.post("/widget/track", trackVisitor);

export default router;
