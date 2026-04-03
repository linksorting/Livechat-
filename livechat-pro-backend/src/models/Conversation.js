import mongoose from "mongoose";

const csatSchema = new mongoose.Schema(
  {
    rating: { type: String, enum: ["happy", "neutral", "unhappy", ""], default: "" },
    feedback: { type: String, default: "" },
    respondedAt: { type: Date, default: null }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", default: null },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", default: null },
    subject: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "resolved", "missed", "spam"],
      default: "open",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    channel: { type: String, enum: ["website", "email", "whatsapp"], default: "website" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: String, default: "support", index: true },
    tags: { type: [String], default: [] },
    lastMessagePreview: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    unreadCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    firstResponseTime: { type: Number, default: 0 },
    resolutionTime: { type: Number, default: 0 },
    csat: { type: csatSchema, default: () => ({}) },
    startedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

conversationSchema.index({ workspace: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ workspace: 1, assignedTo: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;


// import mongoose from "mongoose";

// // 🔹 CSAT Schema
// const csatSchema = new mongoose.Schema(
//   {
//     rating: { type: String, enum: ["happy", "neutral", "unhappy", ""], default: "" },
//     feedback: { type: String, default: "" },
//     respondedAt: { type: Date, default: null }
//   },
//   { _id: false }
// );

// // 🔹 Conversation Schema
// const conversationSchema = new mongoose.Schema(
//   {
//     // 🏢 Workspace (multi-tenant support)
//     workspace: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Workspace",
//       required: true,
//       index: true
//     },

//     // 👤 Linked entities
//     contact: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Contact",
//       default: null
//     },
//     visitor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Visitor",
//       default: null
//     },

//     // 🔥 Visitor snapshot (FAST access)
//     visitorName: { type: String, default: "", index: true },
//     visitorEmail: { type: String, default: "", index: true },
//     visitorPhone: { type: String, default: "" },

//     // 🧾 Optional order info
//     orderNumber: { type: String, default: "", index: true },

//     // 💬 Conversation info
//     subject: { type: String, default: "" },

//     status: {
//       type: String,
//       enum: ["open", "resolved", "missed", "spam"],
//       default: "open",
//       index: true
//     },

//     priority: {
//       type: String,
//       enum: ["low", "medium", "high", "urgent"],
//       default: "medium"
//     },

//     // 📡 Channel / source
//     channel: {
//       type: String,
//       enum: ["website", "email", "whatsapp", "instagram", "facebook"],
//       default: "website",
//       index: true
//     },

//     // 👨‍💻 Assignment
//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//       index: true
//     },

//     department: {
//       type: String,
//       default: "support",
//       index: true
//     },

//     tags: {
//       type: [String],
//       default: []
//     },

//     // 💬 Last message info
//     lastMessagePreview: { type: String, default: "" },
//     lastMessageAt: { type: Date, default: Date.now, index: true },
//     lastMessageSender: {
//       type: String,
//       enum: ["agent", "visitor"],
//       default: "visitor"
//     },

//     unreadCount: { type: Number, default: 0 },

//     // ⭐ UI features
//     isPinned: { type: Boolean, default: false },
//     isStarred: { type: Boolean, default: false },

//     // ⏱️ Performance tracking
//     firstResponseTime: { type: Number, default: 0 },
//     resolutionTime: { type: Number, default: 0 },

//     // 😊 Customer satisfaction
//     csat: {
//       type: csatSchema,
//       default: () => ({})
//     },

//     // 🕒 Timeline
//     startedAt: { type: Date, default: Date.now },
//     resolvedAt: { type: Date, default: null },
//     closedAt: { type: Date, default: null }
//   },
//   { timestamps: true }
// );

// // 🔥 Indexes (performance boost)
// conversationSchema.index({ workspace: 1, status: 1, lastMessageAt: -1 });
// conversationSchema.index({ workspace: 1, assignedTo: 1 });
// conversationSchema.index({ workspace: 1, visitorEmail: 1 });

// // 🔹 Model export
// const Conversation = mongoose.model("Conversation", conversationSchema);
// export default Conversation;