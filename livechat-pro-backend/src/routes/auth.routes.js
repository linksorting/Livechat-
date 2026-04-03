import { Router } from "express";
import { login, me, register, setPresence } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.patch("/presence", protect, setPresence);

export default router;
