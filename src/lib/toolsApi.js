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

export const getMyTools = (email) => {
  if (!email) throw new Error("Email is required to fetch my tools");
  return toolsFetch(`/loans/my-tools?email=${encodeURIComponent(email)}`);
};

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

// ─── Smart Tool Lending (2026-04-03) ────────────────────────────────────────

/** Get tech's assigned repair orders with vehicle/job info */
export const getMyAssignedROs = (email) => {
  if (!email) throw new Error("Email is required");
  return toolsFetch(`/my-assigned-ros?email=${encodeURIComponent(email)}`);
};

/** Get tool recommendations for a job (checks DB first, then AI) */
export const getToolRecommendations = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return toolsFetch(`/recommendations?${qs}`);
};

/** Submit feedback on a recommendation (was_needed) */
export const submitRecommendationFeedback = (data) =>
  toolsFetch("/recommendations", { method: "POST", body: data });

/** Create a purchase request for a tool we don't have */
export const createPurchaseRequest = (data) =>
  toolsFetch("/purchase-requests", { method: "POST", body: data });

/** List purchase requests (admin) */
export const getPurchaseRequests = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return toolsFetch(`/purchase-requests${qs ? `?${qs}` : ""}`);
};

/** Update purchase request status (admin) */
export const updatePurchaseRequest = (id, data) =>
  toolsFetch(`/purchase-requests/${id}`, { method: "PATCH", body: data });

// ─── Reports ────────────────────────────────────────────────────────────────

export const getToolsReport = (type) => toolsFetch(`/reports?type=${type}`);
