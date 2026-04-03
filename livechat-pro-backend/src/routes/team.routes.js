import { Router } from "express";
import {
  deactivateMember,
  inviteMember,
  listTeam,
  updateMember
} from "../controllers/team.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("team.read"), listTeam);
router.post("/invite", requirePermission("team.write"), inviteMember);
router.patch("/:id", requirePermission("team.write"), updateMember);
router.delete("/:id", requirePermission("team.write"), deactivateMember);

export default router;
