import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    title: { type: String, default: "Support Agent" },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: [ROLES.OWNER, ROLES.ADMIN, ROLES.AGENT, ROLES.VIEWER],
      default: ROLES.AGENT
    },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "online"
    },
    permissions: { type: [String], default: [] },
    department: { type: String, default: "support" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lastSeenAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    stats: {
      conversationsHandled: { type: Number, default: 0 },
      avgFirstResponseMins: { type: Number, default: 2.8 },
      csatScore: { type: Number, default: 92 }
    }
  },
  { timestamps: true }
);

userSchema.index({ workspace: 1, email: 1 }, { unique: true });

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
