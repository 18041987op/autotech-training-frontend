import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
      {/* Page hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(135deg, #0f3460 0%, #1E6FAE 55%, #2a9fd6 100%)" }}
      >
        {/* Dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Content */}
        <div className="relative z-10 px-6 pt-7 pb-14 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Brand pill */}
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 mb-3 backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Knowledge Checks</span>
              </div>
              {/* Title */}
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{t("modules.assessments.title")}</h1>
              {/* Subtitle */}
              <p className="mt-1 text-sm text-white/70">{t("modules.assessments.subtitle")}</p>
              {/* Stat + admin toggle row */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!loading && (
                  <div className="inline-flex items-center rounded-xl bg-white/15 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-white">
                    📋 {modulesWithAssessments.length} {modulesWithAssessments.length === 1 ? "module" : "modules"}
                  </div>
                )}
                {isAdmin && totalInactive > 0 && (
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="rounded"
                    />
                    Show inactive ({totalInactive})
                  </label>
                )}
              </div>
            </div>
            {/* Right: emoji bubble + refresh */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="h-14 w-14 rounded-2xl grid place-items-center text-2xl shadow-lg select-none"
                style={{ background: "rgba(247,148,29,0.85)" }}>
                📋
              </div>
              <button
                onClick={load}
                type="button"
                className="rounded-xl bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white hover:bg-white/25 transition-colors"
              >
                {t("actions.refresh")}
              </button>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1200 48" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true">
            <path d="M0,24 C150,48 350,0 600,24 C850,48 1050,0 1200,24 L1200,48 L0,48 Z"
              style={{ fill: "var(--surface, #ffffff)" }} />
          </svg>
        </div>
      </motion.div>

      {modulesWithAssessments.length === 0 ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
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
                    {m.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {m.description || "—"}
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
                        <span className="font-semibold truncate">{a.title || "Assessment"}</span>
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
