import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

export function ModuleDetailPage() {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const mod = await apiFetch(`/api/modules/${id}`);
        setModule(mod.module);

        const res = await apiFetch(`/api/modules/${id}/resources`);
        setFiles(res.files || []);
      } catch (e) {
        setErr(e.message || "Failed to load module");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">Loading…</div>;
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
        <h1 className="text-2xl font-extrabold">{module?.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{module?.description || "—"}</p>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">Resources (Google Drive)</h2>

        {files.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No files found in the module folder yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {files.map((f) => (
              <a
                key={f.id}
                href={f.webViewLink || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="font-semibold">{f.name}</span>
                <span className="text-xs text-slate-500">{f.mimeType}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
