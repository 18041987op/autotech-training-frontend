import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch, getToken } from "../lib/api";
import { PageHero } from "../components/PageHero";
import { normalizeAllCaps } from "../lib/text";

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
      <PageHero
        eyebrow="AutoRx Academy"
        title={t("modules.assessments.title")}
        subtitle={t("modules.assessments.subtitle")}
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 active:scale-95"
            style={{ background: "#F7941D" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#e07d0e")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#F7941D")
            }
            onClick={load}
            type="button"
          >
            {t("actions.refresh")}
          </button>
        }
      />

      {isAdmin && totalInactive > 0 ? (
        <div className="card p-4">
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

      {modulesWithAssessments.length === 0 ? (
        <div className="card p-6 text-sm text-slate-600">
          <div className="font-extrabold">{t("assessmentRunner.historyNone")}</div>
          <div className="mt-2 text-xs text-slate-500">{t("modules.empty.hint")}</div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {modulesWithAssessments.map((m) => {
            const list = showInactive && isAdmin
              ? [...m.activeAssessments, ...m.inactiveAssessments]
              : m.activeAssessments;

            if (!list.length) return null;

            return (
              <div
                key={m.id}
                className="card p-3.5 flex flex-col gap-2 cursor-pointer hover:-translate-y-[2px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft transition-all"
                onClick={() => nav(`/modules/${m.id}`)}
              >
                {/* Module title + description — same 2-line pattern as other pages */}
                <div>
                  <div className="text-sm font-extrabold leading-snug line-clamp-2">
                    {normalizeAllCaps(m.title)}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {normalizeAllCaps(m.description) || "—"}
                  </div>
                </div>

                {/* Assessment chips — compact, one per assessment */}
                <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-slate-100">
                  {list.map((a) => {
                    const active = a.isActive !== false;
                    const scored = a.lastAttempt?.score != null;
                    const passed = scored && a.lastAttempt.score >= (a.passingScore ?? 70);
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs
                          ${active ? "bg-slate-50 border border-slate-200" : "opacity-50 bg-slate-50 border border-slate-200"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (active || isAdmin) nav(`/modules/${m.id}/assessments/${a.id}`);
                        }}
                      >
                        <span className="font-semibold truncate">
                          {normalizeAllCaps(a.title || "Assessment")}
                        </span>
                        <span className={`shrink-0 font-extrabold ${
                          !scored ? "text-slate-400" : passed ? "text-green-600" : "text-red-500"
                        }`}>
                          {!scored ? "—" : `${a.lastAttempt.score}%`}
                        </span>
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
