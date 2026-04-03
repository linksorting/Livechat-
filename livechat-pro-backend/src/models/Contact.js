import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    avatar: { type: String, default: "" },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
    totalChats: { type: Number, default: 0 },
    lastConversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", default: null },
    meta: {
      location: { type: String, default: "" },
      browser: { type: String, default: "" },
      device: { type: String, default: "" },
      firstSeen: { type: Date, default: Date.now },
      lastActive: { type: Date, default: Date.now },
      referrer: { type: String, default: "" },
      pagesVisited: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

contactSchema.index({ workspace: 1, email: 1 });

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
