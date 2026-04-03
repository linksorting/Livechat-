import mongoose from "mongoose";

const teamInviteSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true },
    department: { type: String, default: "support" },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

const TeamInvite = mongoose.model("TeamInvite", teamInviteSchema);
export default TeamInvite;
