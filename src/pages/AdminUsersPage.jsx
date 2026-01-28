import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
    const pending = users.filter((u) => !u.approved).length;
    const admins = users.filter((u) => u.role === "admin").length;
    return { total, pending, admins };
  }, [users]);

  const approve = async (id) => {
    try {
      await apiFetch(`/api/admin/users/${id}/approve`, { method: "PATCH" });
      await load();
    } catch (e) {
      alert(e.message || "Failed to approve");
    }
  };

  const setRole = async (id, role) => {
    try {
      await apiFetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: { role },
      });
      await load();
    } catch (e) {
      alert(e.message || "Failed to update role");
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
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
            onClick={load}
            type="button"
          >
            {t("actions.refresh")}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("adminUsers.total")}</p>
            <p className="mt-2 text-2xl font-extrabold">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("adminUsers.pending")}</p>
            <p className="mt-2 text-2xl font-extrabold">{stats.pending}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("adminUsers.admins")}</p>
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
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-extrabold truncate">{u.name}</div>
                      <Pill>{u.role}</Pill>
                      {!u.approved ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          {t("adminUsers.pendingTag")}
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {t("adminUsers.activeTag")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 truncate">{u.email}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {t("adminUsers.lastLogin")}: {u.last_login ? new Date(u.last_login).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!u.approved ? (
                      <button
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        onClick={() => approve(u.id)}
                        type="button"
                      >
                        {t("adminUsers.approve")}
                      </button>
                    ) : null}

                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
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
    </div>
  );
}
