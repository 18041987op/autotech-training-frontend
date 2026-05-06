/**
 * Production API service — calls Management API endpoints for the
 * Production section of the Training App.
 *
 * Same pattern as hrApi.js / toolsApi.js / debtApi.js: direct call to the
 * Management Portal Next.js API with REACT_APP_MANAGEMENT_API_URL +
 * REACT_APP_MANAGEMENT_API_KEY (Bearer token).
 */

const MGMT_BASE = process.env.REACT_APP_MANAGEMENT_API_URL;
const MGMT_KEY  = process.env.REACT_APP_MANAGEMENT_API_KEY;

async function productionFetch(path, { method = "GET", body } = {}) {
  if (!MGMT_BASE) {
    throw new Error("Missing REACT_APP_MANAGEMENT_API_URL environment variable");
  }

  const res = await fetch(`${MGMT_BASE}/api/production${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(MGMT_KEY ? { Authorization: `Bearer ${MGMT_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Production API error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ─── Daily breakdown ──────────────────────────────────────────────────────

/**
 * Fetch day-by-day production for an employee.
 * @param {string} email   work_email of the employee
 * @param {string} start   YYYY-MM-DD
 * @param {string} end     YYYY-MM-DD (inclusive)
 */
export const getDailyProduction = (email, start, end) => {
  const qs = new URLSearchParams();
  qs.set("email", email);
  qs.set("startDate", start);
  qs.set("endDate", end);
  return productionFetch(`/daily?${qs}`);
};

// ─── Live scorecard (replaces /api/payroll-metrics for current week) ─────

/**
 * Fetch the current-week production scorecard for an employee.
 * Returns the same shape as the legacy /api/payroll-metrics endpoint
 * (linked, employee, period, metrics, ranking, benchmarks, compensation,
 * checkin_needed) but computed live from Tekmetric instead of from the
 * pre-computed CSV-upload tables.
 *
 * @param {string} email work_email of the employee
 */
export const getProductionScorecard = (email) => {
  const qs = new URLSearchParams();
  qs.set("email", email);
  return productionFetch(`/scorecard?${qs}`);
};

// ─── Live history (replaces /api/payroll-history for last 13 weeks) ─────

/**
 * Fetch last N weeks of production history for an employee.
 * Returns same shape as the legacy /api/payroll-history endpoint
 * (employee, streak, trend, benchmarks, history[]) but computed live
 * from Tekmetric instead of the CSV-uploaded periods/tech_summary tables.
 *
 * @param {string} email work_email of the employee
 * @param {number} weeks how many weeks back (default 13, max 26)
 */
export const getProductionHistory = (email, weeks = 13) => {
  const qs = new URLSearchParams();
  qs.set("email", email);
  qs.set("weeks", String(weeks));
  return productionFetch(`/history?${qs}`);
};

// ─── Issue reports ────────────────────────────────────────────────────────

/**
 * Submit a "missing/incorrect production" report for a specific day.
 * @param {object} payload { email, report_date, description, issue_type? }
 */
export const reportProductionIssue = (payload) =>
  productionFetch(`/report-issue`, { method: "POST", body: payload });

/**
 * Admin: list issue reports.
 * @param {object} filters { status?, weekStart?, limit? }
 */
export const listProductionIssues = (filters = {}) => {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.weekStart) qs.set("weekStart", filters.weekStart);
  if (filters.limit) qs.set("limit", String(filters.limit));
  const q = qs.toString();
  return productionFetch(`/issues${q ? `?${q}` : ""}`);
};

/**
 * Admin: update a report's status / notes.
 * @param {object} payload { id, status?, admin_notes?, reviewed_by_email? }
 */
export const updateProductionIssue = (payload) =>
  productionFetch(`/issues`, { method: "PATCH", body: payload });

// ─── Reassignments (job assignment changes) ─────────────────────────────

/**
 * List reassignments where this employee was the FROM tech (lost the work).
 * @param {string} email work_email
 * @param {object} opts  { weekStart?, weekEnd? }
 */
export const getMyReassignments = (email, opts = {}) => {
  const qs = new URLSearchParams();
  qs.set("email", email);
  if (opts.weekStart) qs.set("weekStart", opts.weekStart);
  if (opts.weekEnd)   qs.set("weekEnd", opts.weekEnd);
  return productionFetch(`/reassignments?${qs}`);
};

/**
 * Acknowledge or report a reassignment.
 * @param {object} payload { id, action: "ack" | "report", email }
 */
export const updateReassignment = (payload) =>
  productionFetch(`/reassignments`, { method: "POST", body: payload });
