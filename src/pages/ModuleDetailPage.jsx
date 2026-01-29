import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

export function ModuleDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();

  // ✅ Hook always called (no condition)
  const { user } = useOutletContext();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);

  // Assessments list
  const [assessments, setAssessments] = useState([]);
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessErr, setAssessErr] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState("");

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

  // ✅ Admin: deactivate / activate assessment (soft delete)
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{module?.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{module?.description || "—"}</p>
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">{t("moduleDetail.assessmentsTitle")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t("moduleDetail.assessmentsSubtitle")}</p>
            {isAdmin ? (
              <p className="mt-2 text-xs text-slate-500">
                Admin view: you can see active + inactive assessments. Users only see active ones.
              </p>
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
        ) : assessments.length === 0 ? (
          <div className="mt-4 text-sm text-slate-600">{t("moduleDetail.noAssessments")}</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {assessments.map((a) => {
              const isActive = a.isActive !== false; // treat null as active
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-extrabold truncate">{a.title || "Assessment"}</div>

                        {!isActive ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold">
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

                    <div className="flex flex-wrap gap-2 justify-end">
                      {/* Start: allow admin to start even if inactive (optional).
                          Users won't see inactive anyway due to A2 filter server-side. */}
                      <button
                        className="btn-accent btn-sm px-3 py-1.5 text-xs font-semibold"
                        type="button"
                        onClick={() => nav(`/modules/${id}/assessments/${a.id}`)}
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.mimeType}</div>
                  </div>

                  <div className="flex gap-2">
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

      {/* Full resource */}
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
    </div>
  );
}
