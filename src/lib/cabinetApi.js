/**
 * Cabinet / Smart Lock API service — calls Management API endpoints for cabinet door access.
 * Uses same base URL and auth as toolsApi.js
 */

const MGMT_BASE = process.env.REACT_APP_MANAGEMENT_API_URL;
const MGMT_KEY = process.env.REACT_APP_MANAGEMENT_API_KEY;

async function cabinetFetch(path, { method = "GET", body } = {}) {
  if (!MGMT_BASE) {
    throw new Error("Missing REACT_APP_MANAGEMENT_API_URL environment variable");
  }

  const res = await fetch(`${MGMT_BASE}/api/cabinets${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(MGMT_KEY ? { Authorization: `Bearer ${MGMT_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Cabinet API error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ─── Door Access ────────────────────────────────────────────────────────────

/**
 * Check what a user can do at a specific door (pickup, return, or nothing).
 * Called when technician scans QR code.
 */
export const checkDoorAccess = (doorCode, userEmail) =>
  cabinetFetch(`/doors/${doorCode}?user_email=${encodeURIComponent(userEmail)}`);

/**
 * Request to unlock a door.
 * Only succeeds if user has valid loan for a tool behind this door.
 */
export const unlockDoor = (doorCode, { user_id, action, loan_id, tool_id, override_reason } = {}) =>
  cabinetFetch(`/doors/${doorCode}/unlock`, {
    method: "POST",
    body: { user_id, action, loan_id, tool_id, override_reason },
  });

/**
 * Confirm that the technician physically took or returned the tool.
 * Updates the loan status accordingly.
 */
export const confirmDoorAction = (doorCode, {
  access_log_id,
  action,
  loan_id,
  return_condition_status,
  return_has_damage,
  return_damage_description,
  was_needed,
  door_was_closed,
  door_not_closed_reason,
} = {}) =>
  cabinetFetch(`/doors/${doorCode}/confirm`, {
    method: "POST",
    body: {
      access_log_id,
      action,
      loan_id,
      return_condition_status,
      return_has_damage,
      return_damage_description,
      was_needed,
      door_was_closed,
      door_not_closed_reason,
    },
  });

/**
 * Poll the current door state (is_open from reed switch sensor).
 * Used by DoorAccessPage to show real-time open/closed status after unlock.
 */
export const getDoorState = (doorCode) =>
  cabinetFetch(`/doors/${doorCode}/state`);

// ─── Admin: Cabinets CRUD ───────────────────────────────────────────────────

export const getCabinets = () => cabinetFetch("");

export const createCabinet = (data) =>
  cabinetFetch("", { method: "POST", body: data });

export const getDoors = (cabinetId) =>
  cabinetFetch(`/doors${cabinetId ? `?cabinet_id=${cabinetId}` : ""}`);

export const createDoor = (data) =>
  cabinetFetch("/doors", { method: "POST", body: data });
