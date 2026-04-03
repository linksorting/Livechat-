import mongoose from "mongoose";
import { DEFAULT_DEPARTMENTS } from "../constants/roles.js";

const businessHoursSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    timezone: { type: String, default: "Europe/London" },
    start: { type: String, default: "09:00" },
    end: { type: String, default: "18:00" },
    days: {
      type: [String],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }
  },
  { _id: false }
);

const widgetTextSchema = new mongoose.Schema(
  {
    greeting: { type: String, default: "Hi there 👋 How can we help today?" },
    welcome: { type: String, default: "We usually reply in a few minutes." },
    proactiveMessage: { type: String, default: "Need help finding the right answer?" },
    offlineMessage: { type: String, default: "We are offline right now. Leave a message and email and we will get back to you." },
    inputPlaceholder: { type: String, default: "Type your message..." },
    preChatTitle: { type: String, default: "Start a conversation" },
    preChatSubtitle: { type: String, default: "Tell us a little about yourself" }
  },
  { _id: false }
);

const widgetSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: "#5B6CFF" },
    logoUrl: { type: String, default: "" },
    position: { type: String, enum: ["bottom-right", "bottom-left"], default: "bottom-right" },
    bubbleStyle: { type: String, enum: ["circle", "rounded"], default: "rounded" },
    chatBubbleLabel: { type: String, default: "Chat with us" },
    proactiveDelaySeconds: { type: Number, default: 12 },
    soundEnabled: { type: Boolean, default: true },
    darkModeEnabled: { type: Boolean, default: false },
    multilingualReady: { type: Boolean, default: true },
    texts: { type: widgetTextSchema, default: () => ({}) },
    preChatFields: {
      name: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      phone: { type: Boolean, default: false },
      orderNumber: { type: Boolean, default: false }
    }
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    email: { type: Boolean, default: true },
    browser: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    missedChatsEmail: { type: Boolean, default: true },
    dailyDigest: { type: Boolean, default: false }
  },
  { _id: false }
);

const routingSchema = new mongoose.Schema(
  {
    roundRobin: { type: Boolean, default: true },
    awayAutoReply: { type: Boolean, default: true },
    offlineAutoReply: { type: Boolean, default: true },
    defaultDepartment: { type: String, default: "support" },
    departments: { type: [String], default: DEFAULT_DEPARTMENTS }
  },
  { _id: false }
);

const brandingSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "LiveChat Pro" },
    supportEmail: { type: String, default: "help@livechatpro.demo" },
    website: { type: String, default: "https://livechatpro.demo" },
    primaryColor: { type: String, default: "#5B6CFF" }
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    locale: { type: String, default: "en" },
    timezone: { type: String, default: "Europe/London" },
    businessHours: { type: businessHoursSchema, default: () => ({}) },
    widget: { type: widgetSchema, default: () => ({}) },
    notifications: { type: notificationSchema, default: () => ({}) },
    routing: { type: routingSchema, default: () => ({}) },
    branding: { type: brandingSchema, default: () => ({}) },
    apiPlaceholders: {
      webhookUrl: { type: String, default: "" },
      apiKeyLabel: { type: String, default: "demo_api_key_placeholder" }
    },
    shortcuts: {
      globalSearch: { type: String, default: "⌘K" },
      reply: { type: String, default: "R" },
      resolve: { type: String, default: "⌘↵" }
    }
  },
  { timestamps: true }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
