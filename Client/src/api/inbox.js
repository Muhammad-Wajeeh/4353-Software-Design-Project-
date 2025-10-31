const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// helpers
async function j(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${t || res.statusText}`);
  }
  return res.json();
}

export const InboxAPI = {
  list(userId, { onlyUnread = false } = {}) {
    const q = onlyUnread ? "?onlyUnread=true" : "";
    return j("GET", `/notifications/${userId}${q}`);
  },
  create({ user_id, title, description, isreminder = false, isassignment = false }) {
    return j("POST", `/notifications`, {
      user_id, title, description, isreminder, isassignment
    });
  },
  markRead(id) {
    return j("PUT", `/notifications/${id}/read`);
  },
  markAllRead(userId) {
    return j("PUT", `/notifications/${userId}/read-all`);
  },
  remove(id) {
    return j("DELETE", `/notifications/${id}`);
  },
};
