/**
 * Debt API service — calls Management API endpoints for employee debts.
 * Read-only for employee self-service view.
 */

const MGMT_BASE = process.env.REACT_APP_MANAGEMENT_API_URL;
const MGMT_KEY = process.env.REACT_APP_MANAGEMENT_API_KEY;

async function debtFetch(path) {
  if (!MGMT_BASE) {
    throw new Error("Missing REACT_APP_MANAGEMENT_API_URL environment variable");
  }

  const res = await fetch(`${MGMT_BASE}/api/debts${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(MGMT_KEY ? { Authorization: `Bearer ${MGMT_KEY}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Debt API error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/** Get debts for current employee (by email) */
export const getMyDebts = (email) => debtFetch(`?email=${encodeURIComponent(email)}`);

/** Get debt detail with payments */
export const getDebtDetail = (debtId) => debtFetch(`/${debtId}`);

/** Get summary for current employee (by email) */
export const getMyDebtSummary = (email) => debtFetch(`/summary?email=${encodeURIComponent(email)}`);
