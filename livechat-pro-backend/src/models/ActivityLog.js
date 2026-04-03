import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    actorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    targetType: { type: String, default: "" },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
