import React, { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

export function ModuleDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  // ✅ Hook always called (no condition)
  const { user } = useOutletContext();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);

  // NEW: assessments list (A4-1)
  const [assessments, setAssessments] = useState([]);
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessErr, setAssessErr] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  const headerSubtitle = useMemo(() => {
    return t("moduleDetail.resourcesSubtitle");
  }, [t]);

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

  // NEW: load assessments list
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
      setSyncMsg(`Sync complete: ${out.totalFiles} files • extracted text from ${out.extractedWithText}`);
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

      // refresh list right after generating
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
            <h1 className="text-2xl font-extrabold">{module?.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{module?.description || "—"}</p>
          </div>

          {isAdmin ? (
            <div className="text-right space-y-2">
              <button
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                onClick={runSync}
                disabled={syncing}
                type="button"
              >
                {syncing ? t("actions.syncing") : t("actions.sync")}
              </button>

              <button
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold hover:bg-slate-50 disabled:opacity-60"
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

      {/* =========================
          A4-1: Assessments list
         ========================= */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">{t("moduleDetail.assessmentsTitle")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t("moduleDetail.assessmentsSubtitle")}</p>
          </div>

          <button
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
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
            {assessments.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-extrabold truncate">{a.title || "Assessment"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {typeof a.passingScore === "number" ? (
                        <span>
                          {t("moduleDetail.passingScore")}: {a.passingScore}%
                        </span>
                      ) : (
                        <span>{t("moduleDetail.passingScore")}: —</span>
                      )}
                      {a.createdAt ? <span className="ml-2">• {new Date(a.createdAt).toLocaleString()}</span> : null}
                    </div>
                  </div>

                  {/* A4-1: no "Start" yet. We’ll add it in A4-2 */}
                  <button
                    className="rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-not-allowed"
                    type="button"
                    disabled
                    title="A4-2 will add the assessment runner UI."
                  >
                    {t("moduleDetail.startAssessment")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
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
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                        href={r.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("actions.openInDrive")}
                      </a>
                    ) : null}

                    <button
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
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
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold">{active.name}</h3>
              <p className="text-xs text-slate-500">{active.mimeType}</p>
            </div>

            <button
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              onClick={() => setActive(null)}
              type="button"
            >
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
