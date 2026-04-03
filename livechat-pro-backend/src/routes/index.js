import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import conversationRoutes from "./conversation.routes.js";
import visitorRoutes from "./visitor.routes.js";
import contactRoutes from "./contact.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import settingsRoutes from "./settings.routes.js";
import savedReplyRoutes from "./savedReply.routes.js";
import automationRoutes from "./automation.routes.js";
import teamRoutes from "./team.routes.js";
import notificationRoutes from "./notification.routes.js";
import publicRoutes from "./public.routes.js";
import uploadRoutes from "./upload.routes.js";
import searchRoutes from "./search.routes.js";
import widgetRoutes from "./widget.js";
import chatRoutes from "./chat.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/conversations", conversationRoutes);

router.use("/visitors", visitorRoutes);
router.use("/contacts", contactRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/saved-replies", savedReplyRoutes);
router.use("/automation", automationRoutes);
router.use("/team", teamRoutes);
router.use("/notifications", notificationRoutes);
router.use("/public", publicRoutes);
router.use("/uploads", uploadRoutes);
router.use("/search", searchRoutes);
router.use("/widget", widgetRoutes);

router.use("/chat", chatRoutes);
export default router;
