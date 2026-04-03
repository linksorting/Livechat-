import Workspace from "../models/Workspace.js";
import Visitor from "../models/Visitor.js";
import Contact from "../models/Contact.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { assignConversationRoundRobin } from "./conversation.service.js";

export async function getWidgetConfigBySlug(slug) {
  const workspace = await Workspace.findOne({ slug });
  if (!workspace) return null;

  return {
    workspaceId: workspace._id,
    workspaceName: workspace.name,
    slug: workspace.slug,
    widget: workspace.widget,
    businessHours: workspace.businessHours,
    branding: workspace.branding
  };
}

export async function openWidgetSession({
  workspaceSlug,
  visitorToken,
  preChat = {},
  page = "/",
  referrer = "Direct",
  userAgent = "Unknown browser"
}) {
  const workspace = await Workspace.findOne({ slug: workspaceSlug });
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  let contact = null;

  if (preChat.email) {
    contact = await Contact.findOne({ workspace: workspace._id, email: preChat.email.toLowerCase() });
  }

  if (!contact && (preChat.name || preChat.email || preChat.phone)) {
    contact = await Contact.create({
      workspace: workspace._id,
      name: preChat.name || "Website visitor",
      email: preChat.email || "",
      phone: preChat.phone || "",
      tags: preChat.orderNumber ? ["order inquiry"] : [],
      notes: preChat.orderNumber ? `Order number provided: ${preChat.orderNumber}` : ""
    });
  }

  const anonymousId = visitorToken || `visitor_${Date.now()}`;

  let visitor = await Visitor.findOne({ workspace: workspace._id, anonymousId });
  if (!visitor) {
    visitor = await Visitor.create({
      workspace: workspace._id,
      anonymousId,
      contact: contact?._id || null,
      name: preChat.name || contact?.name || "Anonymous visitor",
      email: preChat.email || contact?.email || "",
      phone: preChat.phone || "",
      orderNumber: preChat.orderNumber || "",
      currentPage: page,
      currentlyBrowsing: page,
      referrer,
      browser: userAgent,
      pagesVisited: [{ url: page, title: page }],
      lastActive: new Date()
    });
  } else {
    visitor.currentPage = page;
    visitor.currentlyBrowsing = page;
    visitor.lastActive = new Date();
    visitor.isOnline = true;
    if (contact && !visitor.contact) visitor.contact = contact._id;
    await visitor.save();
  }

  let conversation = await Conversation.findOne({
    workspace: workspace._id,
    visitor: visitor._id,
    status: "open"
  }).sort({ createdAt: -1 });

  if (!conversation) {
    const assignedAgent = await assignConversationRoundRobin(workspace._id, workspace.routing.defaultDepartment);

    conversation = await Conversation.create({
      workspace: workspace._id,
      contact: contact?._id || null,
      visitor: visitor._id,
      subject: preChat.orderNumber ? `Order ${preChat.orderNumber}` : "Website chat",
      status: "open",
      priority: "medium",
      department: workspace.routing.defaultDepartment,
      assignedTo: assignedAgent?._id || null,
      tags: preChat.orderNumber ? ["order inquiry"] : ["website"],
      lastMessageAt: new Date()
    });

    await Message.create({
      workspace: workspace._id,
      conversation: conversation._id,
      senderType: "system",
      senderName: "LiveChat Pro",
      content: workspace.widget.texts.welcome,
      messageType: "system"
    });
  }

  const messages = await Message.find({
    conversation: conversation._id,
    isInternalNote: false
  }).sort({ createdAt: 1 });

  return {
    workspace,
    visitor,
    contact,
    conversation,
    messages
  };
}
