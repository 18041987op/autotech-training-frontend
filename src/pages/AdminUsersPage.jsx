import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../lib/api";

function Pill({ children }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold">
      {children}
    </span>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useOutletContext() || {};
  const currentUserId = currentUser?.id;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Add User modal state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician",
    approved: true
  });

  const openCreateUser = () => {
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "technician",
      approved: true
    });
    setShowCreateUser(true);
  };

  const closeCreateUser = () => setShowCreateUser(false);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const out = await apiFetch("/api/admin/users");
      setUsers(out.users || []);
    } catch (e) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    // Pending = not approved and never logged in; Inactive = not approved but had login before
    const pending = users.filter((u) => !u.approved && !u.last_login).length;
    const inactive = users.filter((u) => !u.approved && u.last_login).length;
    const admins = users.filter((u) => u.role === "admin").length;
    return { total, pending, inactive, admins };
  }, [users]);

  const approve = async (id) => {
    try {
      await apiFetch(`/api/admin/users/${id}/approve`, { method: "PATCH" });
      await load();
    } catch (e) {
      alert(e.message || "Failed to approve");
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm(t("adminUsers.deactivateConfirm"))) return;
    try {
      await apiFetch(`/api/admin/users/${id}/deactivate`, { method: "PATCH" });
      await load();
    } catch (e) {
      alert(e.message || "Failed to deactivate");
    }
  };

  const setRole = async (id, role) => {
    try {
      await apiFetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: { role }
      });
      await load();
    } catch (e) {
      alert(e.message || "Failed to update role");
    }
  };

  const createUser = async () => {
    if (creating) return;

    const name = (newUser.name || "").trim();
    const email = (newUser.email || "").trim();
    const password = newUser.password || "";

    if (!name) return alert("Name is required");
    if (!email) return alert("Email is required");
    if (!password || password.length < 6)
      return alert("Password must be at least 6 characters");

    setCreating(true);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: {
          name,
          email,
          password,
          role: newUser.role,
          approved: !!newUser.approved
        }
      });

      closeCreateUser();
      await load();
    } catch (e) {
      alert(e.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
        {t("status.loading")}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{t("adminUsers.title")}</h1>
            <p className="mt-2 text-sm text-slate-600">{t("adminUsers.subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary btn-sm" onClick={openCreateUser} type="button">
              + Add User
            </button>

            <button className="btn-outline-sm" onClick={load} type="button">
              {t("actions.refresh")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("adminUsers.total")}
            </p>
            <p className="mt-2 text-2xl font-extrabold">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("adminUsers.pending")}
            </p>
            <p className="mt-2 text-2xl font-extrabold">{stats.pending}</p>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
              {t("adminUsers.inactiveTag")}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-red-700">{stats.inactive}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("adminUsers.admins")}
            </p>
            <p className="mt-2 text-2xl font-extrabold">{stats.admins}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        {users.length === 0 ? (
          <div className="text-sm text-slate-600">{t("status.noneFound")}</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-extrabold truncate">{u.name}</div>
                      <Pill>{u.role}</Pill>

                      {u.approved ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {t("adminUsers.activeTag")}
                        </span>
                      ) : u.last_login ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
                          {t("adminUsers.inactiveTag")}
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          {t("adminUsers.pendingTag")}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-500 truncate">{u.email}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {t("adminUsers.lastLogin")}:{" "}
                      {u.last_login ? new Date(u.last_login).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!u.approved ? (
                      <button
                        className="btn-accent btn-sm"
                        onClick={() => approve(u.id)}
                        type="button"
                      >
                        {t("adminUsers.activate")}
                      </button>
                    ) : u.id !== currentUserId ? (
                      <button
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        onClick={() => deactivate(u.id)}
                        type="button"
                      >
                        {t("adminUsers.deactivate")}
                      </button>
                    ) : null}

                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold transition-colors hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand-soft"
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value)}
                    >
                      <option value="technician">{t("roles.technician")}</option>
                      <option value="administrative">{t("roles.administrative")}</option>
                      <option value="service_advisor">{t("roles.serviceAdvisor")}</option>
                      <option value="admin">{t("roles.admin")}</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreateUser} />

          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold">Add User</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create a new user and assign a role.
                </p>
              </div>

              <button className="btn-outline-sm" onClick={closeCreateUser} type="button">
                {t("actions.close")}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Full name</label>
                <input
                  className="mt-1 input"
                  value={newUser.name}
                  onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Juan Perez"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Email</label>
                <input
                  className="mt-1 input"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@autorxcenter.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Temporary password
                </label>
                <input
                  className="mt-1 input"
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  type="password"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Role</label>
                  <select
                    className="mt-1 input bg-white"
                    value={newUser.role}
                    onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="technician">{t("roles.technician")}</option>
                    <option value="service_advisor">{t("roles.serviceAdvisor")}</option>
                    <option value="administrative">{t("roles.administrative")}</option>
                    <option value="admin">{t("roles.admin")}</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newUser.approved}
                      onChange={(e) =>
                        setNewUser((p) => ({ ...p, approved: e.target.checked }))
                      }
                    />
                    Approved
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-outline-sm" onClick={closeCreateUser} type="button">
                {t("actions.cancel")}
              </button>

              <button
                className="btn-primary btn-sm px-4 disabled:opacity-60"
                onClick={createUser}
                type="button"
                disabled={creating}
              >
                {creating ? "Creating…" : "Create user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
