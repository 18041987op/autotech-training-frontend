const API_BASE = process.env.REACT_APP_API_BASE_URL;

function getToken() {
  try {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  } catch {
    return null;
  }
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  if (!API_BASE) {
    throw new Error("Missing REACT_APP_API_BASE_URL in environment variables");
  }

  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
}
