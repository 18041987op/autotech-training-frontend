import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch, getToken } from "../lib/api";

function isJwtAdmin() {
  try {
    const token = getToken?.();
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload?.role || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

export function AssessmentsPage() {
  const { t } = useTranslation();
  const nav = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Admin-only toggle (UI only)
  const [showInactive, setShowInactive] = useState(false);
  const isAdmin = isJwtAdmin();

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const out = await apiFetch("/api/assessments/user");
      setModules(out.modules || []);
    } catch (e) {
      setErr(e.message || "Failed to load assessments");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const modulesWithAssessments = useMemo(() => {
    const base = (modules || []).filter((m) => (m.assessments || []).length > 0);

    return base.map((m) => {
      const active = (m.assessments || []).filter((a) => a.isActive !== false);
      const inactive = (m.assessments || []).filter((a) => a.isActive === false);

      return {
        ...m,
        activeAssessments: active,
        inactiveAssessments: inactive
      };
    });
  }, [modules]);

  const totalInactive = useMemo(() => {
    return modulesWithAssessments.reduce((sum, m) => sum + (m.inactiveAssessments?.length || 0), 0);
  }, [modulesWithAssessments]);

  if (loading) {
    return (
      <div className="card p-6 text-sm text-slate-600">
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
            <h1 className="text-2xl font-extrabold">{t("modules.assessments.title")}</h1>
            <p className="mt-2 text-sm text-slate-600">{t("modules.assessments.subtitle")}</p>

            {isAdmin && totalInactive > 0 ? (
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  Show inactive ({totalInactive})
                </label>
              </div>
            ) : null}
          </div>

          <button className="btn-outline-sm" onClick={load} type="button">
            {t("actions.refresh")}
          </button>
        </div>
      </div>

      {modulesWithAssessments.length === 0 ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
          <div className="font-extrabold">{t("assessmentRunner.historyNone")}</div>
          <div className="mt-2 text-xs text-slate-500">{t("modules.empty.hint")}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {modulesWithAssessments.map((m) => {
            const list = showInactive && isAdmin
              ? [...m.activeAssessments, ...m.inactiveAssessments]
              : m.activeAssessments;

            // If still empty (all inactive and user is not showing inactive), hide module card
            if (!list.length) return null;

            return (
              <div key={m.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold truncate">{m.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{m.description || "—"}</div>

                    {isAdmin && m.inactiveAssessments.length > 0 ? (
                      <div className="mt-2 text-xs text-slate-500">
                        Inactive in this module: {m.inactiveAssessments.length}
                      </div>
                    ) : null}
                  </div>

                  <button className="btn-outline-sm" type="button" onClick={() => nav(`/modules/${m.id}`)}>
                    {t("actions.open")}
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {list.map((a) => {
                    const active = a.isActive !== false;
                    return (
                      <div
                        key={a.id}
                        className={
                          active
                            ? "rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4"
                            : "rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4 opacity-70"
                        }
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-extrabold truncate">{a.title || "Assessment"}</div>
                            {!active ? (
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold">
                                Inactive
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {t("moduleDetail.passingScore")}: {a.passingScore ?? 70}%
                            {a.lastAttempt ? (
                              <>
                                <span className="mx-2">•</span>
                                {t("assessmentRunner.score")}:{" "}
                                <span className="font-semibold">{a.lastAttempt.score ?? "—"}%</span>
                                <span className="mx-2">•</span>
                                {a.lastAttempt.createdAt ? new Date(a.lastAttempt.createdAt).toLocaleString() : "—"}
                              </>
                            ) : null}
                          </div>
                        </div>

                        {/* Recommendation: allow Start even if inactive for admin only */}
                        <button
                          className="btn-accent btn-sm px-4"
                          type="button"
                          onClick={() => nav(`/modules/${m.id}/assessments/${a.id}`)}
                          disabled={!active && !isAdmin}
                          title={!active && !isAdmin ? "Inactive assessment" : ""}
                        >
                          {t("moduleDetail.startAssessment")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
