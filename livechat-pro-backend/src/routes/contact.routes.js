import { Router } from "express";
import {
  exportContactsCsv,
  getContact,
  listContacts,
  mergeContacts,
  updateContact
} from "../controllers/contact.controller.js";
import { protect, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("contacts.read"), listContacts);
router.get("/export/csv", requirePermission("contacts.read"), exportContactsCsv);
router.post("/merge", requirePermission("contacts.write"), mergeContacts);
router.get("/:id", requirePermission("contacts.read"), getContact);
router.patch("/:id", requirePermission("contacts.write"), updateContact);

export default router;
