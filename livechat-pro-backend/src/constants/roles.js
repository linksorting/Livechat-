export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  AGENT: "support_agent",
  VIEWER: "viewer"
};

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: ["*"],
  [ROLES.ADMIN]: [
    "dashboard.read",
    "inbox.read",
    "inbox.write",
    "contacts.read",
    "contacts.write",
    "visitors.read",
    "analytics.read",
    "team.read",
    "team.write",
    "settings.read",
    "settings.write",
    "automation.read",
    "automation.write"
  ],
  [ROLES.AGENT]: [
    "dashboard.read",
    "inbox.read",
    "inbox.write",
    "contacts.read",
    "visitors.read",
    "analytics.read",
    "settings.read"
  ],
  [ROLES.VIEWER]: [
    "dashboard.read",
    "inbox.read",
    "contacts.read",
    "visitors.read",
    "analytics.read",
    "team.read",
    "settings.read"
  ]
};

export const DEFAULT_DEPARTMENTS = ["support", "sales", "billing", "general"];
