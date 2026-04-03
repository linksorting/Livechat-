import express from "express";
import { openWidgetSession } from "../services/widget.service.js";

const router = express.Router();

router.post("/session", async (req, res) => {
  try {
    const data = await openWidgetSession(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;