/**
 * HR API service — calls Management API endpoints for HR features.
 * Same auth pattern as toolsApi.js (Bearer token to Management API).
 *
 * Convention:
 *  - Employee views pass `email` (from login) → API resolves to emp_id via work_email
 *  - Admin views can pass `emp_id` directly to view another employee's data
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

/** Get profile by email (own) or emp_id (admin viewing another) */
export const getMyProfile = (email, empId) => {
  if (!email && !empId) throw new Error("Email or emp_id is required");
  const qs = new URLSearchParams();
  if (empId) qs.set("emp_id", empId);
  else qs.set("email", email);
  return hrFetch(`/profile?${qs}`);
};

export const updateMyProfile = (email, data) =>
  hrFetch(`/profile?email=${encodeURIComponent(email)}`, { method: "PUT", body: data });

// ─── Schedule ──────────────────────────────────────────────────────────────

export const getMySchedule = (email, startDate, endDate, empId) => {
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
  if (empId) qs.set("emp_id", empId);
  else if (email) qs.set("email", email);
  return hrFetch(`/schedule?${qs}`);
};

// ─── Timesheet ─────────────────────────────────────────────────────────────

export const getMyTimesheet = (email, range = "week", empId) => {
  const qs = new URLSearchParams({ range });
  if (empId) qs.set("emp_id", empId);
  else if (email) qs.set("email", email);
  return hrFetch(`/timesheet?${qs}`);
};

export const clockIn = (email) => {
  if (!email) throw new Error("Email is required to clock in");
  return hrFetch("/timesheet/clock-in", { method: "POST", body: { email: String(email) } });
};

export const clockOut = (email) => {
  if (!email) throw new Error("Email is required to clock out");
  return hrFetch("/timesheet/clock-out", { method: "POST", body: { email: String(email) } });
};

// ─── Time Off ──────────────────────────────────────────────────────────────

export const getMyTimeOff = (email, empId) => {
  const qs = new URLSearchParams();
  if (empId) qs.set("emp_id", empId);
  else if (email) qs.set("email", email);
  return hrFetch(`/time-off?${qs}`);
};

/** Admin: get all time-off requests from all employees */
export const getAllTimeOff = () => hrFetch("/time-off?all=true");

export const getTimeOffBalance = (email, empId) => {
  const qs = new URLSearchParams();
  if (empId) qs.set("emp_id", empId);
  else if (email) qs.set("email", email);
  return hrFetch(`/time-off/balance?${qs}`);
};

export const requestTimeOff = (email, data) =>
  hrFetch("/time-off", { method: "POST", body: { email, ...data } });

/** Admin: approve/deny a request */
export const updateTimeOffRequest = (id, data) =>
  hrFetch(`/time-off/${id}`, { method: "PUT", body: data });

// ─── Benefits ──────────────────────────────────────────────────────────────

export const getBenefits = () => hrFetch("/benefits");

// ─── Team Directory ────────────────────────────────────────────────────────

/** Get team directory (active only by default). Admin can pass showInactive=true */
export const getTeamDirectory = (showInactive = false) => {
  const qs = showInactive ? "?show_inactive=true" : "";
  return hrFetch(`/team${qs}`);
};
