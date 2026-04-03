import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 }
  },
  { _id: false }
);

const readBySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderType: {
      type: String,
      enum: ["customer", "agent", "system", "bot"],
      required: true
    },
    senderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    senderVisitor: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor", default: null },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: "" },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "note", "system"],
      default: "text"
    },
    isInternalNote: { type: Boolean, default: false },
    attachments: { type: [attachmentSchema], default: [] },
    isRead: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: true },
    readBy: { type: [readBySchema], default: [] },
    deliveredAt: { type: Date, default: Date.now },
    seenAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;


// import mongoose from "mongoose";

// // 📎 Attachment Schema
// const attachmentSchema = new mongoose.Schema(
//   {
//     url: { type: String, required: true },
//     name: { type: String, required: true },
//     mimeType: { type: String, default: "" },
//     size: { type: Number, default: 0 }
//   },
//   { _id: false }
// );

// // 👁️ Read By Schema (multi-agent read tracking)
// const readBySchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     readAt: { type: Date, default: Date.now }
//   },
//   { _id: false }
// );

// // 💬 Message Schema
// const messageSchema = new mongoose.Schema(
//   {
//     // 🏢 Workspace
//     workspace: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Workspace",
//       required: true,
//       index: true
//     },

//     // 💬 Conversation link
//     conversation: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Conversation",
//       required: true,
//       index: true
//     },

//     // 👤 Sender info
//     senderType: {
//       type: String,
//       enum: ["visitor", "agent", "system", "bot"],
//       required: true,
//       index: true
//     },

//     senderUser: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null
//     },

//     senderVisitor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Visitor",
//       default: null
//     },

//     // 🔥 Snapshot (fast UI)
//     senderName: { type: String, required: true },
//     senderAvatar: { type: String, default: "" },

//     // 💬 Message content
//     message: { type: String, required: true },

//     messageType: {
//       type: String,
//       enum: ["text", "image", "file", "note", "system"],
//       default: "text"
//     },

//     // 🔒 Internal notes (only agents can see)
//     isInternalNote: { type: Boolean, default: false },

//     // 📎 Attachments
//     attachments: {
//       type: [attachmentSchema],
//       default: []
//     },

//     // 📩 Delivery & Read
//     isDelivered: { type: Boolean, default: true },
//     deliveredAt: { type: Date, default: Date.now },

//     isRead: { type: Boolean, default: false },
//     seenAt: { type: Date, default: null },

//     readBy: {
//       type: [readBySchema],
//       default: []
//     },

//     // ✏️ Edit / Delete
//     isDeleted: { type: Boolean, default: false },
//     editedAt: { type: Date, default: null }
//   },
//   { timestamps: true }
// );

// // 🔥 Indexes (performance boost)
// messageSchema.index({ conversation: 1, createdAt: 1 });
// messageSchema.index({ workspace: 1, conversation: 1 });

// // 🔹 Model export
// const Message = mongoose.model("Message", messageSchema);
// export default Message;