// import axios from "axios";
// import { clsx } from "clsx";
// import { format, formatDistanceToNowStrict, isValid } from "date-fns";

// export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
// export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// export const http = axios.create({
//   baseURL: API_URL
// });

// http.interceptors.request.use((config) => {
//   const token = localStorage.getItem("livechatpro_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// http.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const message =
//       error?.response?.data?.message ||
//       error?.response?.data?.error ||
//       error.message ||
//       "Something went wrong";
//     return Promise.reject(new Error(message));
//   }
// );

// export async function apiGet(url, config = {}) {
//   const response = await http.get(url, config);
//   return response.data.data;
// }

// export async function apiPost(url, body = {}, config = {}) {
//   const response = await http.post(url, body, config);
//   return response.data.data;
// }

// export async function apiPatch(url, body = {}, config = {}) {
//   const response = await http.patch(url, body, config);
//   return response.data.data;
// }

// export function cn(...values) {
//   return clsx(values);
// }

// export function initials(name = "") {
//   return (
//     name
//       .split(" ")
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((part) => part[0]?.toUpperCase())
//       .join("") || "?"
//   );
// }

// export function formatDateTime(value) {
//   if (!value) return "—";
//   const date = new Date(value);
//   return isValid(date) ? format(date, "dd MMM yyyy · HH:mm") : "—";
// }

// export function formatTime(value) {
//   if (!value) return "";
//   const date = new Date(value);
//   return isValid(date) ? format(date, "HH:mm") : "";
// }

// export function timeAgo(value) {
//   if (!value) return "just now";
//   const date = new Date(value);
//   return isValid(date) ? formatDistanceToNowStrict(date, { addSuffix: true }) : "just now";
// }

// export function getStatusTone(status = "") {
//   const map = {
//     open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
//     resolved: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
//     missed: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
//     spam: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
//     online: "bg-emerald-500",
//     away: "bg-amber-500",
//     offline: "bg-slate-400"
//   };
//   return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
// }

// export function buildAttachmentUrl(url = "") {
//   if (!url) return "";
//   if (url.startsWith("http")) return url;
//   return `${SOCKET_URL}${url}`;
// }

// export function generateEmbedSnippet(slug = "livechat-pro-demo") {
//   return `<script>
//   window.LiveChatPro = { workspace: "${slug}" };
// </script>
// <script async src="https://cdn.livechatpro.app/widget.js"></script>`;
// }


// --------------------
import axios from "axios";
import { clsx } from "clsx";
import { format, formatDistanceToNowStrict, isValid } from "date-fns";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const http = axios.create({
  baseURL: API_URL
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("chatlee_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export async function apiGet(url, params = {}) {
  const hasParams = params && Object.keys(params).length > 0;
  const response = await http.get(url, hasParams ? { params } : {});
  return response.data.data;
}

export async function apiPost(url, body = {}, config = {}) {
  const response = await http.post(url, body, config);
  return response.data.data;
}

export async function apiPatch(url, body = {}, config = {}) {
  const response = await http.patch(url, body, config);
  return response.data.data;
}

export async function apiDelete(url, body = {}, config = {}) {
  const response = await http.delete(url, body, config);
  return response.data.data;
}

export function cn(...values) {
  return clsx(values);
}

export function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return isValid(date) ? format(date, "dd MMM yyyy · HH:mm") : "—";
}

export function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return isValid(date) ? format(date, "HH:mm") : "";
}

export function timeAgo(value) {
  if (!value) return "just now";
  const date = new Date(value);
  return isValid(date) ? formatDistanceToNowStrict(date, { addSuffix: true }) : "just now";
}

export function getStatusTone(status = "") {
  const map = {
    open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    resolved: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
    missed: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    spam: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    online: "bg-emerald-500",
    away: "bg-amber-500",
    offline: "bg-slate-400"
  };
  return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function buildAttachmentUrl(url = "") {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SOCKET_URL}${url}`;
}

export function generateEmbedSnippet(slug = "chatlee-demo") {
  return `<script>
  window.Chatlee = {
    workspace: "${slug}",
    apiUrl: "${SOCKET_URL}"
  };
</script>
<script async src="${SOCKET_URL}/widget.js"></script>`;
}



// ✅ Backend port 5000 use karo
// export async function generateEmbedSnippet(workspaceSlug = "livechat-pro-demo") {
//   try {
//     // Backend API call (port 5000)
//     const response = await axios.get(`http://localhost:5000/api/workspace/${workspaceSlug}`);
//     const workspace = await response.json();
    
//     return `<script>
//     window.LiveChatPro = { 
//       workspace: "${workspace.slug}",
//       workspaceId: "${workspace.id}"
//     };
//   </script>
//   <script async src="http://localhost:5000/widget.js"></script>`;
//   } catch (error) {
//     console.error("Workspace fetch failed:", error);
//     return `<script>
//     window.LiveChatPro = { workspace: "${workspaceSlug}" };
//   </script>
//   <script async src="http://localhost:5000/widget.js"></script>`;
//   }
// }