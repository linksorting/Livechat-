import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  Bell,
  Bot,
  ChartNoAxesCombined,
  ChevronDown,
  CircleCheck,
  Command,
  ContactRound,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  Globe,
  Image,
  Inbox,
  Keyboard,
  Mail,
  MailPlus,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquareText,
  Moon,
  NotebookPen,
  Paperclip,
  Phone,
  Pin,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  StickyNote,
  Sun,
  Tag,
  UserRoundCheck,
  Users,
  WandSparkles,
  X
} from "lucide-react";
import { io } from "socket.io-client";
import {
  apiGet,
  apiPatch,
  apiPost,
  apiDelete,
  buildAttachmentUrl,
  cn,
  formatDateTime,
  formatTime,
  generateEmbedSnippet,
  getStatusTone,
  http,
  initials,
  SOCKET_URL,
  timeAgo,
} from "./lib";




const ThemeContext = createContext(null);
const AuthContext = createContext(null);
const SocketContext = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("chatlee_theme") || "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("chatlee_theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark"))
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return useContext(ThemeContext);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("livechatpro_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("livechatpro_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token));

  async function refreshMe(nextToken = token) {
    if (!nextToken) return null;
    const response = await http.get("/auth/me", {
      headers: { Authorization: `Bearer ${nextToken}` }
    });
    setUser(response.data.data);
    localStorage.setItem("livechatpro_user", JSON.stringify(response.data.data));
    return response.data.data;
  }

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    refreshMe(token).finally(() => setIsBootstrapping(false));
  }, [token]);

  async function login(credentials) {
    const response = await http.post("/auth/login", credentials);
    const nextToken = response.data.data.token;
    localStorage.setItem("livechatpro_token", nextToken);
    setToken(nextToken);
    await refreshMe(nextToken);
  }

  async function register(payload) {
    const response = await http.post("/auth/register", payload);
    const nextToken = response.data.data.token;
    localStorage.setItem("chatlee_token", nextToken);
    setToken(nextToken);
    await refreshMe(nextToken);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("chatlee_token");
    localStorage.removeItem("chatlee_user");
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isBootstrapping,
        login,
        register,
        logout,
        refreshMe,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !user?.workspaceId) return;

    const nextSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token }
    });

    nextSocket.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    nextSocket.on("conversation:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    });

    nextSocket.on("visitor:activity", () => {
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      queryClient.invalidateQueries({ queryKey: ["active-visitors"] });
    });

    nextSocket.on("agent:presence", () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    });

    setSocket(nextSocket);
    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [token, user?.workspaceId, queryClient]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

function useSocket() {
  return useContext(SocketContext);
}

const navItems = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/visitors", label: "Visitors", icon: Eye },
  { to: "/contacts", label: "Contacts", icon: ContactRound },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/automation", label: "Automation", icon: Bot, roles: ["owner", "admin"] },
  { to: "/team", label: "Team", icon: Users, roles: ["owner", "admin"] },
  { to: "/widget", label: "Widget preview", icon: WandSparkles, roles: ["owner", "admin"]  },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"]  }
];

const chartColors = {
  brand: "#5B6CFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#F43F5E"
};

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Button({ variant = "primary", className, ...props }) {
  return <button className={cn(variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "btn-ghost", className)} {...props} />;
}

function Card({ className, children }) {
  return <div className={cn("surface", className)}>{children}</div>;
}

function CardHeader({ className, children, title, subtitle, action }) {
  return (
    <div className={cn("border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70", className)}>
      {children || (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title ? <div className="text-lg font-semibold text-slate-950 dark:text-white">{title}</div> : null}
            {subtitle ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
    </div>
  );
}

function CardContent({ className, children }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

function Badge({ children, tone = "default", className }) {
  const tones = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone] || tones.default, className)}>{children}</span>;
}

function Avatar({ src, name, status, className = "" }) {
  return (
    <div className={cn("relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100", className)}>
      {src ? <img src={src} alt={name || "avatar"} className="h-full w-full object-cover" /> : <span>{initials(name)}</span>}
      {status ? <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-950", getStatusTone(status))} /> : null}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, subtitle, actions, action }) {
  const body = description || subtitle;
  const right = actions || action;
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        {eyebrow ? <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">{eyebrow}</div> : null}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {body ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{body}</p> : null}
      </div>
      {right ? <div className="flex flex-wrap gap-3">{right}</div> : null}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-slate-50/80 px-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
      {Icon ? <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><Icon size={20} /></div> : <div className="mb-3 rounded-2xl bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">LiveChat Pro</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function Modal({ open, onClose, title, description, children, width = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`mx-auto mt-10 w-full ${width} surface`} onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div> : null}
            </div>
            <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, meta, description, tone = "default" }) {
  const footer = meta || description;
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
          {footer ? (
            <div className={cn("mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium", tone === "positive" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
              {footer}
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <Icon size={20} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Sidebar({ mobile = false, onNavigate }) {
  const { user } = useAuth();

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className={cn("flex h-full w-full flex-col", mobile ? "p-4" : "p-5")}>
      <div className="surface mb-4 flex items-center gap-3 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
          <Shield size={22} />
        </div>
        <div>
          <div className="font-semibold">Chatlee</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Support command center</div>
        </div>
      </div>

      <nav className="surface flex-1 space-y-1 p-3">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-600 text-white shadow-soft"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="surface mt-4 flex items-center gap-3 px-4 py-4">
        <Avatar src={user?.avatar} name={user?.name} status={user?.status} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{user?.name}</div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.title}</div>
        </div>
      </div>
    </aside>
  );
}
function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet("/notifications")
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const markAll = useMutation({
    mutationFn: () => apiPatch("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const markOne = useMutation({
    mutationFn: (id) => apiPatch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  return (
    <div className="relative">
      <button className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setOpen((prev) => !prev)}>
        <Bell size={18} />
        {unreadCount > 0 ? <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
            <div>
              <div className="font-semibold">Notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">New chats, replies, and assignments</div>
            </div>
            <button className="text-xs font-medium text-brand-600 dark:text-brand-300" onClick={() => markAll.mutate()}>
              Mark all read
            </button>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto p-3 scrollbar-thin">
            {notifications.length ? notifications.map((item) => (
              <button key={item._id} className={cn("w-full rounded-2xl border p-3 text-left transition", item.isRead ? "border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900" : "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10")} onClick={() => markOne.mutate(item._id)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.body}</div>
                  </div>
                  <div className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</div>
                </div>
              </button>
            )) : <div className="rounded-2xl border border-dashed border-slate-300/80 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No new notifications</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: () => apiGet(`/search?q=${encodeURIComponent(debounced)}`),
    enabled: open && debounced.length > 0
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  function go(to) {
    navigate(to);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
          <Search size={18} className="text-slate-400" />
          <input autoFocus className="w-full bg-transparent text-base outline-none placeholder:text-slate-400" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats, contacts, visitors, or tags..." />
          <div className="rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">ESC</div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 scrollbar-thin">
          {!query ? (
            <div className="rounded-3xl border border-dashed border-slate-300/80 p-8 text-center dark:border-slate-700">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <Sparkles size={20} />
              </div>
              <div className="text-lg font-semibold">Global command center</div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Search conversations, customers, pages visited, and live visitor context from one fast palette.</p>
            </div>
          ) : isFetching ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Searching…</div>
          ) : (
            <div className="space-y-4">
              <SearchSection title="Conversations" items={data?.conversations || []} onSelect={(item) => go(`/inbox?conversationId=${item._id}`)} renderLabel={(item) => item.subject || item.lastMessagePreview || "Conversation"} renderMeta={(item) => item.contact?.name || item.lastMessagePreview} />
              <SearchSection title="Contacts" items={data?.contacts || []} onSelect={(item) => go(`/contacts?contactId=${item._id}`)} renderLabel={(item) => item.name} renderMeta={(item) => `${item.email || "No email"} · ${item.company || "No company"}`} />
              <SearchSection title="Visitors" items={data?.visitors || []} onSelect={(item) => go(`/visitors?visitorId=${item._id}`)} renderLabel={(item) => item.name || "Anonymous visitor"} renderMeta={(item) => `${item.email || "Anonymous"} · ${item.currentPage || "/"}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchSection({ title, items, onSelect, renderLabel, renderMeta }) {
  return (
    <div>
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <div className="space-y-2">
        {items.length ? items.map((item) => (
          <button key={item._id} className="flex w-full items-start justify-between rounded-2xl border border-slate-200/70 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10" onClick={() => onSelect(item)}>
            <div>
              <div className="font-medium">{renderLabel(item)}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{renderMeta(item)}</div>
            </div>
          </button>
        )) : <div className="rounded-2xl border border-dashed border-slate-300/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No matches</div>}
      </div>
    </div>
  );
}

function Topbar({ onOpenMobileNav, onOpenCommand }) {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const presenceMutation = useMutation({
    mutationFn: (status) => apiPatch("/auth/presence", { status }),
    onSuccess: (data) => setUser((prev) => ({ ...prev, status: data.status }))
  });

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/75 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/75">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
        <button className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden" onClick={onOpenMobileNav}>
          <Menu size={18} />
        </button>

        <button className="flex flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:max-w-xl" onClick={onOpenCommand}>
          <span className="flex items-center gap-3"><Search size={16} />Search conversations, contacts, visitors...</span>
          <span className="hidden items-center gap-1 rounded-xl bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:inline-flex"><Command size={12} />K</span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NotificationMenu />
          <div className="relative hidden lg:block">
            <select value={user?.status || "online"} onChange={(event) => presenceMutation.mutate(event.target.value)} className="appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-9 text-sm dark:border-slate-800 dark:bg-slate-900">
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" />
          </div>
          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 sm:flex">
            <Avatar src={user?.avatar} name={user?.name} status={user?.status} className="h-10 w-10" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.role?.replace("_", " ")}</div>
            </div>
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (key === "escape") {
        setCommandOpen(false);
        setMobileNavOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="hidden w-[290px] shrink-0 border-r border-slate-200/70 bg-slate-100/70 dark:border-slate-800/70 dark:bg-slate-950/60 lg:block">
        <Sidebar />
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="h-full w-[300px] bg-slate-50 dark:bg-slate-950" onClick={(event) => event.stopPropagation()}>
            <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8 scrollbar-thin">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "owner@livechatpro.demo", password: "Password123!" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface hidden p-8 lg:block">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-soft"><Shield size={26} /></div>
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><Sparkles size={12} />Premium support workspace</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Customer conversations, built for fast teams.</h1>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400">LiveChat Pro gives support, sales, and billing teams one polished inbox for live website visitors, routing, automation, and reporting.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {["Real-time shared inbox with customer context","Visitor monitoring and CRM-lite profiles","Automation, routing rules, and proactive chat","Analytics for response time, volume, and CSAT"].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70"><div className="font-medium">{item}</div></div>
            ))}
          </div>
        </div>

        <div className="surface p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-soft"><Shield size={24} /></div>
            <div>
              <div className="text-xl font-semibold">Sign in to Chatlee</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Use the seeded demo account or your own workspace credentials.</div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Email"><input className="input" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} /></Field>
            <Field label="Password"><input type="password" className="input" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} /></Field>
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}
            <button className="btn-primary w-full justify-center py-3" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          </form>

          <div className="mt-6 rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-sm font-semibold">Seeded demo login</div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">owner@livechatpro.demo<br />Password123!</div>
          </div>

          <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">Need a new workspace? <Link className="font-medium text-brand-600 dark:text-brand-300" to="/signup">Create one</Link></div>
        </div>
      </div>
    </div>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ workspaceName: "Acme Support", name: "Jordan Lee", email: "jordan@acme.co", password: "Password123!" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="surface w-full max-w-2xl p-8">
        <h1 className="text-3xl font-semibold">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Spin up a fresh LiveChat Pro workspace for your team.</p>
        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2"><Field label="Workspace name"><input className="input" value={form.workspaceName} onChange={(event) => setForm((prev) => ({ ...prev, workspaceName: event.target.value }))} /></Field></div>
          <Field label="Your name"><input className="input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} /></Field>
          <div className="md:col-span-2"><Field label="Password"><input type="password" className="input" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} /></Field></div>
          {error ? <div className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}
          <div className="md:col-span-2"><button className="btn-primary w-full justify-center py-3" disabled={loading}>{loading ? "Creating workspace…" : "Create workspace"}</button></div>
        </form>
        <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">Already have an account? <Link className="font-medium text-brand-600 dark:text-brand-300" to="/login">Back to sign in</Link></div>
      </div>
    </div>
  );
}

function OverviewCards({ cards }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard title="Active visitors" value={cards?.activeVisitors ?? 0} icon={Users} meta="Live on site" tone="positive" />
      <StatCard title="Open chats" value={cards?.openChats ?? 0} icon={MessageSquareText} meta="Needs attention" tone="positive" />
      <StatCard title="Resolved chats" value={cards?.resolvedChats ?? 0} icon={CircleCheck} meta="This period" tone="positive" />
      <StatCard title="Response time" value={`${cards?.responseTime ?? 0}m`} icon={Activity} meta="Avg first reply" />
      <StatCard title="CSAT" value={`${cards?.satisfactionScore ?? 0}%`} icon={Smile} meta="Happy customers" tone="positive" />
      <StatCard title="Agents online" value={cards?.agentOnlineCount ?? 0} icon={UserRoundCheck} meta="Available now" tone="positive" />
    </div>
  );
}
function VolumeChart({ data = [] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="text-lg font-semibold">Chat volume over time</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Incoming chat demand and resolved trends</div>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.32} />
                <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#33415522" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="chats" stroke={chartColors.brand} strokeWidth={3} fill="url(#volumeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BusiestHoursChart({ data = [] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="text-lg font-semibold">Busiest hours</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Message activity distribution by hour</div>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#33415522" />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="messages" fill={chartColors.brand} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CsatChart({ data }) {
  const rawData = [
    { name: "Happy", value: data?.happy || 0, color: chartColors.success },
    { name: "Neutral", value: data?.neutral || 0, color: chartColors.warning },
    { name: "Unhappy", value: data?.unhappy || 0, color: chartColors.danger }
  ];

  const total = rawData.reduce((sum, item) => sum + item.value, 0);

  const pieData =
    total === 0
      ? [{ name: "No Data", value: 1, color: "#e5e7eb" }]
      : rawData;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="text-lg font-semibold">Satisfaction mix</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Post-chat customer sentiment
        </div>
      </CardHeader>

      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {rawData.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-slate-200/70 px-3 py-2 text-center dark:border-slate-800"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {item.name}
              </div>
              <div className="mt-1 text-lg font-semibold">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => apiGet("/dashboard/overview?range=7d")
  });
 
 

  return (
    <div>
      <SectionHeader eyebrow="Workspace overview" title="Support performance at a glance" description="Monitor live demand, staffing, response speed, and satisfaction from one polished control room." actions={
  <Button 
    variant="secondary" 
    onClick={() => refetch()}
  
    disabled={isLoading}
  >
    <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
    {isLoading ? "Loading..." : "Refresh"}
  </Button>
} 


/>
      <OverviewCards cards={data?.cards} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <VolumeChart data={data?.chatVolume || []} />
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">Agent presence</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Live staffing across teams</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.onlineAgents || []).map((agent) => (
              <div key={agent._id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={agent.avatar} name={agent.name} status={agent.status} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{agent.name}</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">{agent.title} · {agent.department}</div>
                  </div>
                </div>
                <Badge tone={agent.status === "online" ? "success" : "warning"}>{agent.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_0.75fr_0.5fr]">
        <BusiestHoursChart data={data?.busiestHours || []} />
        <CsatChart data={data?.csat || {}} />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="text-lg font-semibold">Recent activity</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Assignments, replies, and workflow changes</div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(data?.recentActivity || []).map((item) => (
                <div key={item._id} className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.description}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{timeAgo(item.createdAt)}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-lg font-semibold"><Keyboard size={18} />Keyboard shortcuts</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Fast paths for inbox-heavy workflows</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data?.keyboardShortcuts || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200/70 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold dark:bg-slate-800">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      {isLoading ? <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading workspace metrics…</div> : null}
    </div>
  );
}



function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Icon size={15} /></div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-1 text-slate-900 dark:text-slate-100">{value}</div>
      </div>
    </div>
  );
}

function InfoBlock({ label, title, value, children }) {
  const heading = title || label;
  return (
    <div className="rounded-2xl border border-slate-200/70 px-4 py-3 dark:border-slate-800">
      {heading ? <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{heading}</div> : null}
      <div className="mt-1 text-sm">{children || value || "—"}</div>
    </div>
  );
}
function ConversationRail({ items = [], conversations, selectedId, onSelect }) {
  const source = conversations || items;
  if (!source.length) {
    return <EmptyState title="No active conversations" description="When a customer starts chatting, conversations will appear here in real time." />;
  }

  return (
    <div className="space-y-2">
      {source.map((item) => (
        <button key={item._id} onClick={() => onSelect(item._id)} className={cn("w-full rounded-3xl border p-4 text-left transition", selectedId === item._id ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-slate-200/70 bg-white hover:border-brand-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/25 dark:hover:bg-slate-800/70")}>
          <div className="flex items-start gap-3">
            <Avatar src={item.contact?.avatar} name={item.contact?.name || item.visitor?.name || "Visitor"} className="h-11 w-11 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="truncate">
                  <div className="truncate text-sm font-semibold">{item.contact?.name || item.visitor?.name || "Anonymous visitor"}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{item.subject || "Conversation"}</div>
                </div>
                <div className="shrink-0 text-[11px] text-slate-400">{timeAgo(item.lastMessageAt)}</div>
              </div>
              <div className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.lastMessagePreview || "No preview yet"}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", getStatusTone(item.status))}>{item.status}</span>
                <Badge tone={item.priority === "urgent" ? "danger" : item.priority === "high" ? "warning" : "default"}>{item.priority}</Badge>
                <Badge tone="brand">{item.department}</Badge>
                {item.isPinned ? <Pin size={12} className="text-brand-500" /> : null}
                {item.isStarred ? <Star size={12} className="fill-amber-400 text-amber-400" /> : null}
                {item.unreadCount > 0 ? <span className="rounded-full bg-brand-600 px-2 py-1 text-[10px] font-semibold text-white">{item.unreadCount}</span> : null}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function MessageList({ messages = [], typingState }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingState]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message._id} className={cn("flex gap-3", message.senderType === "agent" && !message.isInternalNote ? "justify-end" : "justify-start")}>
          {message.senderType !== "agent" || message.isInternalNote ? <Avatar src={message.senderAvatar} name={message.senderName} className="mt-1 h-9 w-9 rounded-2xl" /> : null}

          <div className={cn("max-w-[82%] rounded-3xl px-4 py-3", message.isInternalNote ? "border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100" : message.senderType === "agent" ? "bg-brand-600 text-white" : "border border-slate-200/70 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100")}>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide opacity-80"><span>{message.isInternalNote ? "Internal note" : message.senderName}</span><span>·</span><span>{formatTime(message.createdAt)}</span></div>
            <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
            {message.attachments?.length ? (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment) => (
                  <a key={`${attachment.url}-${attachment.name}`} href={buildAttachmentUrl(attachment.url)} target="_blank" rel="noreferrer" className={cn("flex items-center gap-2 rounded-2xl px-3 py-2 text-sm", message.senderType === "agent" && !message.isInternalNote ? "bg-white/10 hover:bg-white/15" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700")}>
                    <Paperclip size={14} />
                    <span className="truncate">{attachment.name}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {message.senderType === "agent" && !message.isInternalNote ? <Avatar src={message.senderAvatar} name={message.senderName} className="mt-1 h-9 w-9 rounded-2xl" /> : null}
        </div>
      ))}

      {typingState?.isTyping ? (
        <div className="flex items-center gap-3">
          <Avatar name={typingState.actor || "Typing"} className="h-9 w-9 rounded-2xl" />
          <div className="rounded-3xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" /><span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" /><span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" /></div>
          </div>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageComposer({ conversationId, onSend, onSendNote, savedReplies = [], socket, currentUser }) {
  const [text, setText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  function emitTyping(isTyping) {
    if (!socket || !conversationId) return;
    socket.emit("conversation:typing", { conversationId, isTyping, actor: currentUser?.name || "Agent" });
  }

  async function uploadAttachments(files) {
    if (!files?.length) return [];
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const response = await http.post("/uploads", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data.data;
  }

  async function handleSend(asInternalNote = false, attachedFiles = null) {
    if (!conversationId || (!text.trim() && !attachedFiles?.length)) return;
    setSending(true);
    try {
      const attachments = attachedFiles?.length ? await uploadAttachments(attachedFiles) : [];
      if (asInternalNote) await onSendNote({ content: text.trim() });
      else await onSend({ content: text.trim(), attachments });
      setText("");
      emitTyping(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-slate-200/70 bg-white/80 p-4 dark:border-slate-800/70 dark:bg-slate-900/80">
      {showReplies ? (
        <div className="mb-3 grid gap-2 rounded-3xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          {savedReplies.length ? savedReplies.map((reply) => (
            <button key={reply._id} className="rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-left text-sm hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/35 dark:hover:bg-brand-500/10" onClick={() => { setText(reply.content); setShowReplies(false); }}>
              <div className="font-medium">{reply.title} <span className="text-slate-400">/{reply.shortcut}</span></div>
              <div className="mt-1 line-clamp-2 text-slate-500 dark:text-slate-400">{reply.content}</div>
            </button>
          )) : <div className="text-sm text-slate-500 dark:text-slate-400">No saved replies yet.</div>}
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <textarea className="input min-h-[112px] resize-none" value={text} onChange={(event) => { setText(event.target.value); emitTyping(Boolean(event.target.value)); }} placeholder="Write a reply, add context for your team, or attach a file..." />
        <div className="flex flex-col gap-2">
          <button className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800" onClick={() => fileInputRef.current?.click()}><Image size={18} /></button>
          <button className="rounded-2xl bg-brand-600 p-3 text-white hover:bg-brand-700 disabled:opacity-50" disabled={sending} onClick={() => handleSend(false)}><Send size={18} /></button>
          <input ref={fileInputRef} type="file" multiple hidden onChange={(event) => { const files = event.target.files; handleSend(false, files); event.target.value = ""; }} />
        </div>
      </div>
    </div>
  );
}

function ConversationDetailsPanel({ conversation, agents = [], onAssign, onStatusChange, onMetaChange, currentUser }) {
  const detail = conversation?.contactId || conversation?.visitorId || {};
  const activity = detail.pagesVisited || [];

  if (!conversation) {
    return (
      <div className="surface-subtle flex h-full items-center justify-center rounded-4xl border border-dashed border-slate-200/70 dark:border-slate-800">
        <EmptyState icon={ContactRound} title="No visitor selected" description="Choose a conversation to inspect visitor details, notes, browsing activity, and routing controls." />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar name={detail.name || conversation.visitorName || "Visitor"} className="h-14 w-14 rounded-3xl text-base" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold text-slate-950 dark:text-white">{detail.name || conversation.visitorName || "Anonymous visitor"}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                {detail.email ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{detail.email}</span> : null}
                {detail.phone ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{detail.phone}</span> : null}
                {detail.company ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{detail.company}</span> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <InfoRow icon={MapPin} label="Location" value={detail.location || "Unknown"} />
            <InfoRow icon={Globe} label="Browser" value={detail.browser || "Modern browser"} />
            <InfoRow icon={Activity} label="Device" value={detail.device || detail.deviceType || "Desktop"} />
            <InfoRow icon={ExternalLink} label="Referrer" value={detail.referrer || "Direct"} />
            <InfoRow icon={NotebookPen} label="First seen" value={detail.firstSeen ? formatDateTime(detail.firstSeen) : "—"} />
            <InfoRow icon={Activity} label="Last active" value={detail.lastActive ? timeAgo(detail.lastActive) : "—"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Routing & ownership" subtitle="Control status, assignment, priority, and department." action={<Badge tone={getStatusTone(conversation.status)}>{conversation.status}</Badge>} />
        <CardContent className="space-y-3">
          <Field label="Assigned agent">
            <select className="input" value={conversation.assignedTo?._id || ""} onChange={(event) => onAssign(event.target.value || null)}>
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>{agent.name} · {agent.title || agent.role}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={conversation.status} onChange={(event) => onStatusChange(event.target.value)}>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="missed">Missed</option>
              <option value="spam">Spam</option>
            </select>
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Priority">
              <select className="input" value={conversation.priority || "normal"} onChange={(event) => onMetaChange({ priority: event.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Department">
              <select className="input" value={conversation.department || "support"} onChange={(event) => onMetaChange({ department: event.target.value })}>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="billing">Billing</option>
                <option value="success">Success</option>
              </select>
            </Field>
          </div>
          <Field label="Tags">
            <input className="input" defaultValue={(conversation.tags || []).join(", ")} onBlur={(event) => onMetaChange({ tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="vip, renewal, enterprise" />
          </Field>
          <div className="grid gap-2 md:grid-cols-2">
            <button className={cn("rounded-2xl border px-3 py-2 text-sm font-medium transition", conversation.isPinned ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800")} onClick={() => onMetaChange({ isPinned: !conversation.isPinned })}><Pin size={15} className="mr-2 inline" />{conversation.isPinned ? "Pinned" : "Pin chat"}</button>
            <button className={cn("rounded-2xl border px-3 py-2 text-sm font-medium transition", conversation.isStarred ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800")} onClick={() => onMetaChange({ isStarred: !conversation.isStarred })}><Star size={15} className="mr-2 inline" />{conversation.isStarred ? "Starred" : "Star chat"}</button>
          </div>
          {conversation.assignedTo?._id === currentUser?._id ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">You own this conversation right now.</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Browsing activity" subtitle="Recent activity tied to this visitor profile." />
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/60">
            <div className="font-medium text-slate-800 dark:text-slate-200">Currently browsing</div>
            <div className="mt-1 text-brand-600 dark:text-brand-300">{conversation.currentPage || detail.currentPage || activity[0] || "/pricing"}</div>
          </div>
          {activity.length ? activity.slice(0, 8).map((page, index) => (
            <div key={`${page}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="truncate text-slate-700 dark:text-slate-200">{page}</div>
              <div className="text-xs text-slate-400">{index === 0 ? "Now" : `${index * 4}m ago`}</div>
            </div>
          )) : <div className="text-sm text-slate-500 dark:text-slate-400">No browsing trail has been recorded yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function InboxPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [typingState, setTypingState] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    assignedTo: "",
    priority: "",
    department: "",
    search: "",
    pinned: false,
    starred: false
  });
  const debouncedSearch = useDebounce(filters.search, 250);

  // const conversationQuery = useQuery({
  //   queryKey: ["conversations", { ...filters, search: debouncedSearch }],
  //   queryFn: () => apiGet("/conversations", {
  //     status: filters.status || undefined,
  //     assignedTo: filters.assignedTo && filters.assignedTo !== "unassigned" ? filters.assignedTo : undefined,
  //     priority: filters.priority || undefined,
  //     department: filters.department || undefined,
  //     search: debouncedSearch || undefined,
  //     pinned: filters.pinned || undefined,
  //     starred: filters.starred || undefined
  //   })
  // });


  const conversationQuery = useQuery({
  queryKey: ["conversations", { ...filters, search: debouncedSearch }],
  queryFn: () => apiGet("/conversations", {
    status: filters.status || undefined,  // ✅ FIXED
    assignedTo: filters.assignedTo && filters.assignedTo !== "unassigned" ? filters.assignedTo : undefined,
    priority: filters.priority || undefined,
    department: filters.department || undefined,
    search: debouncedSearch || undefined,
    pinned: filters.pinned || undefined,
    starred: filters.starred || undefined
  }),
  refetchInterval: 10000
});
  const conversations = useMemo(() => {
    const items = conversationQuery.data?.items || [];
    if (filters.assignedTo === "unassigned") return items.filter((item) => !item.assignedTo);
    return items;
  }, [conversationQuery.data, filters.assignedTo]);

  

  useEffect(() => {
    if (!selectedId && conversations.length) setSelectedId(conversations[0]._id);
    if (selectedId && conversations.length && !conversations.some((item) => item._id === selectedId)) setSelectedId(conversations[0]?._id || null);
  }, [conversations, selectedId]);

  const detailQuery = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: () => apiGet(`/conversations/${selectedId}`),
    enabled: Boolean(selectedId)
  });

  const teamQuery = useQuery({ queryKey: ["team"], queryFn: () => apiGet("/team") });
  const repliesQuery = useQuery({ queryKey: ["saved-replies"], queryFn: () => apiGet("/saved-replies") });

  const sendMessage = useMutation({
    mutationFn: (payload) => apiPost(`/conversations/${selectedId}/messages`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    }
  });

  const sendNote = useMutation({
    mutationFn: (payload) => apiPost(`/conversations/${selectedId}/notes`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] })
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId) => apiPatch(`/conversations/${selectedId}/assign`, { assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status) => apiPatch(`/conversations/${selectedId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    }
  });

  const metaMutation = useMutation({
    mutationFn: (payload) => apiPatch(`/conversations/${selectedId}/meta`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  const readMutation = useMutation({
    mutationFn: () => apiPatch(`/conversations/${selectedId}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
  });

 // ✅ REPLACE ONLY THIS useEffect in InboxPage.jsx
// (The socket useEffect — find it by looking for socket.on("conversation:typing"))

useEffect(() => {
  if (!socket || !selectedId) return;

  socket.emit("conversation:join", { conversationId: selectedId });

  const onTyping = (payload) => {
    if (payload.conversationId === selectedId) setTypingState(payload);
  };

  const onMessage = (payload) => {
    // ✅ FIX: "newMessage" fires for BOTH customer & agent messages
    // This replaces the old "conversation:message:new" which never fired for agents
    if (payload.conversationId === selectedId) {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  const onConversationUpdated = (payload) => {
    // ✅ Keep this for status/assign/meta updates
    if (payload.conversationId === selectedId) {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  const onRead = (payload) => {
    if (payload.conversationId === selectedId) {
      queryClient.setQueryData(["conversations"], (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item._id === selectedId ? { ...item, unreadCount: 0 } : item
          )
        };
      });
    }
  };

  socket.on("conversation:typing", onTyping);
  socket.on("newMessage", onMessage);                  // ✅ FIXED: was "conversation:message:new"
  socket.on("conversation:updated", onConversationUpdated); // ✅ NEW: for status/assign updates
  socket.on("conversation:read", onRead);

  return () => {
    socket.emit("conversation:leave", { conversationId: selectedId });
    socket.off("conversation:typing", onTyping);
    socket.off("newMessage", onMessage);               // ✅ FIXED
    socket.off("conversation:updated", onConversationUpdated);
    socket.off("conversation:read", onRead);
  };
}, [socket, selectedId, queryClient]);

  useEffect(() => {
    if (!selectedId) return;
    readMutation.mutate();
  }, [selectedId]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!conversations.length) return;
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && selectedId) {
        event.preventDefault();
        statusMutation.mutate("resolved");
      }
      if (event.key.toLowerCase() === "~") {
        event.preventDefault();
        const index = conversations.findIndex((item) => item._id === selectedId);
        const next = conversations[Math.min(index + 1, conversations.length - 1)];
        if (next) setSelectedId(next._id);
      }
      if (event.key.toLowerCase() === "~") {
        event.preventDefault();
        const index = conversations.findIndex((item) => item._id === selectedId);
        const prev = conversations[Math.max(index - 1, 0)];
        if (prev) setSelectedId(prev._id);
      }
      if (event.key.toLowerCase() === "a" && selectedId && user?._id) {
        event.preventDefault();
        assignMutation.mutate(user._id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [conversations, selectedId, statusMutation, assignMutation, user?._id]);

  const conversation = detailQuery.data;
   

  return (
    <div className="grid h-[calc(100vh-10rem)] gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <div className="surface flex min-h-0 flex-col overflow-hidden p-4">
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-950 dark:text-white">Inbox</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Focused, triage-first support workspace.</div>
            </div>
           <Button 
  variant="secondary" 
  onClick={() => conversationQuery.refetch()}
  disabled={conversationQuery.isFetching}
>
  <RefreshCcw size={16} className={conversationQuery.isFetching ? "animate-spin" : ""} />
  {conversationQuery.isFetching ? "Loading..." : "Refresh"}
</Button>
          </div>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search customers, message text, tags..." value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="missed">Missed</option>
              <option value="spam">Spam</option>
            </select>
            <select className="input" value={filters.assignedTo} onChange={(event) => setFilters((prev) => ({ ...prev, assignedTo: event.target.value }))}>
              <option value="">All owners</option>
              <option value="unassigned">Unassigned</option>
              <option value={user?._id || "me"}>My chats</option>
              {(teamQuery.data?.items || []).map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
            </select>
            <select className="input" value={filters.priority} onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}>
              <option value="">Any priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select className="input" value={filters.department} onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}>
              <option value="">All departments</option>
              <option value="support">Support</option>
              <option value="sales">Sales</option>
              <option value="billing">Billing</option>
              <option value="success">Success</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button className={cn("rounded-full border px-3 py-1.5", filters.pinned ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900")} onClick={() => setFilters((prev) => ({ ...prev, pinned: !prev.pinned }))}><Pin size={14} className="mr-1 inline" />Pinned</button>
            <button className={cn("rounded-full border px-3 py-1.5", filters.starred ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900")} onClick={() => setFilters((prev) => ({ ...prev, starred: !prev.starred }))}><Star size={14} className="mr-1 inline" />Starred</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <ConversationRail conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      <div className="surface flex min-h-0 flex-col overflow-hidden p-0">
        {conversation ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/70">
              <div>
                <div className="text-lg font-semibold text-slate-950 dark:text-white">{conversation.subject || conversation.contactId?.name || conversation.visitorName || "Conversation"}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{conversation.department || "support"}</span>
                  <span>•</span>
                  <span>{conversation.priority || "normal"} priority</span>
                  <span>•</span>
                  <span>{conversation.assignedTo?.name || "Unassigned"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
  <Button 
    variant="secondary" 
    onClick={() => statusMutation.mutate(conversation.status === "resolved" ? "open" : "resolved")}
    disabled={statusMutation.isPending}
  >
    <CircleCheck size={16} />
    {statusMutation.isPending ? "Updating..." : (conversation.status === "resolved" ? "Reopen" : "Resolve")}
  </Button>
  <Button 
    variant="secondary" 
    onClick={() => assignMutation.mutate(user?._id || null)}
    disabled={assignMutation.isPending}
  >
    <UserRoundCheck size={16} />
    {assignMutation.isPending ? "Assigning..." : "Assign to me"}
  </Button>
</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">
              <MessageList messages={conversation.messages || []} typingState={typingState} />
            </div>
            <MessageComposer conversationId={selectedId} socket={socket} currentUser={user} savedReplies={repliesQuery.data?.items || []} onSend={(payload) => sendMessage.mutateAsync(payload)} onSendNote={(payload) => sendNote.mutateAsync(payload)} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState icon={Inbox} title="No active conversations" description="Your premium inbox is ready for real-time support. New chats, replies, and notes will appear here." />
          </div>
        )}
      </div>

      <div className="surface min-h-0 overflow-hidden p-4">
        <ConversationDetailsPanel conversation={conversation} agents={teamQuery.data?.items || []} currentUser={user} onAssign={(agentId) => assignMutation.mutate(agentId)} onStatusChange={(status) => statusMutation.mutate(status)} onMetaChange={(payload) => metaMutation.mutate(payload)} />
      </div>
    </div>
  );
}

// function VisitorsPage() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [search, setSearch] = useState("");
//   const debounced = useDebounce(search, 250);
//   const selectedId = searchParams.get("visitorId");

//   const visitorsQuery = useQuery({ 
//     queryKey: ["visitors", debounced], 
//     queryFn: () => apiGet("/visitors", { search: debounced || undefined }),
//     staleTime: 30_000 // ✅ 30 sec tak re-fetch mat karo
//   });
  
//   const activeQuery = useQuery({ 
//     queryKey: ["active-visitors"], 
//     queryFn: () => apiGet("/visitors/active"),
//     staleTime: 30_000
//   });
  
//   const detailQuery = useQuery({ 
//     queryKey: ["visitor", selectedId], 
//     queryFn: () => apiGet(`/visitors/${selectedId}`), 
//     enabled: Boolean(selectedId),
//     staleTime: 30_000
//   });

//   const visitors = visitorsQuery.data?.items || [];
  
//   const rawActive = activeQuery.data;
//   const active = Array.isArray(rawActive)
//     ? rawActive
//     : rawActive?.items || rawActive?.visitors || rawActive?.data || [];

//   const selectedVisitor = detailQuery.data 
//     || visitors.find((item) => item._id === selectedId) 
//     || null;

//   // ✅ Sirf ek baar — jab visitors pehli baar aayein aur koi select nahi
//   useEffect(() => {
//     if (visitors.length > 0 && !selectedId) {
//       setSearchParams({ visitorId: visitors[0]._id }, { replace: true });
//     }
//   }, [visitors.length, selectedId]); // ✅ .length use karo — array reference nahi

//   // ✅ Kabhi bhi content hide mat karo — sirf data show karo jo available hai
//   return (
//     <div className="space-y-6">
//       <SectionHeader 
//         title="Visitor monitoring" 
//         subtitle="Watch live traffic, identify known customers, and understand visitor context in real time." 
//         action={
//           <Button variant="secondary" onClick={() => visitorsQuery.refetch()}>
//             <RefreshCcw size={16} />Refresh
//           </Button>
//         } 
//       />

//       <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
//         <Card>
//           <CardHeader 
//             title="Active visitors right now" 
//             subtitle="Live browsing activity across your website." 
//             action={<Badge tone="success">{active.length} live</Badge>} 
//           />
//           <CardContent>
//             {activeQuery.isLoading ? (
//               <div className="py-10 text-center text-sm text-slate-400">Loading active visitors…</div>
//             ) : (
//               <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
//                 {active.length > 0 ? active.map((visitor) => (
//                   <button 
//                     key={visitor._id} 
//                     className="rounded-3xl border border-slate-200/70 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900" 
//                     onClick={() => setSearchParams({ visitorId: visitor._id })}
//                   >
//                     <div className="flex items-center gap-3">
//                       <Avatar name={visitor.name || "Visitor"} className="h-11 w-11 rounded-2xl" />
//                       <div className="min-w-0">
//                         <div className="truncate font-semibold text-slate-900 dark:text-white">
//                           {visitor.name || "Anonymous"}
//                         </div>
//                         <div className="truncate text-sm text-slate-500 dark:text-slate-400">
//                           {visitor.email || visitor.location || "Unknown source"}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60">
//                       <div className="text-slate-500 dark:text-slate-400">Current page</div>
//                       <div className="mt-1 font-medium text-brand-600 dark:text-brand-300">
//                         {visitor.currentPage || visitor.pagesVisited?.[0] || "/"}
//                       </div>
//                     </div>
//                     <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
//                       <span>{visitor.browser || "Browser"}</span>
//                       <span>{timeAgo(visitor.lastActive)}</span>
//                     </div>
//                   </button>
//                 )) : (
//                   <div className="col-span-full">
//                     <EmptyState 
//                       icon={Eye} 
//                       title="No active visitors" 
//                       description="When visitors land on your site, they will appear here." 
//                     />
//                   </div>
//                 )}
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader title="Selected visitor" subtitle="Identity, contact details, and browsing context." />
//           <CardContent>
//             {detailQuery.isLoading && selectedId ? (
//               <div className="py-10 text-center text-sm text-slate-400">Loading visitor…</div>
//             ) : selectedVisitor ? (
//               <div className="space-y-4">
//                 <div className="flex items-center gap-3">
//                   <Avatar name={selectedVisitor.name || "Visitor"} className="h-14 w-14 rounded-3xl" />
//                   <div>
//                     <div className="text-lg font-semibold text-slate-950 dark:text-white">
//                       {selectedVisitor.name || "Anonymous visitor"}
//                     </div>
//                     <div className="text-sm text-slate-500 dark:text-slate-400">
//                       {selectedVisitor.email || selectedVisitor.phone || "No identified contact yet"}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="grid gap-2">
//                   <InfoRow icon={MapPin} label="Location" value={selectedVisitor.location || "Unknown"} />
//                   <InfoRow icon={Globe} label="Browser" value={selectedVisitor.browser || "Browser"} />
//                   <InfoRow icon={Activity} label="Device" value={selectedVisitor.device || selectedVisitor.deviceType || "Desktop"} />
//                   <InfoRow icon={ExternalLink} label="Referrer" value={selectedVisitor.referrer || "Direct"} />
//                 </div>
//                 <InfoBlock title="Pages visited">
//                   <div className="space-y-2">
//                     {(selectedVisitor.pagesVisited || []).length > 0 
//                       ? selectedVisitor.pagesVisited.map((page, index) => (
//                           <div key={`${page}-${index}`} className="rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
//                             {page}
//                           </div>
//                         ))
//                       : <div className="text-sm text-slate-500 dark:text-slate-400">No pages recorded.</div>
//                     }
//                   </div>
//                 </InfoBlock>
//                 <InfoBlock title="Timeline">
//                   <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
//                     <div>First seen: {selectedVisitor.firstSeen ? formatDateTime(selectedVisitor.firstSeen) : "—"}</div>
//                     <div>Last active: {selectedVisitor.lastActive ? timeAgo(selectedVisitor.lastActive) : "—"}</div>
//                   </div>
//                 </InfoBlock>
//               </div>
//             ) : (
//               <EmptyState 
//                 icon={Eye} 
//                 title="Pick a visitor" 
//                 description="Select a row to inspect identity signals, browsing path, and activity timeline." 
//               />
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader 
//           title="All tracked visitors" 
//           subtitle="Anonymous and known visitor records tied to chat and browsing history." 
//         />
//         <CardContent>
//           <div className="mb-4 flex flex-wrap gap-3">
//             <div className="relative max-w-md flex-1 min-w-[240px]">
//               <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//               <input 
//                 className="input pl-10" 
//                 value={search} 
//                 onChange={(event) => setSearch(event.target.value)} 
//                 placeholder="Search by name, email, company, page..." 
//               />
//             </div>
//           </div>

//           {visitorsQuery.isLoading ? (
//             <div className="py-10 text-center text-sm text-slate-400">Loading visitors…</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-left text-sm">
//                 <thead className="text-slate-500 dark:text-slate-400">
//                   <tr>
//                     <th className="pb-3 pr-4 font-medium">Visitor</th>
//                     <th className="pb-3 pr-4 font-medium">Current page</th>
//                     <th className="pb-3 pr-4 font-medium">Location</th>
//                     <th className="pb-3 pr-4 font-medium">Device</th>
//                     <th className="pb-3 pr-4 font-medium">Last active</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {visitors.length > 0 ? visitors.map((visitor) => (
//                     <tr 
//                       key={visitor._id} 
//                       className={cn(
//                         "cursor-pointer border-t border-slate-200/70 transition hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-900/70",
//                         selectedId === visitor._id ? "bg-brand-50/60 dark:bg-brand-500/5" : ""
//                       )}
//                       onClick={() => setSearchParams({ visitorId: visitor._id })}
//                     >
//                       <td className="py-4 pr-4">
//                         <div className="flex items-center gap-3">
//                           <Avatar name={visitor.name || "Visitor"} className="h-10 w-10 rounded-2xl" />
//                           <div>
//                             <div className="font-medium text-slate-900 dark:text-white">
//                               {visitor.name || "Anonymous"}
//                             </div>
//                             <div className="text-slate-500 dark:text-slate-400">
//                               {visitor.email || visitor.phone || "No contact info"}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-4 pr-4 text-brand-600 dark:text-brand-300">
//                         {visitor.currentPage || visitor.pagesVisited?.[0] || "/"}
//                       </td>
//                       <td className="py-4 pr-4">{visitor.location || "Unknown"}</td>
//                       <td className="py-4 pr-4">
//                         {visitor.browser || visitor.device || visitor.deviceType || "Desktop"}
//                       </td>
//                       <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">
//                         {visitor.lastActive ? timeAgo(visitor.lastActive) : "—"}
//                       </td>
//                     </tr>
//                   )) : (
//                     <tr>
//                       <td colSpan={5} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
//                         No visitors found.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

function VisitorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const selectedId = searchParams.get("visitorId");

  const visitorsQuery = useQuery({ 
    queryKey: ["visitors", debounced], 
    queryFn: () => apiGet("/visitors", { search: debounced || undefined }),
    staleTime: 30_000
  });
  
  const activeQuery = useQuery({ 
    queryKey: ["active-visitors"], 
    queryFn: () => apiGet("/visitors/active"),
    staleTime: 30_000
  });

  const visitors = visitorsQuery.data?.items || [];

  const rawActive = activeQuery.data;
  const active = Array.isArray(rawActive)
    ? rawActive
    : rawActive?.items || rawActive?.visitors || rawActive?.data || [];

  // ✅ useEffect bilkul nahi — effectiveSelectedId se kaam chalao
  const effectiveSelectedId = selectedId || visitors[0]?._id || null;

  const detailQuery = useQuery({ 
    queryKey: ["visitor", effectiveSelectedId], 
    queryFn: () => apiGet(`/visitors/${effectiveSelectedId}`), 
    enabled: Boolean(effectiveSelectedId),
    staleTime: 30_000
  });

  const refreshAll = () => {
  visitorsQuery.refetch();
  activeQuery.refetch();
};


  const selectedVisitor = detailQuery.data 
    || visitors.find((item) => item._id === effectiveSelectedId) 
    || null;

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Visitor monitoring" 
        subtitle="Watch live traffic, identify known customers, and understand visitor context in real time." 
    
action={
  <Button 
    variant="secondary" 
    onClick={refreshAll}
    disabled={visitorsQuery.isFetching || activeQuery.isFetching}
  >
    <RefreshCcw size={16} className={(visitorsQuery.isFetching || activeQuery.isFetching) ? "animate-spin" : ""} />
    {(visitorsQuery.isFetching || activeQuery.isFetching) ? "Loading..." : "Refresh"}
  </Button>
}
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader 
            title="Active visitors right now" 
            subtitle="Live browsing activity across your website." 
            action={<Badge tone="success">{active.length} live</Badge>} 
          />
          <CardContent>
            {activeQuery.isLoading ? (
              <div className="py-10 text-center text-sm text-slate-400">
                Loading active visitors…
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {active.length > 0 ? active.map((visitor) => (
                  <button 
                    key={visitor._id} 
                    className="rounded-3xl border border-slate-200/70 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900" 
                    onClick={() => setSearchParams({ visitorId: visitor._id })}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={visitor.name || "Visitor"} className="h-11 w-11 rounded-2xl" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900 dark:text-white">
                          {visitor.name || "Anonymous"}
                        </div>
                        <div className="truncate text-sm text-slate-500 dark:text-slate-400">
                          {visitor.email || visitor.location || "Unknown source"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60">
                      <div className="text-slate-500 dark:text-slate-400">Current page</div>
                      <div className="mt-1 font-medium text-brand-600 dark:text-brand-300">
                        {visitor.currentPage || visitor.pagesVisited?.[0] || "/"}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{visitor.browser || "Browser"}</span>
                      <span>{timeAgo(visitor.lastActive)}</span>
                    </div>
                  </button>
                )) : (
                  <div className="col-span-full">
                    <EmptyState 
                      icon={Eye} 
                      title="No active visitors" 
                      description="When visitors land on your site, they will appear here with page context and identity signals." 
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Selected visitor" 
            subtitle="Identity, contact details, and browsing context." 
          />
          <CardContent>
            {detailQuery.isLoading && effectiveSelectedId ? (
              <div className="py-10 text-center text-sm text-slate-400">
                Loading visitor details…
              </div>
            ) : selectedVisitor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedVisitor.name || "Visitor"} className="h-14 w-14 rounded-3xl" />
                  <div>
                    <div className="text-lg font-semibold text-slate-950 dark:text-white">
                      {selectedVisitor.name || "Anonymous visitor"}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedVisitor.email || selectedVisitor.phone || "No identified contact yet"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <InfoRow icon={MapPin} label="Location" value={selectedVisitor.location || "Unknown"} />
                  <InfoRow icon={Globe} label="Browser" value={selectedVisitor.browser || "Browser"} />
                  <InfoRow icon={Activity} label="Device" value={selectedVisitor.device || selectedVisitor.deviceType || "Desktop"} />
                  <InfoRow icon={ExternalLink} label="Referrer" value={selectedVisitor.referrer || "Direct"} />
                </div>

                <InfoBlock title="Pages visited">
                  <div className="space-y-2">
                    {(selectedVisitor.pagesVisited || []).length > 0 
                      ? selectedVisitor.pagesVisited.map((page, index) => (
                          <div 
                            key={`${page}-${index}`} 
                            className="rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                          >
                            {page}
                          </div>
                        ))
                      : (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            No pages recorded.
                          </div>
                        )
                    }
                  </div>
                </InfoBlock>

                <InfoBlock title="Timeline">
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div>
                      First seen: {selectedVisitor.firstSeen ? formatDateTime(selectedVisitor.firstSeen) : "—"}
                    </div>
                    <div>
                      Last active: {selectedVisitor.lastActive ? timeAgo(selectedVisitor.lastActive) : "—"}
                    </div>
                  </div>
                </InfoBlock>
              </div>
            ) : (
              <EmptyState 
                icon={Eye} 
                title="Pick a visitor" 
                description="Select a row to inspect identity signals, browsing path, and activity timeline." 
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader 
          title="All tracked visitors" 
          subtitle="Anonymous and known visitor records tied to chat and browsing history." 
        />
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative max-w-md flex-1 min-w-[240px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="input pl-10" 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
                placeholder="Search by name, email, company, page..." 
              />
            </div>
          </div>

          {visitorsQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading visitors…
            </div>
          ) : visitorsQuery.isError ? (
            <div className="py-10 text-center text-sm text-red-500">
              Visitors load nahi hue. Refresh karein.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Visitor</th>
                    <th className="pb-3 pr-4 font-medium">Current page</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">Device</th>
                    <th className="pb-3 pr-4 font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length > 0 ? visitors.map((visitor) => (
                    <tr 
                      key={visitor._id} 
                      className={cn(
                        "cursor-pointer border-t border-slate-200/70 transition hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-900/70",
                        effectiveSelectedId === visitor._id 
                          ? "bg-brand-50/60 dark:bg-brand-500/5" 
                          : ""
                      )}
                      onClick={() => setSearchParams({ visitorId: visitor._id })}
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={visitor.name || "Visitor"} className="h-10 w-10 rounded-2xl" />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {visitor.name || "Anonymous"}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {visitor.email || visitor.phone || "No contact info"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-brand-600 dark:text-brand-300">
                        {visitor.currentPage || visitor.pagesVisited?.[0] || "/"}
                      </td>
                      <td className="py-4 pr-4">{visitor.location || "Unknown"}</td>
                      <td className="py-4 pr-4">
                        {visitor.browser || visitor.device || visitor.deviceType || "Desktop"}
                      </td>
                      <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">
                        {visitor.lastActive ? timeAgo(visitor.lastActive) : "—"}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No visitors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const selectedId = searchParams.get("contactId");
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({ queryKey: ["contacts", debounced], queryFn: () => apiGet("/contacts", { search: debounced || undefined }) });
  const detailQuery = useQuery({ queryKey: ["contact", selectedId], queryFn: () => apiGet(`/contacts/${selectedId}`), enabled: Boolean(selectedId) });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiPatch(`/contacts/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", variables.id] });
    }
  });

  const contacts = contactsQuery.data?.items || [];
  const selected = detailQuery.data || contacts.find((item) => item._id === selectedId) || contacts[0];

  useEffect(() => {
    if (!selectedId && contacts[0]?._id) setSearchParams({ contactId: contacts[0]._id });
  }, [selectedId, contacts, setSearchParams]);

  async function exportCsv() {
    const response = await http.get("/contacts/export/csv", { responseType: "blob" });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "livechat-pro-contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_380px]">
      <Card>
        <CardHeader title="Contacts" subtitle="CRM-lite profiles with notes, tags, company context, and conversation history." action={<Button variant="secondary" onClick={exportCsv}><Download size={16} />Export CSV</Button>} />
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative max-w-md flex-1 min-w-[240px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by contact, company, tag, email..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Contact</th>
                  <th className="pb-3 pr-4 font-medium">Company</th>
                  <th className="pb-3 pr-4 font-medium">Tags</th>
                  <th className="pb-3 pr-4 font-medium">Total chats</th>
                  <th className="pb-3 pr-4 font-medium">Last conversation</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact._id} className="cursor-pointer border-t border-slate-200/70 transition hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-900/70" onClick={() => setSearchParams({ contactId: contact._id })}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.name} className="h-10 w-10 rounded-2xl" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{contact.name}</div>
                          <div className="text-slate-500 dark:text-slate-400">{contact.email || contact.phone || "No contact info"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">{contact.company || "—"}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-1">{(contact.tags || []).slice(0, 3).map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                    </td>
                    <td className="py-4 pr-4">{contact.totalChats || 0}</td>
                    <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">{contact.lastConversationAt ? timeAgo(contact.lastConversationAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Profile details" subtitle="Edit notes, company info, and enrichment fields." />
        <CardContent>
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={selected.name} className="h-14 w-14 rounded-3xl" />
                <div>
                  <div className="text-lg font-semibold text-slate-950 dark:text-white">{selected.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{selected.email || selected.phone || "No email yet"}</div>
                </div>
              </div>
              <Field label="Company"><input className="input" defaultValue={selected.company || ""} onBlur={(event) => updateMutation.mutate({ id: selected._id, payload: { company: event.target.value } })} /></Field>
              <Field label="Phone"><input className="input" defaultValue={selected.phone || ""} onBlur={(event) => updateMutation.mutate({ id: selected._id, payload: { phone: event.target.value } })} /></Field>
              <Field label="Tags"><input className="input" defaultValue={(selected.tags || []).join(", ")} onBlur={(event) => updateMutation.mutate({ id: selected._id, payload: { tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })} /></Field>
              <Field label="Notes"><textarea className="input min-h-[140px] resize-none" defaultValue={selected.notes || ""} onBlur={(event) => updateMutation.mutate({ id: selected._id, payload: { notes: event.target.value } })} /></Field>
              <InfoBlock title="Timeline">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>Total chats: {selected.totalChats || 0}</div>
                  <div>Last conversation: {selected.lastConversationAt ? formatDateTime(selected.lastConversationAt) : "—"}</div>
                  <div>Created: {selected.createdAt ? formatDateTime(selected.createdAt) : "—"}</div>
                </div>
              </InfoBlock>
            </div>
          ) : <EmptyState icon={ContactRound} title="Select a contact" description="Open a contact to inspect history, notes, company details, and tags." />}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const analyticsQuery = useQuery({ queryKey: ["analytics", range], queryFn: () => apiGet("/analytics", { range }) });
  const overviewQuery = useQuery({ queryKey: ["dashboard-overview", range], queryFn: () => apiGet("/dashboard/overview", { range }) });

  const analytics = analyticsQuery.data || {};
  const overview = overviewQuery.data || {};

  function downloadReport() {
    const volume = analytics.chatVolume || overview.chatVolume || [];
    const header = ["date", "count"];
    const rows = volume.map((item) => [item.label || item.date, item.value || item.count]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `livechat-pro-report-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics & reports" subtitle="Measure response times, performance, chat trends, busiest hours, and satisfaction." action={<div className="flex gap-2"><select className="input w-36" value={range} onChange={(event) => setRange(event.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select><Button variant="secondary" onClick={downloadReport}><Download size={16} />Download report</Button></div>} />
      <OverviewCards cards={overview.cards || []} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <VolumeChart data={analytics.chatVolume || overview.chatVolume || []} />
        <CsatChart data={analytics.csat || overview.csat || []} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <BusiestHoursChart data={analytics.busiestHours || overview.busiestHours || []} />
        <Card>
          <CardHeader title="Agent performance" subtitle="See who is moving the queue fastest and delighting customers." />
          <CardContent>
            <div className="space-y-3">
              {(analytics.agentPerformance || overview.agentPerformance || []).map((agent) => (
                <div key={agent.name} className="rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={agent.name} className="h-11 w-11 rounded-2xl" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{agent.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{agent.title || "Support Agent"}</div>
                      </div>
                    </div>
                    <Badge tone="brand">CSAT {agent.csat || "—"}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60"><div className="text-slate-400">Resolved</div><div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{agent.resolved || 0}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60"><div className="text-slate-400">Avg response</div><div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{agent.firstResponseTime || agent.responseTime || "—"}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60"><div className="text-slate-400">Assigned</div><div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{agent.assigned || agent.open || 0}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── FIX 1: defaultRule mein isEnabled add kiya ──────────────────────────────
const defaultRule = {
  name: "",
  type: "auto_reply",
  isEnabled: true,
  conditions: { pageUrl: "/pricing", returningVisitor: false, businessHours: true },
  actions: { message: "Hi there! Want help choosing a plan?", routeTo: "sales" }
};

function AutomationPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(defaultRule);
  // FIX 2: Error state add kiya taaki modal mein error dikhaye
  const [formError, setFormError] = useState(null);

  const automationQuery = useQuery({ queryKey: ["automation"], queryFn: () => apiGet("/automation") });
  const templatesQuery = useQuery({ queryKey: ["automation-templates"], queryFn: () => apiGet("/automation/flow-templates") });

  // FIX 3: onError handler add kiya — yahi asli problem thi
  const createMutation = useMutation({
    mutationFn: (payload) => apiPost("/automation", payload),
    onSuccess: () => {
      setIsOpen(false);
      setDraft(defaultRule);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["automation"] });
    },
    onError: (error) => {
      // Real server error modal mein dikhayega
      setFormError(error?.message || "Kuch galat ho gaya. Dobara try karein.");
      console.error("Automation create error:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiPatch(`/automation/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation"] }),
    onError: (error) => {
      console.error("Automation update error:", error);
      alert("Rule update nahi ho saka: " + (error?.message || "Unknown error"));
    }
  });

const deleteMutation = useMutation({
  mutationFn: (id) => apiDelete(`/automation/${id}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["automation"] });
  },
  onError: (error) => {
    console.error("Delete error:", error);
    alert("Delete failed: " + (error?.message || "Unknown error"));
  }
});

function handleDelete(id) {
 // const confirmDelete = window.confirm("Are you sure you want to delete this rule?");
  
 // if (!confirmDelete) return;

  deleteMutation.mutate(id);
}


  // FIX 4: Validation + save handler alag kiya
  function handleSave() {
    setFormError(null);
    if (!draft.name.trim()) {
      setFormError("Rule ka naam zaroori hai.");
      return;
    }
    if (!draft.actions.message.trim()) {
      setFormError("Message zaroori hai.");
      return;
    }
    createMutation.mutate(draft);
  }

  function handleClose() {
    setIsOpen(false);
    setDraft(defaultRule);
    setFormError(null);
  }

 const rules = automationQuery.data || [];
 //console.log("API Response:", automationQuery.data);
 
  const templates = templatesQuery.data|| [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Automation & chatbot" subtitle="Create simple routing rules, away messages, and conversational flows before human handoff." action={<Button onClick={() => setIsOpen(true)}><Plus size={16} />New rule</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Active rules" subtitle="Routing, greetings, round robin assignment, and away mode automation." />
          <CardContent>
            <div className="space-y-3">
              {/* FIX 5: Loading + error state add kiya */}
              {automationQuery.isLoading && (
                <p className="text-sm text-slate-400">Rules load ho rahe hain…</p>
              )}
              {automationQuery.isError && (
                <p className="text-sm text-red-500">Rules load nahi hue: {automationQuery.error?.message}</p>
              )}
              {!automationQuery.isLoading && rules.length === 0 && (
                <EmptyState icon={Bot} title="No automation rules yet" description="Add routing logic, away replies, or basic chatbot flows to streamline first-touch support." />
              )}
              {rules.map((rule) => (
                <div key={rule._id} className="rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                 <div className="flex flex-wrap items-start justify-between gap-3">
  
  {/* LEFT CONTENT */}
  <div>
    <div className="flex items-center gap-2">
      <div className="font-semibold text-slate-900 dark:text-white">
        {rule.name}
      </div>
      <Badge tone={rule.isEnabled ? "success" : "slate"}>
        {rule.isEnabled ? "Enabled" : "Disabled"}
      </Badge>
    </div>

    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      {rule.type} • page {rule.conditions?.pageUrl || "any"} • route to {rule.actions?.routeTo || "support"}
    </div>
  </div>

  {/* RIGHT SIDE ACTIONS */}
  <div className="flex items-center gap-2 ml-auto">
    
    {/* Live */}
    <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
    <input
  type="checkbox"
  className="h-4 w-4 accent-green-500"
  checked={Boolean(rule.isEnabled)}
  onChange={(event) =>
    updateMutation.mutate({
      id: rule._id,
      payload: { isEnabled: event.target.checked }
    })
  }
/>
      <span>Live</span>
    </label>

    {/* Delete (Blue) */}
    <button
      onClick={() => handleDelete(rule._id)}
      className="flex items-center justify-center rounded-xl bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 active:scale-95 transition"
    >
      Delete
    </button>

  </div>
</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60"><div className="text-slate-400">Trigger</div><div className="mt-1 text-slate-800 dark:text-slate-200">{rule.conditions?.businessHours ? "Business hours" : "Any time"}{rule.conditions?.returningVisitor ? " • Returning visitor" : ""}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60"><div className="text-slate-400">Action</div>
                     <div className="mt-1 text-slate-800 dark:text-slate-200 line-clamp-2 break-words">
  {rule.actions?.message || "No message"}
</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Flow templates" subtitle="Starting points for FAQ suggestions and lead capture." />
          <CardContent>
            <div className="space-y-3">
              {templates.map((template, index) => (
                <div key={template._id || template.name || index} className="rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="font-semibold text-slate-900 dark:text-white">{template.name || `Template ${index + 1}`}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{template.description || "FAQ suggestions, lead capture, routing, and live handoff."}</div>
                  <div className="mt-3 flex flex-wrap gap-2">{(template.steps || ["Ask question", "Collect email", "Route team"]).map((step) => <Badge key={step}>{step}</Badge>)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isOpen}
        onClose={handleClose}
        title="Create automation rule"
        description="Set conditions and actions for proactive messaging and routing."
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">

          {/* FIX 6: Error banner modal ke andar */}
          {formError && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </div>
          )}

          <Field label="Rule name">
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Pricing page auto-reply"
            />
          </Field>

          <Field label="Automation type">
            <select
              className="input"
              value={draft.type}
              onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="auto_reply">Auto reply</option>
              <option value="round_robin">Round robin</option>
              <option value="chatbot">Chatbot flow</option>
              <option value="routing">Routing</option>
            </select>
          </Field>

          <Field label="Page URL trigger">
            <input
              className="input"
              value={draft.conditions.pageUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, conditions: { ...prev.conditions, pageUrl: e.target.value } }))}
              placeholder="/pricing"
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200/70 px-3 py-3 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                checked={draft.conditions.returningVisitor}
                onChange={(e) => setDraft((prev) => ({ ...prev, conditions: { ...prev.conditions, returningVisitor: e.target.checked } }))}
              />
              Returning visitor
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200/70 px-3 py-3 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                checked={draft.conditions.businessHours}
                onChange={(e) => setDraft((prev) => ({ ...prev, conditions: { ...prev.conditions, businessHours: e.target.checked } }))}
              />
              Business hours only
            </label>
          </div>

          <Field label="Message">
            <textarea
              className="input min-h-[120px] resize-none"
              value={draft.actions.message}
              onChange={(e) => setDraft((prev) => ({ ...prev, actions: { ...prev.actions, message: e.target.value } }))}
              placeholder="Hi! How can we help you today?"
            />
          </Field>

          <Field label="Route to team">
            <select
              className="input"
              value={draft.actions.routeTo}
              onChange={(e) => setDraft((prev) => ({ ...prev, actions: { ...prev.actions, routeTo: e.target.value } }))}
            >
              <option value="support">Support</option>
              <option value="sales">Sales</option>
              <option value="billing">Billing</option>
              <option value="success">Success</option>
            </select>
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            {/* FIX 7: disabled + loading state button par */}
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              <Save size={16} />
              {createMutation.isPending ? "Saving…" : "Save rule"}
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
}



function TeamPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [invite, setInvite] = useState({
    name: "",
    email: "",
    role: "support_agent",
    title: "Support Specialist",
    department: "support"
  });

  const teamQuery = useQuery({
    queryKey: ["team"],
    queryFn: () => apiGet("/team")
  });

  const inviteMutation = useMutation({
    mutationFn: (payload) => apiPost("/team/invite", payload),
    onSuccess: () => {
      setIsOpen(false);
      setInvite({
        name: "",
        email: "",
        role: "support_agent",
        title: "Support Specialist",
        department: "support"
      });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiPatch(`/team/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] })
  });

  // ✅ FIX: separate users & invites
  const users = teamQuery.data?.users || [];
  const invites = teamQuery.data?.invites || [];

  // ✅ FIX: combine for UI
  const members = [
    ...users,
    ...invites.map((i) => ({
      ...i,
      name: i.email,
      status: "pending",
      inviteToken: i.token
    }))
  ];

  console.log(teamQuery.data);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team management"
        subtitle="Invite teammates, assign roles, and monitor availability and performance."
        action={
          <Button onClick={() => setIsOpen(true)}>
            <MailPlus size={16} />
            Invite member
          </Button>
        }
      />

      {/* ✅ STATS FIXED */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total team members"
          value={users.length} // ✅ only users
          icon={Users}
        />

        <StatCard
          title="Online now"
          value={users.filter(
            (m) => m.presence === "online" || m.status === "online"
          ).length}
          icon={CircleCheck}
        />

        <StatCard
          title="Pending invites"
          value={invites.length} // ✅ correct
          icon={MailPlus}
        />

        <StatCard
          title="Departments"
          value={
            new Set(users.map((m) => m.department).filter(Boolean)).size
          }
          icon={Shield}
        />
      </div>

      <Card>
        <CardHeader title="Workspace members" />
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member._id} className="rounded-3xl border p-4">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <Avatar name={member.name} />
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge>
                      {member.presence || member.status || "offline"}
                    </Badge>
                    <Badge>{member.department || "support"}</Badge>
                  </div>
                </div>

                {/* ✅ FIX: disable editing for invites */}
                {!member.inviteToken && (
                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    <Field label="Role">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: member._id,
                            payload: { role: e.target.value }
                          })
                        }
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="support_agent">Support Agent</option>
                        
                      </select>
                    </Field>

                    <Field label="Status">
                      <select
                        value={member.status || "active"}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: member._id,
                            payload: { status: e.target.value }
                          })
                        }
                      >
                        <option value="active">Active</option>
                        {/* ❌ removed "invited" */}
                        <option value="suspended">Suspended</option>
                      </select>
                    </Field>

                    <Field label="Department">
                      <select
                        value={member.department || "support"}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: member._id,
                            payload: {
                              department: e.target.value
                            }
                          })
                        }
                      >
                        <option value="support">Support</option>
                        <option value="sales">Sales</option>
                        <option value="billing">Billing</option>
                        <option value="success">Success</option>
                      </select>
                    </Field>
                  </div>
                )}

                {/* ✅ Invite token */}
                {member.inviteToken && (
                  <div className="mt-3 text-sm">
                    Pending invite token:
                    <span className="font-mono ml-2">
                      {member.inviteToken}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
       <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Invite a teammate" description="Send a new workspace invitation with role-based permissions.">
         <div className="space-y-4">
           <div className="grid gap-4 md:grid-cols-2">
             <Field label="Name"><input className="input" value={invite.name} onChange={(event) => setInvite((prev) => ({ ...prev, name: event.target.value }))} /></Field>
            <Field label="Email"><input className="input" value={invite.email} onChange={(event) => setInvite((prev) => ({ ...prev, email: event.target.value }))} /></Field>
            <Field label="Role"><select className="input" value={invite.role} onChange={(event) => setInvite((prev) => ({ ...prev, role: event.target.value }))}><option value="admin">Admin</option><option value="support_agent">Support Agent</option><option value="viewer">Viewer</option></select></Field>
            <Field label="Department"><select className="input" value={invite.department} onChange={(event) => setInvite((prev) => ({ ...prev, department: event.target.value }))}><option value="support">Support</option><option value="sales">Sales</option><option value="billing">Billing</option><option value="success">Success</option></select></Field>
          </div>
         <Field label="Job title"><input className="input" value={invite.title} onChange={(event) => setInvite((prev) => ({ ...prev, title: event.target.value }))} /></Field>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button onClick={() => inviteMutation.mutate(invite)}><Send size={16} />Send invite</Button></div>
         </div>
     </Modal>
    </div>
  );
}



function EditableField({ label, defaultValue, onSave, multiline = false }) {
  const [value, setValue] = useState(defaultValue || "");
  useEffect(() => setValue(defaultValue || ""), [defaultValue]);
  return (
    <Field label={label}>
      {multiline ? <textarea className="input min-h-[120px] resize-none" value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => onSave(value)} /> : <input className="input" value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => onSave(value)} />}
    </Field>
  );
}

function ToggleCard({ title, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
    </label>
  );
}



function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("workspace");
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"

  // ── Queries ──────────────────────────────────────────────────────────────
  const workspaceQuery = useQuery({
    queryKey: ["workspace-settings"],
    queryFn: () => apiGet("/settings/workspace")
  });
  const hoursQuery = useQuery({
    queryKey: ["business-hours-settings"],
    queryFn: () => apiGet("/settings/business-hours")
  });
  const notificationQuery = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => apiGet("/settings/notifications")
  });
  const routingQuery = useQuery({
    queryKey: ["routing-settings"],
    queryFn: () => apiGet("/settings/routing")
  });
  const repliesQuery = useQuery({
    queryKey: ["saved-replies"],
    queryFn: () => apiGet("/saved-replies")
  });

  // ── Draft states ──────────────────────────────────────────────────────────
  const [workspaceDraft, setWorkspaceDraft] = useState({});
  const [hoursDraft, setHoursDraft] = useState({});
  const [notificationsDraft, setNotificationsDraft] = useState({});
  const [routingDraft, setRoutingDraft] = useState({});
  const [hoursJsonError, setHoursJsonError] = useState(null);

  // ── Server → draft sync (sirf pehli baar) ────────────────────────────────
  useEffect(() => {
    if (workspaceQuery.data && !Object.keys(workspaceDraft).length)
      setWorkspaceDraft(workspaceQuery.data);
  }, [workspaceQuery.data]);

  useEffect(() => {
    if (hoursQuery.data && !Object.keys(hoursDraft).length)
      setHoursDraft(hoursQuery.data);
  }, [hoursQuery.data]);

  useEffect(() => {
    if (notificationQuery.data && !Object.keys(notificationsDraft).length)
      setNotificationsDraft(notificationQuery.data);
  }, [notificationQuery.data]);

  useEffect(() => {
    if (routingQuery.data && !Object.keys(routingDraft).length)
      setRoutingDraft(routingQuery.data);
  }, [routingQuery.data]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const workspaceMutation = useMutation({
    mutationFn: (payload) => apiPatch("/settings/workspace", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-settings"] })
  });
  const hoursMutation = useMutation({
    mutationFn: (payload) => apiPatch("/settings/business-hours", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business-hours-settings"] })
  });
  const notificationMutation = useMutation({
    mutationFn: (payload) => apiPatch("/settings/notifications", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-settings"] })
  });
  const routingMutation = useMutation({
    mutationFn: (payload) => apiPatch("/settings/routing", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routing-settings"] })
  });
  const replyMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? apiPatch(`/saved-replies/${id}`, payload) : apiPost("/saved-replies", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-replies"] })
  });
  const deleteReplyMutation = useMutation({
    mutationFn: (id) => apiDelete(`/saved-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-replies"] })
  });

  const replies = repliesQuery.data?.items || [];

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (tab === "hours" && hoursJsonError) return;
    setSaveStatus("saving");
    try {
      if (tab === "workspace") {
        // ✅ Backend sirf yeh fields accept karta hai
        await workspaceMutation.mutateAsync({
          name: workspaceDraft.name,
          locale: workspaceDraft.locale,
          timezone: workspaceDraft.timezone,
          branding: workspaceDraft.branding,
          apiPlaceholders: workspaceDraft.apiPlaceholders
        });
      } else if (tab === "hours") {
        await hoursMutation.mutateAsync(hoursDraft);
      } else if (tab === "notifications") {
        await notificationMutation.mutateAsync(notificationsDraft);
      } else if (tab === "routing") {
        await routingMutation.mutateAsync(routingDraft);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error("Settings save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  const tabs = [
    ["workspace", "Workspace"],
    ["hours", "Business hours"],
    ["notifications", "Notifications"],
    ["routing", "Routing"]
    // ["replies", "Saved replies"]
  ];

  const showSaveButton = tab !== "replies";
  const isSaving = saveStatus === "saving";

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Workspace configuration, routing, and notifications.
          </p>
        </div>
        {showSaveButton && (
          <button
            onClick={handleSave}
            disabled={isSaving || (tab === "hours" && Boolean(hoursJsonError))}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-soft transition disabled:opacity-60",
              saveStatus === "saved"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : saveStatus === "error"
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-brand-600 hover:bg-brand-700"
            )}
          >
            {saveStatus === "saving" ? (
              <><RefreshCcw size={16} className="animate-spin" />Saving…</>
            ) : saveStatus === "saved" ? (
              <><CircleCheck size={16} />Saved!</>
            ) : saveStatus === "error" ? (
              <><X size={16} />Failed — Retry</>
            ) : (
              <><Save size={16} />Save changes</>
            )}
          </button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        {/* ── Sidebar ── */}
        <Card>
          <CardContent className="space-y-1 p-3">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setTab(value); setSaveStatus(null); }}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  tab === value
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {label}
                <ChevronDown size={16} className="rotate-[-90deg] opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* ── Tab content ── */}
        <div className="space-y-6">

          {/* WORKSPACE */}
          {tab === "workspace" && (
            <Card>
              <CardHeader
                title="General workspace settings"
                subtitle="Branding, locale, and timezone configuration."
              />
              <CardContent className="grid gap-4 md:grid-cols-2">
                {workspaceQuery.isLoading ? (
                  <div className="md:col-span-2 py-8 text-center text-sm text-slate-400">Loading…</div>
                ) : (
                  <>
                    {/* ✅ name — backend mein allowed */}
                    <Field label="Workspace name">
                      <input
                        className="input"
                        value={workspaceDraft.name || ""}
                        onChange={(e) =>
                          setWorkspaceDraft((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </Field>

                    {/* ✅ locale — backend mein allowed */}
                    <Field label="Locale (e.g. en, hi, fr)">
                      <input
                        className="input"
                        value={workspaceDraft.locale || ""}
                        onChange={(e) =>
                          setWorkspaceDraft((p) => ({ ...p, locale: e.target.value }))
                        }
                      />
                    </Field>

                    {/* ✅ timezone — backend mein allowed */}
                    <Field label="Timezone (e.g. Asia/Kolkata)">
                      <input
                        className="input"
                        value={workspaceDraft.timezone || ""}
                        onChange={(e) =>
                          setWorkspaceDraft((p) => ({ ...p, timezone: e.target.value }))
                        }
                      />
                    </Field>

                    {/* ✅ branding.primaryColor — backend mein allowed */}
                    <Field label="Brand color (hex)">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="h-11 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
                          value={workspaceDraft.branding?.primaryColor || "#5B6CFF"}
                          onChange={(e) =>
                            setWorkspaceDraft((p) => ({
                              ...p,
                              branding: { ...(p.branding || {}), primaryColor: e.target.value }
                            }))
                          }
                        />
                        <input
                          className="input flex-1"
                          value={workspaceDraft.branding?.primaryColor || ""}
                          onChange={(e) =>
                            setWorkspaceDraft((p) => ({
                              ...p,
                              branding: { ...(p.branding || {}), primaryColor: e.target.value }
                            }))
                          }
                          placeholder="#5B6CFF"
                        />
                      </div>
                    </Field>

                    {/* ✅ branding.logoUrl */}
                    <div className="md:col-span-2">
                      <Field label="Logo URL">
                        <input
                          className="input"
                          value={workspaceDraft.branding?.logoUrl || ""}
                          onChange={(e) =>
                            setWorkspaceDraft((p) => ({
                              ...p,
                              branding: { ...(p.branding || {}), logoUrl: e.target.value }
                            }))
                          }
                          placeholder="https://yoursite.com/logo.png"
                        />
                      </Field>
                    </div>

                    {/* ℹ️ Read-only info — backend se aata hai, edit nahi hota */}
                    <div className="md:col-span-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Read-only info
                      </div>
                      <div className="grid gap-1 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                        <div>Slug: <span className="font-mono font-medium">{workspaceDraft.slug || "—"}</span></div>
                        <div>Plan: <span className="font-medium capitalize">{workspaceDraft.plan || "—"}</span></div>
                        <div>Status: <span className="font-medium capitalize">{workspaceDraft.status || "—"}</span></div>
                        <div>Created: <span className="font-medium">{workspaceDraft.createdAt ? formatDateTime(workspaceDraft.createdAt) : "—"}</span></div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* BUSINESS HOURS */}
          {tab === "hours" && (
            <Card>
              <CardHeader
                title="Business hours"
                subtitle="Control online coverage, away mode, and office hours shown to visitors."
              />
              <CardContent className="space-y-4">
                {hoursQuery.isLoading ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
                ) : (
                  <>
                    <ToggleCard
                      title="Enable business hours"
                      description="Only show agents as online during configured support coverage."
                      checked={Boolean(hoursDraft.enabled)}
                      onChange={(checked) =>
                        setHoursDraft((p) => ({ ...p, enabled: checked }))
                      }
                    />
                    <Field label="Timezone">
                      <input
                        className="input"
                        value={hoursDraft.timezone || "UTC"}
                        onChange={(e) =>
                          setHoursDraft((p) => ({ ...p, timezone: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Schedule (JSON)">
                      <textarea
                        className={cn(
                          "input min-h-[160px] resize-none font-mono text-xs",
                          hoursJsonError ? "border-rose-400 focus:ring-rose-400" : ""
                        )}
                        defaultValue={JSON.stringify(
                          hoursDraft.schedule || hoursDraft.hours || {},
                          null,
                          2
                        )}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setHoursDraft((p) => ({ ...p, schedule: parsed }));
                            setHoursJsonError(null);
                          } catch {
                            setHoursJsonError("Invalid JSON — fix before saving.");
                          }
                        }}
                      />
                      {hoursJsonError && (
                        <div className="mt-1 text-xs text-rose-500">{hoursJsonError}</div>
                      )}
                    </Field>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {tab === "notifications" && (
            <Card>
              <CardHeader
                title="Notification settings"
                subtitle="Fine-tune email alerts, browser notifications, and sound behavior."
              />
              <CardContent className="space-y-4">
                {notificationQuery.isLoading ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
                ) : (
                  <>
                    <ToggleCard
                      title="Email notifications"
                      description="Receive email alerts for missed chats and unassigned conversations."
                      checked={Boolean(notificationsDraft.emailNotifications ?? notificationsDraft.email)}
                      onChange={(checked) =>
                        setNotificationsDraft((p) => ({ ...p, emailNotifications: checked }))
                      }
                    />
                    <ToggleCard
                      title="Browser notifications"
                      description="Show live browser alerts for new chats and replies."
                      checked={Boolean(notificationsDraft.browserNotifications ?? notificationsDraft.browser)}
                      onChange={(checked) =>
                        setNotificationsDraft((p) => ({ ...p, browserNotifications: checked }))
                      }
                    />
                    <ToggleCard
                      title="Sound alerts"
                      description="Play subtle sounds for new chat and reply events in the inbox."
                      checked={Boolean(notificationsDraft.soundEnabled ?? notificationsDraft.sound)}
                      onChange={(checked) =>
                        setNotificationsDraft((p) => ({ ...p, soundEnabled: checked }))
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ROUTING */}
          {tab === "routing" && (
            <Card>
              <CardHeader
                title="Chat routing rules"
                subtitle="Department defaults, round robin assignment, and business routing behavior."
              />
              <CardContent className="grid gap-4 md:grid-cols-2">
                {routingQuery.isLoading ? (
                  <div className="md:col-span-2 py-8 text-center text-sm text-slate-400">Loading…</div>
                ) : (
                  <>
                    <Field label="Default department">
                      <select
                        className="input"
                        value={routingDraft.defaultDepartment || "support"}
                        onChange={(e) =>
                          setRoutingDraft((p) => ({ ...p, defaultDepartment: e.target.value }))
                        }
                      >
                        <option value="support">Support</option>
                        <option value="sales">Sales</option>
                        <option value="billing">Billing</option>
                        <option value="success">Success</option>
                      </select>
                    </Field>
                    <Field label="Fallback team">
                      <select
                        className="input"
                        value={routingDraft.fallbackTeam || "support"}
                        onChange={(e) =>
                          setRoutingDraft((p) => ({ ...p, fallbackTeam: e.target.value }))
                        }
                      >
                        <option value="support">Support</option>
                        <option value="sales">Sales</option>
                        <option value="billing">Billing</option>
                        <option value="success">Success</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <ToggleCard
                        title="Round robin assignment"
                        description="Automatically distribute new chats across online support agents."
                        checked={Boolean(routingDraft.roundRobinEnabled ?? routingDraft.roundRobin)}
                        onChange={(checked) =>
                          setRoutingDraft((p) => ({ ...p, roundRobinEnabled: checked }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <ToggleCard
                        title="Auto-assign to least busy agent"
                        description="Route new conversations to the agent with fewest open chats."
                        checked={Boolean(routingDraft.autoAssign)}
                        onChange={(checked) =>
                          setRoutingDraft((p) => ({ ...p, autoAssign: checked }))
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* SAVED REPLIES */}
          {/* {tab === "replies" && (
            <Card>
              <CardHeader
                title="Saved replies"
                subtitle="Reusable answers for faster, more consistent support."
                action={
                  <Button
                    variant="secondary"
                    onClick={() =>
                      replyMutation.mutate({
                        payload: {
                          title: "New reply",
                          shortcut: "new",
                          content: "Thanks for reaching out — happy to help."
                        }
                      })
                    }
                  >
                    <Plus size={16} />Add reply
                  </Button>
                }
              />
              <CardContent>
                {repliesQuery.isLoading ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
                ) : replies.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No saved replies yet"
                    description="Add reusable replies to speed up consistent support responses."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() =>
                          replyMutation.mutate({
                            payload: {
                              title: "New reply",
                              shortcut: "new",
                              content: "Thanks for reaching out — happy to help."
                            }
                          })
                        }
                      >
                        <Plus size={16} />Add first reply
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <div
                        key={reply._id}
                        className="rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <EditableField
                            label="Title"
                            defaultValue={reply.title}
                            onSave={(value) =>
                              replyMutation.mutate({ id: reply._id, payload: { title: value } })
                            }
                          />
                          <EditableField
                            label="Shortcut"
                            defaultValue={reply.shortcut}
                            onSave={(value) =>
                              replyMutation.mutate({ id: reply._id, payload: { shortcut: value } })
                            }
                          />
                          <div className="md:col-span-2">
                            <EditableField
                              label="Content"
                              multiline
                              defaultValue={reply.content}
                              onSave={(value) =>
                                replyMutation.mutate({ id: reply._id, payload: { content: value } })
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => deleteReplyMutation.mutate(reply._id)}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                          >
                            <X size={13} />Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )} */}
        </div>
      </div>
    </div>
  );
}

function WidgetPreview({ settings = {}, workspace = {} }) {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState("form");
  const brand = settings.primaryColor || settings.theme?.primaryColor || workspace.branding?.primaryColor || "#5B6CFF";
  const bubblePosition = settings.position || "right";
  const greeting = settings.greeting || settings.welcomeMessage || "Hi! Need help with your order or plan?";
  const proactive = settings.proactiveMessage || "We noticed you're exploring pricing. Want a quick recommendation?";
  const showPreChat = settings.preChatForm !== false;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-slate-100 via-white to-brand-50 p-6 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-brand-500/10">
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Preview canvas</div>
          <div className="mt-4 rounded-[1.5rem] border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="rounded-[1.25rem] border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{workspace.name || "LiveChat Pro"} website</div>
              <div className="mt-2 h-48 rounded-[1rem] bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />
            </div>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Experience notes</div>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">Floating bubble, expandable messenger, responsive mobile behavior.</div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">Optional pre-chat form for name, email, phone, and order number.</div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">Welcome message, proactive prompt, attachments, emoji, and offline capture flow.</div>
          </div>
        </div>
      </div>

      <div className={cn("pointer-events-none absolute bottom-6", bubblePosition === "left" ? "left-6" : "right-6")}>
        {isOpen ? (
          <div className="pointer-events-auto w-[340px] rounded-[2rem] border border-slate-200/70 bg-white shadow-2xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
            <div className="flex items-center justify-between rounded-t-[2rem] px-5 py-4 text-white" style={{ backgroundColor: brand }}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 font-semibold">{initials(workspace.name || "LP")}</div>
                <div>
                  <div className="font-semibold">{workspace.name || "LiveChat Pro"}</div>
                  <div className="text-xs text-white/80">Usually replies in under 2 minutes</div>
                </div>
              </div>
              <button className="rounded-xl bg-white/10 p-2 hover:bg-white/20" onClick={() => setIsOpen(false)}><X size={16} /></button>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-200">{greeting}</div>
              <div className="rounded-3xl border border-dashed border-brand-300 bg-brand-50/70 p-4 text-sm text-brand-700 dark:border-brand-500/35 dark:bg-brand-500/10 dark:text-brand-300">{proactive}</div>

              {showPreChat && step === "form" ? (
                <div className="space-y-3 rounded-3xl border border-slate-200/70 p-4 dark:border-slate-800">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Before we connect you</div>
                  <input className="input" placeholder="Name" />
                  <input className="input" placeholder="Email" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Phone" />
                    <input className="input" placeholder="Order #" />
                  </div>
                  <Button className="w-full" onClick={() => setStep("chat")}>Start conversation</Button>
                </div>
              ) : null}

              {step === "chat" ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl" style={{ backgroundColor: `${brand}20`, color: brand }}>A</div>
                    <div className="max-w-[78%] rounded-3xl rounded-tl-md bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Welcome! I'm Sophia from support. I can help with billing, product questions, or order updates.</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-3xl rounded-tr-md px-4 py-3 text-sm text-white" style={{ backgroundColor: brand }}>I'm looking at your pricing page. Which plan is best for a 12-person team?</div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">Offline mode preview: when no agent is available, the widget collects the message and email for follow-up.</div>
                  <div className="flex items-center gap-2 rounded-3xl border border-slate-200/70 px-3 py-2 dark:border-slate-800">
                    <button className="rounded-2xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Smile size={16} /></button>
                    <button className="rounded-2xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Paperclip size={16} /></button>
                    <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Type your message..." />
                    <button className="rounded-2xl p-2 text-white" style={{ backgroundColor: brand }}><Send size={16} /></button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <button className="pointer-events-auto mt-4 inline-flex items-center gap-3 rounded-full px-5 py-4 text-white shadow-xl transition hover:-translate-y-0.5" style={{ backgroundColor: brand }} onClick={() => setIsOpen((prev) => !prev)}>
          <MessageSquare size={18} />
          <span className="font-medium">Chat with us</span>
        </button>
      </div>
    </div>
  );
}

function WidgetPage() {
  const queryClient = useQueryClient();
  const widgetQuery = useQuery({ queryKey: ["widget-settings"], queryFn: () => apiGet("/settings/widget") });
  const workspaceQuery = useQuery({ queryKey: ["workspace-settings"], queryFn: () => apiGet("/settings/workspace") });
  const saveMutation = useMutation({ mutationFn: (payload) => apiPatch("/settings/widget", payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["widget-settings"] }) });
  const [draft, setDraft] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEmbedSnippet(workspace.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (widgetQuery.data && !draft) setDraft(widgetQuery.data);
  }, [widgetQuery.data, draft]);

  function update(path, value) {
    setDraft((prev) => {
      const next = structuredClone(prev || {});
      const parts = path.split(".");
      let cursor = next;
      parts.slice(0, -1).forEach((part) => {
        cursor[part] = cursor[part] || {};
        cursor = cursor[part];
      });
      cursor[parts.at(-1)] = value;
      return next;
    });
  }

  const widget = draft || widgetQuery.data || {};
  const workspace = workspaceQuery.data || {};

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Widget customization" subtitle="Theme, greeting, pre-chat, language-ready copy, and floating bubble behavior." action={<Button onClick={() => saveMutation.mutate(widget)}><Save size={16} />Save changes</Button>} />
          <CardContent className="space-y-4">
            <EditableField label="Primary color" defaultValue={widget.primaryColor || widget.theme?.primaryColor} onSave={(value) => update("primaryColor", value)} />
            <EditableField label="Greeting" defaultValue={widget.greeting || widget.welcomeMessage} onSave={(value) => update("greeting", value)} />
            <EditableField label="Proactive message" defaultValue={widget.proactiveMessage} onSave={(value) => update("proactiveMessage", value)} />
            <Field label="Widget position"><select className="input" value={widget.position || "right"} onChange={(event) => update("position", event.target.value)}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></Field>
            <ToggleCard title="Pre-chat form" description="Ask for name, email, phone, and order number before the first message." checked={widget.preChatForm !== false} onChange={(checked) => update("preChatForm", checked)} />
            <ToggleCard title="Offline mode capture" description="Collect message and email when no agent is available." checked={widget.offlineCapture !== false} onChange={(checked) => update("offlineCapture", checked)} />
            <ToggleCard title="Sound notifications" description="Play subtle sounds in the widget for incoming replies." checked={widget.soundEnabled !== false} onChange={(checked) => update("soundEnabled", checked)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Install snippet" 
            subtitle="Copy the script snippet for your site." 
            action={
              <Button variant="secondary" onClick={handleCopy}>
                {copied ? <CircleCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy code"}
              </Button>
            } 
          />
          <CardContent>
            <pre className="overflow-x-auto rounded-3xl border border-slate-200/70 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-800">{generateEmbedSnippet(workspace.slug)}</pre>
          </CardContent>
           
        </Card>
      </div>

      <Card>
        <CardHeader title="Live widget preview" subtitle="Responsive, polished messenger preview with pre-chat and proactive support states." />
        <CardContent>
          <WidgetPreview settings={widget} workspace={workspace} />
        </CardContent>
      </Card>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <EmptyState icon={Search} title="Page not found" description="The page you are looking for does not exist in this workspace." action={<Link to="/" className="btn-primary">Back to dashboard</Link>} />
    </div>
  );
}

function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <SocketProvider>
      <AppShell />
    </SocketProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
        <div className="surface mx-auto mt-24 max-w-xl p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-brand-600 text-white shadow-lg shadow-brand-600/30"><MessageSquareText size={28} /></div>
          <div className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">Booting LiveChat Pro</div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading workspace, team presence, and your live support context.</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} />
  
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
         <Route
    path="/automation"
    element={
      <RoleGuard allowedRoles={["owner", "admin"]}>
        <AutomationPage />
      </RoleGuard>
    }
  />
  <Route
    path="/team"
    element={
      <RoleGuard allowedRoles={["owner", "admin"]}>
        <TeamPage />
      </RoleGuard>
    }
  />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/widget" element={<WidgetPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
