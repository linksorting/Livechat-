import mongoose from "mongoose";

const automationRuleSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["auto_assign", "auto_reply", "routing", "chatbot_flow", "faq_suggestion"],
      required: true
    },
    isEnabled: { type: Boolean, default: true },
    conditions: { type: mongoose.Schema.Types.Mixed, default: {} },
    actions: { type: mongoose.Schema.Types.Mixed, default: {} },
    flow: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

const AutomationRule = mongoose.model("AutomationRule", automationRuleSchema);
export default AutomationRule;
