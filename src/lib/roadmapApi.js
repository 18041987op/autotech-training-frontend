/**
 * Roadmap & Releases API client for the Training App.
 * Calls Management Portal endpoints (REACT_APP_MANAGEMENT_API_URL +
 * REACT_APP_MANAGEMENT_API_KEY), same pattern as productionApi.js / hrApi.js.
 */

const MGMT_BASE = process.env.REACT_APP_MANAGEMENT_API_URL;
const MGMT_KEY  = process.env.REACT_APP_MANAGEMENT_API_KEY;

async function fetchMgmt(path, { method = "GET", body } = {}) {
  if (!MGMT_BASE) throw new Error("Missing REACT_APP_MANAGEMENT_API_URL");
  const res = await fetch(`${MGMT_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(MGMT_KEY ? { Authorization: `Bearer ${MGMT_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Roadmap API error (${res.status})`);
  }
  return data;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────

/** GET roadmap state for a user (items + ideas + counts + my votes) */
export const getRoadmap = (email) =>
  fetchMgmt(`/api/roadmap?email=${encodeURIComponent(email)}`);

export const createRoadmapItem = (email, payload) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "create_item", email, ...payload } });

export const updateRoadmapItem = (email, payload) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "update_item", email, ...payload } });

export const deleteRoadmapItem = (email, id) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "delete_item", email, id } });

export const submitIdea = (email, payload) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "create_idea", email, ...payload } });

export const triageIdea = (email, payload) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "triage_idea", email, ...payload } });

export const promoteIdea = (email, id, itemOverrides = {}) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "promote_idea", email, id, item: itemOverrides } });

export const toggleVote = (email, target_type, target_id) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "toggle_vote", email, target_type, target_id } });

export const addComment = (email, target_type, target_id, body) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "add_comment", email, target_type, target_id, body } });

export const getComments = (target_type, target_id) =>
  fetchMgmt(`/api/roadmap/comments?target_type=${target_type}&target_id=${target_id}`);

export const updateComment = (email, id, body) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "update_comment", email, id, body } });

export const deleteComment = (email, id) =>
  fetchMgmt(`/api/roadmap`, { method: "POST", body: { action: "delete_comment", email, id } });

// ─── Releases ─────────────────────────────────────────────────────────────

export const getReleases = (email, includeDrafts = false) => {
  const qs = new URLSearchParams();
  qs.set("email", email);
  if (includeDrafts) qs.set("include_drafts", "true");
  return fetchMgmt(`/api/releases?${qs}`);
};

export const createRelease = (email, payload) =>
  fetchMgmt(`/api/releases`, { method: "POST", body: { action: "create", email, ...payload } });

export const updateRelease = (email, payload) =>
  fetchMgmt(`/api/releases`, { method: "POST", body: { action: "update", email, ...payload } });

export const deleteRelease = (email, id) =>
  fetchMgmt(`/api/releases`, { method: "POST", body: { action: "delete", email, id } });
