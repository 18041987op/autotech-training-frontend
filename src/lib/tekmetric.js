// =============================================================================
// TEKMETRIC API CLIENT — Consumes /api/tekmetric/* from the Training backend
// =============================================================================
// Used by KeyBoard and other Training app pages to display real-time
// Tekmetric data (employees, repair orders, appointments).
//
// The backend syncs from Tekmetric every 2 minutes and stores in Supabase.
// These functions read from the backend's API routes (not Tekmetric directly).
// =============================================================================

import { apiFetch } from "./api";

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────

/**
 * Get active employees (technicians + service writers).
 * Used to populate KeyBoard technician list.
 */
export function getTekmetricEmployees() {
  return apiFetch("/api/tekmetric/employees");
}

// ─── REPAIR ORDERS ──────────────────────────────────────────────────────────

/**
 * Get active (non-invoiced) repair orders with customer/vehicle/tech info.
 * Used for KeyBoard dispatch board auto-suggest.
 */
export function getActiveRepairOrders() {
  return apiFetch("/api/tekmetric/repair-orders/active");
}

/**
 * Get a single repair order with its jobs and line items.
 * @param {number} tekmetricId - The Tekmetric ID of the repair order.
 */
export function getRepairOrder(tekmetricId) {
  return apiFetch(`/api/tekmetric/repair-orders/${tekmetricId}`);
}

/**
 * Get completed/invoiced repair orders (paginated).
 * @param {object} params - { limit, offset, start, end }
 */
export function getCompletedRepairOrders({ limit = 30, offset = 0, start, end } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return apiFetch(`/api/tekmetric/repair-orders/completed?${params}`);
}

// ─── CUSTOMERS ──────────────────────────────────────────────────────────────

/**
 * Get customers with optional search.
 * @param {string} [q] - Search term (name, email, phone).
 * @param {number} [limit=100] - Max results.
 */
export function getCustomers(q, limit = 100) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  return apiFetch(`/api/tekmetric/customers?${params}`);
}

/**
 * Get a single customer with vehicles and RO history.
 * @param {number} tekmetricId
 */
export function getCustomer(tekmetricId) {
  return apiFetch(`/api/tekmetric/customers/${tekmetricId}`);
}

// ─── VEHICLES ───────────────────────────────────────────────────────────────

/**
 * Get vehicles with optional search.
 * @param {string} [q] - Search by VIN, plate, make, or model.
 * @param {number} [limit=100] - Max results.
 */
export function getVehicles(q, limit = 100) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  return apiFetch(`/api/tekmetric/vehicles?${params}`);
}

/**
 * Get a single vehicle with owner and service history.
 * @param {number} tekmetricId
 */
export function getVehicle(tekmetricId) {
  return apiFetch(`/api/tekmetric/vehicles/${tekmetricId}`);
}

// ─── APPOINTMENTS ───────────────────────────────────────────────────────────

/**
 * Get appointments for a specific date (defaults to today).
 * @param {string} [date] - YYYY-MM-DD format. Defaults to today.
 */
export function getAppointments(date) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  return apiFetch(`/api/tekmetric/appointments?${params}`);
}

// ─── PAYROLL ────────────────────────────────────────────────────────────────

/**
 * Get payroll summary (hours/revenue per technician).
 * @param {string} [start] - ISO date for period start.
 * @param {string} [end] - ISO date for period end.
 */
export function getPayrollSummary(start, end) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();
  return apiFetch(`/api/tekmetric/payroll-summary${qs ? `?${qs}` : ""}`);
}

// ─── PARTS ──────────────────────────────────────────────────────────────────

/**
 * Get parts analysis (margins + vendor spend).
 */
export function getPartsAnalysis() {
  return apiFetch("/api/tekmetric/parts-analysis");
}

// ─── SYNC CONTROL ───────────────────────────────────────────────────────────

/**
 * Get sync status for all entities.
 */
export function getSyncStatus() {
  return apiFetch("/api/tekmetric/sync/status");
}

/**
 * Trigger manual sync (admin only).
 * @param {"delta"|"full"} [type="delta"]
 */
export function triggerSync(type = "delta") {
  return apiFetch("/api/tekmetric/sync/run", {
    method: "POST",
    body: { type },
  });
}
