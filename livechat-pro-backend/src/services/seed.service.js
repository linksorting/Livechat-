import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import Visitor from "../models/Visitor.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import SavedReply from "../models/SavedReply.js";
import AutomationRule from "../models/AutomationRule.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import TeamInvite from "../models/TeamInvite.js";

const avatars = {
  owner: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
  admin: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
  agent1: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
  agent2: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
  customer1: "https://api.dicebear.com/7.x/initials/svg?seed=Emma Johnson",
  customer2: "https://api.dicebear.com/7.x/initials/svg?seed=Lucas Reed",
  customer3: "https://api.dicebear.com/7.x/initials/svg?seed=Mia Alvarez",
  customer4: "https://api.dicebear.com/7.x/initials/svg?seed=Daniel Park"
};

async function clearWorkspace(workspaceId) {
  await Promise.all([
    User.deleteMany({ workspace: workspaceId }),
    Contact.deleteMany({ workspace: workspaceId }),
    Visitor.deleteMany({ workspace: workspaceId }),
    Conversation.deleteMany({ workspace: workspaceId }),
    Message.deleteMany({ workspace: workspaceId }),
    SavedReply.deleteMany({ workspace: workspaceId }),
    AutomationRule.deleteMany({ workspace: workspaceId }),
    Notification.deleteMany({ workspace: workspaceId }),
    ActivityLog.deleteMany({ workspace: workspaceId }),
    TeamInvite.deleteMany({ workspace: workspaceId })
  ]);
}

export async function seedIfEmpty() {
  const existing = await Workspace.countDocuments();
  if (existing) {
    console.log("Seed skipped: workspace already exists");
    return;
  }
  await seedDemo();
}

export async function seedDemo() {
  let workspace = await Workspace.findOne({ slug: "livechat-pro-demo" });

  if (workspace) {
    await clearWorkspace(workspace._id);
  } else {
    workspace = await Workspace.create({
      name: "LiveChat Pro Demo",
      slug: "livechat-pro-demo",
      timezone: "Europe/London",
      locale: "en",
      branding: {
        companyName: "LiveChat Pro Demo",
        supportEmail: "help@livechatpro.demo",
        website: "https://demo.livechatpro.local"
      },
      widget: {
        primaryColor: "#5B6CFF",
        bubbleStyle: "rounded",
        position: "bottom-right",
        proactiveDelaySeconds: 10,
        texts: {
          greeting: "Hi there 👋 Want help choosing the best plan?",
          welcome: "Welcome to LiveChat Pro. A support teammate will join shortly.",
          proactiveMessage: "Questions about pricing, setup, or billing? We’re here.",
          offlineMessage: "We’re offline. Leave your message and email, and we’ll reply shortly.",
          inputPlaceholder: "Write a message...",
          preChatTitle: "Start chatting",
          preChatSubtitle: "Tell us a bit about yourself"
        },
        preChatFields: {
          name: true,
          email: true,
          phone: false,
          orderNumber: true
        }
      }
    });
  }

  const [owner, admin, agent1, agent2, viewer] = await User.create([
    {
      workspace: workspace._id,
      name: "Olivia Carter",
      email: "owner@livechatpro.demo",
      password: "Password123!",
      role: "owner",
      title: "Founder & Owner",
      status: "online",
      department: "support",
      avatar: avatars.owner
    },
    {
      workspace: workspace._id,
      name: "Marcus Bennett",
      email: "admin@livechatpro.demo",
      password: "Password123!",
      role: "admin",
      title: "Support Operations Lead",
      status: "online",
      department: "support",
      avatar: avatars.admin
    },
    {
      workspace: workspace._id,
      name: "Sophia Nguyen",
      email: "sophia@livechatpro.demo",
      password: "Password123!",
      role: "support_agent",
      title: "Senior Support Specialist",
      status: "online",
      department: "support",
      avatar: avatars.agent1,
      stats: { conversationsHandled: 64, avgFirstResponseMins: 1.9, csatScore: 96 }
    },
    {
      workspace: workspace._id,
      name: "Noah Brooks",
      email: "noah@livechatpro.demo",
      password: "Password123!",
      role: "support_agent",
      title: "Billing Specialist",
      status: "away",
      department: "billing",
      avatar: avatars.agent2,
      stats: { conversationsHandled: 51, avgFirstResponseMins: 2.4, csatScore: 93 }
    },
    {
      workspace: workspace._id,
      name: "Evelyn Ross",
      email: "viewer@livechatpro.demo",
      password: "Password123!",
      role: "viewer",
      title: "CX Analyst",
      status: "offline",
      department: "general"
    }
  ]);

  const contacts = await Contact.create([
    {
      workspace: workspace._id,
      name: "Emma Johnson",
      email: "emma@northstarretail.com",
      phone: "+44 7700 900001",
      company: "Northstar Retail",
      avatar: avatars.customer1,
      tags: ["vip", "enterprise"],
      notes: "Evaluating annual plan for a 12-person support team.",
      totalChats: 5,
      meta: {
        location: "London, UK",
        browser: "Chrome",
        device: "MacBook Pro",
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        lastActive: new Date(Date.now() - 1000 * 60 * 3),
        referrer: "Google Ads",
        pagesVisited: ["/pricing", "/integrations", "/contact-sales"]
      }
    },
    {
      workspace: workspace._id,
      name: "Lucas Reed",
      email: "lucas@brightcart.io",
      phone: "+1 555 210 1198",
      company: "BrightCart",
      avatar: avatars.customer2,
      tags: ["billing"],
      notes: "Asked about invoice changes and seat-based pricing.",
      totalChats: 3,
      meta: {
        location: "Austin, US",
        browser: "Safari",
        device: "iPhone 15",
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        lastActive: new Date(Date.now() - 1000 * 60 * 12),
        referrer: "Direct",
        pagesVisited: ["/billing", "/docs/api"]
      }
    },
    {
      workspace: workspace._id,
      name: "Mia Alvarez",
      email: "mia@stellarstyle.co",
      phone: "+34 622 000 111",
      company: "Stellar Style",
      avatar: avatars.customer3,
      tags: ["sales", "trial"],
      notes: "Highly engaged. Wants widget customization demo.",
      totalChats: 6,
      meta: {
        location: "Barcelona, ES",
        browser: "Edge",
        device: "Windows Laptop",
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        lastActive: new Date(Date.now() - 1000 * 60 * 45),
        referrer: "Product Hunt",
        pagesVisited: ["/", "/features/live-inbox", "/demo"]
      }
    },
    {
      workspace: workspace._id,
      name: "Daniel Park",
      email: "daniel@urbannest.shop",
      phone: "+1 555 909 2040",
      company: "Urban Nest",
      avatar: avatars.customer4,
      tags: ["support", "integration"],
      notes: "Needs help with installation snippet and routing rules.",
      totalChats: 4,
      meta: {
        location: "Seattle, US",
        browser: "Firefox",
        device: "Desktop",
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        lastActive: new Date(Date.now() - 1000 * 60 * 9),
        referrer: "Docs",
        pagesVisited: ["/docs/install", "/features/automation", "/support"]
      }
    }
  ]);

  const visitors = await Visitor.create([
    {
      workspace: workspace._id,
      anonymousId: "vis_001",
      contact: contacts[0]._id,
      name: contacts[0].name,
      email: contacts[0].email,
      isOnline: true,
      currentPage: "/pricing",
      currentlyBrowsing: "/pricing",
      location: "London, UK",
      country: "United Kingdom",
      city: "London",
      browser: "Chrome 136",
      device: "MacBook Pro",
      os: "macOS",
      referrer: "Google Ads",
      pagesVisited: [
        { url: "/", title: "Home" },
        { url: "/pricing", title: "Pricing" }
      ],
      firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 4),
      lastActive: new Date(Date.now() - 1000 * 60 * 2),
      totalVisits: 4
    },
    {
      workspace: workspace._id,
      anonymousId: "vis_002",
      contact: contacts[1]._id,
      name: contacts[1].name,
      email: contacts[1].email,
      isOnline: false,
      currentPage: "/billing",
      currentlyBrowsing: "/billing",
      location: "Austin, US",
      country: "United States",
      city: "Austin",
      browser: "Safari",
      device: "iPhone 15",
      os: "iOS",
      referrer: "Direct",
      pagesVisited: [{ url: "/billing", title: "Billing" }],
      firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24),
      lastActive: new Date(Date.now() - 1000 * 60 * 35),
      totalVisits: 2
    },
    {
      workspace: workspace._id,
      anonymousId: "vis_003",
      contact: contacts[2]._id,
      name: contacts[2].name,
      email: contacts[2].email,
      isOnline: true,
      currentPage: "/demo",
      currentlyBrowsing: "/demo",
      location: "Barcelona, ES",
      country: "Spain",
      city: "Barcelona",
      browser: "Edge",
      device: "Windows Laptop",
      os: "Windows 11",
      referrer: "Product Hunt",
      pagesVisited: [
        { url: "/", title: "Home" },
        { url: "/features/live-inbox", title: "Live inbox" },
        { url: "/demo", title: "Request demo" }
      ],
      firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 12),
      lastActive: new Date(Date.now() - 1000 * 60 * 1),
      totalVisits: 7
    },
    {
      workspace: workspace._id,
      anonymousId: "vis_004",
      contact: contacts[3]._id,
      name: contacts[3].name,
      email: contacts[3].email,
      isOnline: true,
      currentPage: "/docs/install",
      currentlyBrowsing: "/docs/install",
      location: "Seattle, US",
      country: "United States",
      city: "Seattle",
      browser: "Firefox",
      device: "Desktop",
      os: "Windows 11",
      referrer: "Docs",
      pagesVisited: [
        { url: "/docs/install", title: "Install docs" },
        { url: "/support", title: "Support" }
      ],
      firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 18),
      lastActive: new Date(Date.now() - 1000 * 60 * 6),
      totalVisits: 3
    }
  ]);

  const now = Date.now();

  const conversations = await Conversation.create([
    {
      workspace: workspace._id,
      contact: contacts[0]._id,
      visitor: visitors[0]._id,
      subject: "Annual pricing for enterprise rollout",
      status: "open",
      priority: "high",
      assignedTo: agent1._id,
      department: "sales",
      tags: ["enterprise", "pricing"],
      isPinned: true,
      isStarred: true,
      unreadCount: 1,
      lastMessagePreview: "Can we remove branding on the Growth plan?",
      lastMessageAt: new Date(now - 1000 * 60 * 2),
      firstResponseTime: 95
    },
    {
      workspace: workspace._id,
      contact: contacts[1]._id,
      visitor: visitors[1]._id,
      subject: "Invoice update request",
      status: "resolved",
      priority: "medium",
      assignedTo: agent2._id,
      department: "billing",
      tags: ["billing"],
      unreadCount: 0,
      lastMessagePreview: "Thanks, that solved it.",
      lastMessageAt: new Date(now - 1000 * 60 * 35),
      firstResponseTime: 110,
      resolutionTime: 720,
      resolvedAt: new Date(now - 1000 * 60 * 32),
      csat: { rating: "happy", feedback: "Fast and clear help.", respondedAt: new Date(now - 1000 * 60 * 31) }
    },
    {
      workspace: workspace._id,
      contact: contacts[2]._id,
      visitor: visitors[2]._id,
      subject: "Demo request and widget customization",
      status: "open",
      priority: "urgent",
      assignedTo: owner._id,
      department: "sales",
      tags: ["demo", "trial"],
      unreadCount: 0,
      lastMessagePreview: "A Tuesday afternoon demo would be perfect.",
      lastMessageAt: new Date(now - 1000 * 60 * 8),
      firstResponseTime: 60
    },
    {
      workspace: workspace._id,
      contact: contacts[3]._id,
      visitor: visitors[3]._id,
      subject: "Installation snippet issue",
      status: "missed",
      priority: "medium",
      assignedTo: null,
      department: "support",
      tags: ["install", "technical"],
      unreadCount: 0,
      lastMessagePreview: "No one replied while I was online.",
      lastMessageAt: new Date(now - 1000 * 60 * 70)
    },
    {
      workspace: workspace._id,
      subject: "Spam casino promo",
      status: "spam",
      priority: "low",
      department: "general",
      tags: ["spam"],
      unreadCount: 0,
      lastMessagePreview: "Win big today",
      lastMessageAt: new Date(now - 1000 * 60 * 200)
    }
  ]);

  contacts[0].lastConversation = conversations[0]._id;
  contacts[1].lastConversation = conversations[1]._id;
  contacts[2].lastConversation = conversations[2]._id;
  contacts[3].lastConversation = conversations[3]._id;
  await Promise.all(contacts.map((contact) => contact.save()));

  await Message.create([
    {
      workspace: workspace._id,
      conversation: conversations[0]._id,
      senderType: "system",
      senderName: "LiveChat Pro",
      content: "Welcome to LiveChat Pro. A teammate will be with you shortly.",
      messageType: "system",
      createdAt: new Date(now - 1000 * 60 * 20)
    },
    {
      workspace: workspace._id,
      conversation: conversations[0]._id,
      senderType: "customer",
      senderVisitor: visitors[0]._id,
      senderName: contacts[0].name,
      senderAvatar: contacts[0].avatar,
      content: "Hi, we’re evaluating LiveChat Pro for our 12-person support team. Do you offer annual discounts?",
      createdAt: new Date(now - 1000 * 60 * 18)
    },
    {
      workspace: workspace._id,
      conversation: conversations[0]._id,
      senderType: "agent",
      senderUser: agent1._id,
      senderName: agent1.name,
      senderAvatar: agent1.avatar,
      content: "Yes — we offer annual billing discounts on Growth and Enterprise. I can walk you through both options.",
      createdAt: new Date(now - 1000 * 60 * 16)
    },
    {
      workspace: workspace._id,
      conversation: conversations[0]._id,
      senderType: "customer",
      senderVisitor: visitors[0]._id,
      senderName: contacts[0].name,
      senderAvatar: contacts[0].avatar,
      content: "Can we remove branding on the Growth plan?",
      createdAt: new Date(now - 1000 * 60 * 2)
    },
    {
      workspace: workspace._id,
      conversation: conversations[1]._id,
      senderType: "customer",
      senderVisitor: visitors[1]._id,
      senderName: contacts[1].name,
      senderAvatar: contacts[1].avatar,
      content: "Can you update the billing email on our invoice?",
      createdAt: new Date(now - 1000 * 60 * 48)
    },
    {
      workspace: workspace._id,
      conversation: conversations[1]._id,
      senderType: "agent",
      senderUser: agent2._id,
      senderName: agent2.name,
      senderAvatar: agent2.avatar,
      content: "Done — I’ve updated it to lucas@brightcart.io and sent a fresh copy.",
      createdAt: new Date(now - 1000 * 60 * 40)
    },
    {
      workspace: workspace._id,
      conversation: conversations[1]._id,
      senderType: "customer",
      senderVisitor: visitors[1]._id,
      senderName: contacts[1].name,
      senderAvatar: contacts[1].avatar,
      content: "Thanks, that solved it.",
      createdAt: new Date(now - 1000 * 60 * 35)
    },
    {
      workspace: workspace._id,
      conversation: conversations[2]._id,
      senderType: "customer",
      senderVisitor: visitors[2]._id,
      senderName: contacts[2].name,
      senderAvatar: contacts[2].avatar,
      content: "We love the inbox UI. Can we heavily customize the widget colors and greeting copy?",
      createdAt: new Date(now - 1000 * 60 * 14)
    },
    {
      workspace: workspace._id,
      conversation: conversations[2]._id,
      senderType: "agent",
      senderUser: owner._id,
      senderName: owner.name,
      senderAvatar: owner.avatar,
      content: "Absolutely. The widget supports theme color, logo, position, proactive prompts, form fields, and translated text.",
      createdAt: new Date(now - 1000 * 60 * 13)
    },
    {
      workspace: workspace._id,
      conversation: conversations[2]._id,
      senderType: "agent",
      senderUser: owner._id,
      senderName: owner.name,
      senderAvatar: owner.avatar,
      content: "Internal note: strong enterprise potential — prioritize demo this week.",
      messageType: "note",
      isInternalNote: true,
      createdAt: new Date(now - 1000 * 60 * 12)
    },
    {
      workspace: workspace._id,
      conversation: conversations[2]._id,
      senderType: "customer",
      senderVisitor: visitors[2]._id,
      senderName: contacts[2].name,
      senderAvatar: contacts[2].avatar,
      content: "A Tuesday afternoon demo would be perfect.",
      createdAt: new Date(now - 1000 * 60 * 8)
    },
    {
      workspace: workspace._id,
      conversation: conversations[3]._id,
      senderType: "customer",
      senderVisitor: visitors[3]._id,
      senderName: contacts[3].name,
      senderAvatar: contacts[3].avatar,
      content: "I added the widget snippet but it isn’t opening on mobile.",
      createdAt: new Date(now - 1000 * 60 * 70)
    },
    {
      workspace: workspace._id,
      conversation: conversations[3]._id,
      senderType: "system",
      senderName: "LiveChat Pro",
      content: "We’re offline right now. Leave your email and we’ll get back to you.",
      messageType: "system",
      createdAt: new Date(now - 1000 * 60 * 69)
    },
    {
      workspace: workspace._id,
      conversation: conversations[4]._id,
      senderType: "customer",
      senderName: "Spam Sender",
      content: "Win big today",
      createdAt: new Date(now - 1000 * 60 * 200)
    }
  ]);

  await SavedReply.create([
    {
      workspace: workspace._id,
      title: "Greeting",
      shortcut: "/hello",
      content: "Hi there! Thanks for reaching out — I’m happy to help.",
      category: "General",
      usageCount: 37
    },
    {
      workspace: workspace._id,
      title: "Billing follow-up",
      shortcut: "/billing",
      content: "I’ve checked that for you. Could you confirm the invoice email and company name on file?",
      category: "Billing",
      usageCount: 14
    },
    {
      workspace: workspace._id,
      title: "Install help",
      shortcut: "/install",
      content: "Please share the page URL and a screenshot of the issue, and I’ll help troubleshoot the widget snippet.",
      category: "Technical",
      usageCount: 19
    }
  ]);

  await AutomationRule.create([
    {
      workspace: workspace._id,
      name: "Round robin assignment",
      type: "auto_assign",
      isEnabled: true,
      conditions: { channel: "website", businessHours: true },
      actions: { mode: "round_robin", departments: ["support", "sales", "billing"] }
    },
    {
      workspace: workspace._id,
      name: "Offline reply",
      type: "auto_reply",
      isEnabled: true,
      conditions: { businessHours: false },
      actions: { message: "We’re offline right now. Leave your details and we’ll reply by email." }
    },
    {
      workspace: workspace._id,
      name: "Pricing page sales route",
      type: "routing",
      isEnabled: true,
      conditions: { pageUrlContains: "/pricing" },
      actions: { department: "sales" }
    },
    {
      workspace: workspace._id,
      name: "Support triage bot",
      type: "chatbot_flow",
      isEnabled: true,
      flow: {
        nodes: [
          { id: "ask", type: "ask_question", label: "What can we help with?" },
          { id: "buttons", type: "button_choices", options: ["Billing", "Order issue", "Product question"] },
          { id: "email", type: "collect_email" },
          { id: "route", type: "route_to_team", department: "support" },
          { id: "handoff", type: "handoff_to_live_agent" }
        ]
      }
    }
  ]);

  await Notification.create([
    {
      workspace: workspace._id,
      user: agent1._id,
      type: "conversation.assigned",
      title: "New sales chat",
      body: "Emma Johnson is waiting on /pricing",
      conversation: conversations[0]._id
    },
    {
      workspace: workspace._id,
      user: owner._id,
      type: "lead.hot",
      title: "High-intent lead",
      body: "Mia Alvarez requested a product demo",
      conversation: conversations[2]._id
    }
  ]);

  await ActivityLog.create([
    {
      workspace: workspace._id,
      actorUser: agent1._id,
      actorName: agent1.name,
      type: "conversation.replied",
      description: "Responded to Emma Johnson about enterprise pricing",
      targetType: "conversation",
      targetId: conversations[0]._id,
      createdAt: new Date(now - 1000 * 60 * 16)
    },
    {
      workspace: workspace._id,
      actorUser: agent2._id,
      actorName: agent2.name,
      type: "conversation.resolved",
      description: "Resolved Lucas Reed’s billing request",
      targetType: "conversation",
      targetId: conversations[1]._id,
      createdAt: new Date(now - 1000 * 60 * 32)
    },
    {
      workspace: workspace._id,
      actorUser: owner._id,
      actorName: owner.name,
      type: "demo.requested",
      description: "Mia Alvarez requested a demo from /demo",
      targetType: "conversation",
      targetId: conversations[2]._id,
      createdAt: new Date(now - 1000 * 60 * 8)
    }
  ]);

  await TeamInvite.create({
    workspace: workspace._id,
    email: "newagent@livechatpro.demo",
    role: "support_agent",
    department: "support",
    token: "demo-invite-token",
    invitedBy: admin._id,
    status: "pending",
    expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 3)
  });

  console.log("Demo seed complete");
  console.log("Owner login: owner@livechatpro.demo / Password123!");
}
