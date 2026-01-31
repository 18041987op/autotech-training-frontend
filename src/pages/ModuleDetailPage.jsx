import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { AICoachWidget } from "../components/AICoachWidget";

export function ModuleDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();

  const { user } = useOutletContext();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);

  const [assessments, setAssessments] = useState([]);
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessErr, setAssessErr] = useState("");

  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  // ✅ Modal state for AI Coach (keeps user on this page)
  const [aiOpen, setAiOpen] = useState(false);

  const headerSubtitle = useMemo(() => t("moduleDetail.resourcesSubtitle"), [t]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const mod = await apiFetch(`/api/modules/${id}`);
      setModule(mod.module);

      const r = await apiFetch(`/api/modules/${id}/resources-cache`);
      setResources(r.resources || []);
    } catch (e) {
      setErr(e.message || "Failed to load module");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessments() {
    setAssessErr("");
    setAssessLoading(true);
    try {
      const out = await apiFetch(`/api/modules/${id}/assessments`);
      setAssessments(out.assessments || []);
    } catch (e) {
      setAssessErr(e.message || "Failed to load assessments");
      setAssessments([]);
    } finally {
      setAssessLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadAssessments();
    // eslint-disable-next-line
  }, [id]);

  const inactiveCount = useMemo(() => {
    return (assessments || []).filter((a) => a.isActive === false).length;
  }, [assessments]);

  const visibleAssessments = useMemo(() => {
    const activeOnes = (assessments || []).filter((a) => a.isActive !== false);
    const inactiveOnes = (assessments || []).filter((a) => a.isActive === false);

    if (!isAdmin) return activeOnes;
    return showInactive ? [...activeOnes, ...inactiveOnes] : activeOnes;
  }, [assessments, isAdmin, showInactive]);

  const runSync = async () => {
    setSyncMsg("");
    setSyncing(true);
    try {
      const out = await apiFetch(`/api/admin/modules/${id}/sync`, { method: "POST" });
      setSyncMsg(
        `Sync complete: ${out.totalFiles} files • extracted text from ${out.extractedWithText}`
      );
      await load();
    } catch (e) {
      setSyncMsg(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const generateAssessment = async () => {
    setGenMsg("");
    setGenLoading(true);
    try {
      const out = await apiFetch(`/api/admin/modules/${id}/generate-assessment`, { method: "POST" });
      setGenMsg(`${t("assessmentsUi.created")}: ${out.title}`);
      await loadAssessments();
    } catch (e) {
      setGenMsg(e.message || "Failed");
    } finally {
      setGenLoading(false);
    }
  };

  const openFull = async (rid) => {
    try {
      const d = await apiFetch(`/api/modules/${id}/resources/${rid}`);
      setActive(d.resource);
    } catch (e) {
      alert(e.message || "Failed to open resource");
    }
  };

  const deactivateAssessment = async (assessmentId) => {
    try {
      await apiFetch(`/api/admin/assessments/${assessmentId}/deactivate`, { method: "PATCH" });
      await loadAssessments();
    } catch (e) {
      alert(e.message || "Failed to deactivate");
    }
  };

  const activateAssessment = async (assessmentId) => {
    try {
      await apiFetch(`/api/admin/assessments/${assessmentId}/activate`, { method: "PATCH" });
      await loadAssessments();
    } catch (e) {
      alert(e.message || "Failed to activate");
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
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{module?.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{module?.description || "—"}</p>

            {/* ✅ Open AI Coach modal (stay on module page) */}
            <div className="mt-4">
              <button
                className="btn-outline-sm"
                type="button"
                onClick={() => setAiOpen(true)}
                title="Ask AI Coach about this module"
              >
                Ask AI Coach
              </button>
            </div>
          </div>

          {isAdmin ? (
            <div className="text-right space-y-2">
              <button
                className="btn-primary rounded-2xl px-4 py-2 text-sm font-extrabold disabled:opacity-60"
                onClick={runSync}
                disabled={syncing}
                type="button"
              >
                {syncing ? t("actions.syncing") : t("actions.sync")}
              </button>

              <button
                className="w-full btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold disabled:opacity-60"
                onClick={generateAssessment}
                disabled={genLoading}
                type="button"
              >
                {genLoading ? t("assessmentsUi.generating") : t("assessmentsUi.generate")}
              </button>

              {syncMsg ? <div className="text-xs text-slate-600">{syncMsg}</div> : null}
              {genMsg ? <div className="text-xs text-slate-600">{genMsg}</div> : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Assessments list */}
      <div className="card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-extrabold">{t("moduleDetail.assessmentsTitle")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t("moduleDetail.assessmentsSubtitle")}</p>

            {isAdmin && inactiveCount > 0 ? (
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  Show inactive ({inactiveCount})
                </label>
              </div>
            ) : null}
          </div>

          <button
            className="btn-outline-sm disabled:opacity-60"
            onClick={loadAssessments}
            disabled={assessLoading}
            type="button"
          >
            {assessLoading ? t("status.loading") : t("moduleDetail.refreshAssessments")}
          </button>
        </div>

        {assessErr ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {assessErr}
          </div>
        ) : null}

        {assessLoading ? (
          <div className="mt-4 text-sm text-slate-600">{t("status.loading")}</div>
        ) : visibleAssessments.length === 0 ? (
          <div className="mt-4 text-sm text-slate-600">{t("moduleDetail.noAssessments")}</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {visibleAssessments.map((a) => {
              const isActive = a.isActive !== false;
              return (
                <div
                  key={a.id}
                  className={
                    isActive
                      ? "rounded-2xl border border-slate-200 bg-white p-4"
                      : "rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-70"
                  }
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-extrabold truncate">{a.title || "Assessment"}</div>
                        {!isActive ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold">
                            Inactive
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {typeof a.passingScore === "number" ? (
                          <span>
                            {t("moduleDetail.passingScore")}: {a.passingScore}%
                          </span>
                        ) : (
                          <span>{t("moduleDetail.passingScore")}: —</span>
                        )}
                        {a.createdAt ? (
                          <span className="ml-2">• {new Date(a.createdAt).toLocaleString()}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        className="btn-accent btn-sm px-3 py-1.5 text-xs font-semibold"
                        type="button"
                        onClick={() => nav(`/modules/${id}/assessments/${a.id}`)}
                        disabled={!isActive && !isAdmin}
                        title={!isActive && !isAdmin ? "Inactive assessment" : ""}
                      >
                        {t("moduleDetail.startAssessment")}
                      </button>

                      {isAdmin ? (
                        isActive ? (
                          <button
                            className="btn-outline-sm"
                            type="button"
                            onClick={() => deactivateAssessment(a.id)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn-outline-sm"
                            type="button"
                            onClick={() => activateAssessment(a.id)}
                          >
                            Activate
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="card p-6">
        <h2 className="text-lg font-extrabold">{t("moduleDetail.resourcesTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{headerSubtitle}</p>

        {resources.length === 0 ? (
          <div className="mt-4 text-sm text-slate-600">{t("moduleDetail.noResources")}</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {resources.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="font-extrabold truncate">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.mimeType}</div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {r.webViewLink ? (
                      <a
                        className="btn-outline-sm px-3 py-1.5"
                        href={r.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("actions.openInDrive")}
                      </a>
                    ) : null}

                    <button
                      className="btn-primary btn-sm px-3 py-1.5 disabled:opacity-60"
                      onClick={() => openFull(r.id)}
                      disabled={!r.hasText}
                      title={!r.hasText ? t("moduleDetail.noExtractedText") : ""}
                      type="button"
                    >
                      {t("moduleDetail.fullText")}
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  {r.hasText ? (
                    r.previewText
                  ) : (
                    <span className="text-slate-500">{t("moduleDetail.noExtractedText")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {active ? (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold">{active.name}</h3>
              <p className="text-xs text-slate-500">{active.mimeType}</p>
            </div>

            <button className="btn-outline-sm" onClick={() => setActive(null)} type="button">
              {t("actions.close")}
            </button>
          </div>

          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-800">
            {active.text || "—"}
          </pre>
        </div>
      ) : null}

      {/* ✅ AI Coach Modal */}
      {aiOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close AI Coach"
            className="absolute inset-0 bg-black/40"
            onClick={() => setAiOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-[94%] max-w-3xl max-h-[86vh] overflow-auto rounded-3xl bg-white shadow-xl border border-slate-200 p-4 md:p-6">
            <AICoachWidget
              initialModuleId={id}
              showHeader={false}
              onClose={() => setAiOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
