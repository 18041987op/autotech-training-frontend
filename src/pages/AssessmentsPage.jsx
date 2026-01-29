import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

export function AssessmentsPage() {
  const { t } = useTranslation();
  const nav = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

  // Only show modules that have at least 1 assessment (active or not)
  const modulesWithAssessments = (modules || []).filter(
    (m) => (m.assessments || []).length > 0
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{t("modules.assessments.title")}</h1>
            <p className="mt-2 text-sm text-slate-600">{t("modules.assessments.subtitle")}</p>
          </div>

          <button className="btn-outline-sm" onClick={load} type="button">
            {t("actions.refresh")}
          </button>
        </div>
      </div>

      {modulesWithAssessments.length === 0 ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
          <div className="font-extrabold">{t("assessmentRunner.historyNone")}</div>
          <div className="mt-2 text-xs text-slate-500">
            {t("modules.empty.hint")}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {modulesWithAssessments.map((m) => (
            <div key={m.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold truncate">{m.title}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {m.description || "—"}
                  </div>
                </div>

                <button
                  className="btn-outline-sm"
                  type="button"
                  onClick={() => nav(`/modules/${m.id}`)}
                >
                  {t("actions.open")}
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {(m.assessments || []).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{a.title || "Assessment"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {t("moduleDetail.passingScore")}: {a.passingScore ?? 70}%
                        {a.lastAttempt ? (
                          <>
                            <span className="mx-2">•</span>
                            {t("assessmentRunner.score")}:{" "}
                            <span className="font-semibold">{a.lastAttempt.score ?? "—"}%</span>
                            <span className="mx-2">•</span>
                            {a.lastAttempt.createdAt
                              ? new Date(a.lastAttempt.createdAt).toLocaleString()
                              : "—"}
                          </>
                        ) : null}
                      </div>
                    </div>

                    <button
                      className="btn-accent btn-sm px-4"
                      type="button"
                      onClick={() => nav(`/modules/${m.id}/assessments/${a.id}`)}
                    >
                      {t("moduleDetail.startAssessment")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
