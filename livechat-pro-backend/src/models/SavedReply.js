import mongoose from "mongoose";

const savedReplySchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    title: { type: String, required: true },
    shortcut: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const SavedReply = mongoose.model("SavedReply", savedReplySchema);
export default SavedReply;
