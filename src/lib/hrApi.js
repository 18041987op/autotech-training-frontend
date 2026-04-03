/**
 * HR API service — calls Management API endpoints for HR features.
 * Same auth pattern as toolsApi.js (Bearer token to Management API).
 */

const MGMT_BASE = process.env.REACT_APP_MANAGEMENT_API_URL;
const MGMT_KEY = process.env.REACT_APP_MANAGEMENT_API_KEY;

async function hrFetch(path, { method = "GET", body } = {}) {
  if (!MGMT_BASE) {
    throw new Error("Missing REACT_APP_MANAGEMENT_API_URL environment variable");
  }

  const res = await fetch(`${MGMT_BASE}/api/hr${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(MGMT_KEY ? { Authorization: `Bearer ${MGMT_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `HR API error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ─── Profile ───────────────────────────────────────────────────────────────

export const getMyProfile = (email) => {
  if (!email) throw new Error("Email is required");
  return hrFetch(`/profile?email=${encodeURIComponent(email)}`);
};

export const updateMyProfile = (email, data) =>
  hrFetch(`/profile?email=${encodeURIComponent(email)}`, { method: "PUT", body: data });

// ─── Schedule ──────────────────────────────────────────────────────────────

export const getMySchedule = (email, startDate, endDate) => {
  if (!email) throw new Error("Email is required");
  const qs = new URLSearchParams({ email, start_date: startDate, end_date: endDate });
  return hrFetch(`/schedule?${qs}`);
};

// ─── Timesheet ─────────────────────────────────────────────────────────────

export const getMyTimesheet = (email, range = "week") => {
  if (!email) throw new Error("Email is required");
  return hrFetch(`/timesheet?email=${encodeURIComponent(email)}&range=${range}`);
};

export const clockIn = (email) =>
  hrFetch("/timesheet/clock-in", { method: "POST", body: { email } });

export const clockOut = (email) =>
  hrFetch("/timesheet/clock-out", { method: "POST", body: { email } });

// ─── Time Off ──────────────────────────────────────────────────────────────

export const getMyTimeOff = (email) => {
  if (!email) throw new Error("Email is required");
  return hrFetch(`/time-off?email=${encodeURIComponent(email)}`);
};

export const getTimeOffBalance = (email) => {
  if (!email) throw new Error("Email is required");
  return hrFetch(`/time-off/balance?email=${encodeURIComponent(email)}`);
};

export const requestTimeOff = (email, data) =>
  hrFetch("/time-off", { method: "POST", body: { email, ...data } });

// Admin: approve/deny
export const updateTimeOffRequest = (id, data) =>
  hrFetch(`/time-off/${id}`, { method: "PUT", body: data });

// ─── Benefits ──────────────────────────────────────────────────────────────

export const getBenefits = () => hrFetch("/benefits");

// ─── Team Directory ────────────────────────────────────────────────────────

export const getTeamDirectory = () => hrFetch("/team");
