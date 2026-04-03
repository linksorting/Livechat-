import mongoose from "mongoose";

const pageVisitSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    title: { type: String, default: "" },
    visitedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const visitorSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", default: null },
    name: { type: String, default: "Anonymous visitor" },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "" },
    orderNumber: { type: String, default: "" },
    isOnline: { type: Boolean, default: true },
    currentPage: { type: String, default: "/" },
    location: { type: String, default: "Unknown" },
    country: { type: String, default: "Unknown" },
    city: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    device: { type: String, default: "Desktop" },
    os: { type: String, default: "Unknown" },
    referrer: { type: String, default: "Direct" },
    pagesVisited: { type: [pageVisitSchema], default: [] },
    firstSeen: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    totalVisits: { type: Number, default: 1 },
    currentlyBrowsing: { type: String, default: "/" }
  },
  { timestamps: true }
);

visitorSchema.index({ workspace: 1, anonymousId: 1 }, { unique: true });

const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
