/**
 * Tools API service — calls Management API endpoints for tool management.
 * Management API base: REACT_APP_MANAGEMENT_API_URL (e.g. https://management.autorxcenter.com)
 */

const MGMT_BASE = process.env.REACT_APP_MANAGEMENT_API_URL;
const MGMT_KEY = process.env.REACT_APP_MANAGEMENT_API_KEY;

async function toolsFetch(path, { method = "GET", body } = {}) {
  if (!MGMT_BASE) {
    throw new Error("Missing REACT_APP_MANAGEMENT_API_URL environment variable");
  }

  const res = await fetch(`${MGMT_BASE}/api/tools${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(MGMT_KEY ? { Authorization: `Bearer ${MGMT_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Tools API error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ─── Tools CRUD ─────────────────────────────────────────────────────────────

export const getTools = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return toolsFetch(qs ? `?${qs}` : "");
};

export const getTool = (id) => toolsFetch(`/${id}`);

export const createTool = (data) =>
  toolsFetch("", { method: "POST", body: data });

export const updateTool = (id, data) =>
  toolsFetch(`/${id}`, { method: "PUT", body: data });

export const deleteTool = (id) =>
  toolsFetch(`/${id}`, { method: "DELETE" });

export const updateToolStatus = (id, status) =>
  toolsFetch(`/${id}/status`, { method: "PATCH", body: { status } });

// ─── Stats ──────────────────────────────────────────────────────────────────

export const getToolStats = () => toolsFetch("/stats");

// ─── Loans ──────────────────────────────────────────────────────────────────

export const getLoans = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return toolsFetch(`/loans${qs ? `?${qs}` : ""}`);
};

export const getLoan = (id) => toolsFetch(`/loans/${id}`);

export const borrowTool = (data) =>
  toolsFetch("/loans", { method: "POST", body: data });

export const returnTool = (loanId, data) =>
  toolsFetch(`/loans/${loanId}/return`, { method: "PUT", body: data });

export const transferTool = (loanId, data) =>
  toolsFetch(`/loans/${loanId}/transfer`, { method: "PUT", body: data });

export const getMyTools = () => toolsFetch("/loans/my-tools");

// ─── Users ──────────────────────────────────────────────────────────────────

export const getToolsUsers = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return toolsFetch(`/users${qs ? `?${qs}` : ""}`);
};

export const getToolsUser = (id) => toolsFetch(`/users/${id}`);

export const createToolsUser = (data) =>
  toolsFetch("/users", { method: "POST", body: data });

export const updateToolsUser = (id, data) =>
  toolsFetch(`/users/${id}`, { method: "PUT", body: data });

export const toggleToolsUserStatus = (id) =>
  toolsFetch(`/users/${id}`, { method: "PATCH" });

// ─── Notifications ──────────────────────────────────────────────────────────

export const getNotifications = () => toolsFetch("/notifications");

export const markNotificationsRead = (ids) =>
  toolsFetch("/notifications", { method: "PUT", body: { ids } });

// ─── Reports ────────────────────────────────────────────────────────────────

export const getToolsReport = (type) => toolsFetch(`/reports?type=${type}`);
