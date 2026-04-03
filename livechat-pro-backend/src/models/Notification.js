import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
