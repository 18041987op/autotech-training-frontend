import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

export function ModuleDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  // Admin check (temporary global injected by App after verify)
  const isAdmin = (window.__APP_USER__?.role || "").toLowerCase() === "admin";

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const mod = await apiFetch(`/api/modules/${id}`);
      setModule(mod.module);

      // IMPORTANT: use cache endpoint (Drive -> Extract -> DB)
      const r = await apiFetch(`/api/modules/${id}/resources-cache`);
      setResources(r.resources || []);
    } catch (e) {
      setErr(e.message || "Failed to load module");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const runSync = async () => {
    setSyncMsg("");
    setSyncing(true);
    try {
      const out = await apiFetch(`/api/admin/modules/${id}/sync`, { method: "POST" });
      setSyncMsg(
        `${t("actions.sync")}: ${out.totalFiles} • ${out.extractedWithText}`
      );
      await load();
    } catch (e) {
      setSyncMsg(e.message || "Sync failed");
    } finally {
      setSyncing(false);
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

          {/* Admin-only sync */}
          {isAdmin ? (
            <div className="text-right">
              <button
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                onClick={runSync}
                disabled={syncing}
                type="button"
              >
                {syncing ? t("actions.syncing") : t("actions.sync")}
              </button>
              {syncMsg ? <div className="mt-2 text-xs text-slate-600">{syncMsg}</div> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">{t("moduleDetail.resourcesTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("moduleDetail.resourcesSubtitle")}</p>

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
