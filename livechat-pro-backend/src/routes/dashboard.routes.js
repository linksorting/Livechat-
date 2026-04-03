import { Router } from "express";
import { getOverview } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/overview", protect, getOverview);

export default router;
