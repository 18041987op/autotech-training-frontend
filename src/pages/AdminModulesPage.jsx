import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

const CATEGORIES = [
  { value: "universal", labelKey: "modules.categories.universal" },
  { value: "technician", labelKey: "modules.categories.technician" },
  { value: "service_advisor", labelKey: "modules.categories.serviceAdvisor" },
  { value: "administrative", labelKey: "modules.categories.administrative" }
];

const ALL_SUBCATEGORIES = [
  "Fluids & Maintenance",
  "Brakes & Chassis",
  "Tires & Wheels",
  "Engine & Cooling",
  "HVAC & Climate",
  "Electrical & Diagnostics",
  "Transmission & Drivetrain",
  "Suspension & Steering",
  "Safety & Compliance",
  "State Inspection",
  "Customer Communication",
  "Shop Operations",
  "Vehicle Delivery",
  "Onboarding & Orientation",
  "HR & Policies",
  "Operations & Inventory",
  "General"
];

const DRIVE_ANCHORS = [
  { value: "00_GLOBAL", label: "00_GLOBAL" },
  { value: "01_ONBOARDING", label: "01_ONBOARDING" },
  { value: "02_TRAINING", label: "02_TRAINING" },
  { value: "03_CULTURE", label: "03_CULTURE" },
  { value: "04_EVALUATIONS", label: "04_EVALUATIONS" },
  { value: "99_ARCHIVE", label: "99_ARCHIVE" }
];

export function AdminModulesPage() {
  const { t } = useTranslation();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ── Translation migration state ──────────────────────────────────────────
  const [migrating, setMigrating]     = useState(false);
  const [migDone, setMigDone]         = useState(null); // { total, translated, failed }
  const [migProgress, setMigProgress] = useState(null); // { done, total, translated, failed }

  const runMigration = async () => {
    setMigrating(true);
    setMigDone(null);
    setMigProgress(null);
    try {
      const resp = await fetch("/api/admin/migrate-translate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop(); // keep incomplete line
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.status === "done") { setMigDone(msg); setMigProgress(null); }
            else if (msg.status === "progress") setMigProgress(msg);
            else if (msg.status === "start") setMigProgress({ done: 0, total: msg.total, translated: 0, failed: 0 });
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e) {
      setMigDone({ error: e.message });
    } finally {
      setMigrating(false);
    }
  };

  const [editing, setEditing] = useState(null); // module object or {id:null} for create
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "universal",
    subcategory: "",
    required: true,
    icon: "Shield",
    color: "#1E6FAE",
    drive_folder: null,

    // create-only
    drive_anchor: "02_TRAINING",
    drive_subfolder: ""
  });

  // edit-only actions
  const [moveAnchor, setMoveAnchor] = useState("02_TRAINING");
  const [moveSubfolder, setMoveSubfolder] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const out = await apiFetch("/api/admin/modules");
      setModules(out.modules || []);
    } catch (e) {
      setErr(e.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing({ id: null });
    setForm({
      title: "",
      description: "",
      category: "universal",
      required: true,
      icon: "Shield",
      color: "#1E6FAE",
      drive_folder: null,
      drive_anchor: "02_TRAINING",
      drive_subfolder: ""
    });
    setMoveAnchor("02_TRAINING");
    setMoveSubfolder("");
    setDeleteConfirm("");
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      title: m.title || "",
      description: m.description || "",
      category: m.category || "universal",
      subcategory: m.subcategory || "",
      required: !!m.required,
      icon: m.icon || "Shield",
      color: m.color || "#1E6FAE",
      drive_folder: m.drive_folder ?? null,
      drive_anchor: "02_TRAINING",
      drive_subfolder: ""
    });
    setMoveAnchor("02_TRAINING");
    setMoveSubfolder("");
    setDeleteConfirm("");
  };

  const close = () => setEditing(null);
  const isCreating = !!editing && !editing.id;

  const save = async () => {
    try {
      if (!form.title.trim()) {
        alert("Title is required");
        return;
      }

      const subfolder = (form.drive_subfolder || "").trim();

      if (isCreating) {
        await apiFetch("/api/admin/modules", {
          method: "POST",
          body: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            category: form.category,
            subcategory: form.subcategory?.trim() || null,
            required: form.required,
            drive_anchor: form.drive_anchor || "02_TRAINING",
            drive_subfolder: subfolder || null
          }
        });
      } else {
        await apiFetch(`/api/admin/modules/${editing.id}`, {
          method: "PATCH",
          body: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            category: form.category,
            subcategory: form.subcategory?.trim() || null,
            required: form.required,
            icon: form.icon || null,
            color: form.color || null,
            drive_folder: form.drive_folder || null
          }
        });
      }

      close();
      await load();
    } catch (e) {
      alert(e.message || "Failed to save");
    }
  };

  const moveModule = async () => {
    try {
      if (!editing?.id) return;

      await apiFetch(`/api/admin/modules/${editing.id}/move`, {
        method: "POST",
        body: {
          drive_anchor: moveAnchor,
          drive_subfolder: (moveSubfolder || "").trim() || null
        }
      });

      alert("Moved. Check Drive and re-sync if needed.");
    } catch (e) {
      alert(e.message || "Failed to move module");
    }
  };

  const deleteModule = async () => {
    try {
      if (!editing?.id) return;

      if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
        window.alert('Type "DELETE" to confirm.');
        return;
      }

      const ok = window.confirm(
        "This will delete the module from the app (DB) and move its Drive folder to 99_ARCHIVE/DELETED_MODULES.\n\nContinue?"
      );
      if (!ok) return;

      await apiFetch(`/api/admin/modules/${editing.id}`, { method: "DELETE" });

      close();
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete module");
    }
  };

  const stats = useMemo(() => {
    const total = modules.length;
    const byCat = modules.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    return { total, byCat };
  }, [modules]);

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
            <h1 className="text-2xl font-extrabold">{t("adminModules.title")}</h1>
            <p className="mt-2 text-sm text-slate-600">{t("adminModules.subtitle")}</p>
          </div>

          <div className="flex gap-2">
            <button className="btn-outline-sm" onClick={load} type="button">
              {t("actions.refresh")}
            </button>
            <button className="btn-primary btn-sm" onClick={openCreate} type="button">
              {t("adminModules.create")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase text-slate-500">
              {t("adminModules.total")}
            </div>
            <div className="mt-2 text-2xl font-extrabold">{stats.total}</div>
          </div>

          {CATEGORIES.map((c) => (
            <div key={c.value} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-semibold uppercase text-slate-500">
                {t(c.labelKey)}
              </div>
              <div className="mt-2 text-2xl font-extrabold">{stats.byCat[c.value] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div
            key={m.id}
            className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold truncate">{m.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {t(
                    CATEGORIES.find((c) => c.value === m.category)?.labelKey ||
                      "modules.categories.universal"
                  )}
                  {m.required ? ` • ${t("status.required")}` : ""}
                </div>
              </div>

              <button className="btn-outline-sm" onClick={() => openEdit(m)} type="button">
                {t("actions.edit")}
              </button>
            </div>

            <div className="mt-2 text-sm text-slate-600">{m.description || "—"}</div>

            <div className="mt-3 text-xs text-slate-500">
              Drive folder: {m.drive_folder || "—"} • Drive id: {m.drive_folder_id || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editing ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">
                  {editing.id ? t("adminModules.editing") : t("adminModules.creating")}
                </div>
                <div className="text-xl font-extrabold">
                  {editing.id ? t("adminModules.edit") : t("adminModules.create")}
                </div>
              </div>

              <button className="btn-outline-sm" onClick={close} type="button">
                {t("actions.close")}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.title")}
                </label>
                <input
                  className="mt-1 input"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.description")}
                </label>
                <textarea
                  className="mt-1 input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              {isCreating ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Drive Domain (Anchor)</label>
                    <select
                      className="mt-1 input bg-white"
                      value={form.drive_anchor}
                      onChange={(e) => setForm((p) => ({ ...p, drive_anchor: e.target.value }))}
                    >
                      {DRIVE_ANCHORS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Drive Subfolder (optional)</label>
                    <input
                      className="mt-1 input"
                      value={form.drive_subfolder}
                      onChange={(e) => setForm((p) => ({ ...p, drive_subfolder: e.target.value }))}
                      placeholder='e.g., "Universal" or "Universal/Brakes"'
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.category")}
                </label>
                <select
                  className="mt-1 input bg-white"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {t(c.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.subcategory")}
                </label>
                <select
                  className="mt-1 input bg-white"
                  value={form.subcategory || ""}
                  onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
                >
                  <option value="">— {t("adminModules.fields.subcategoryNone")} —</option>
                  {ALL_SUBCATEGORIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))}
                  />
                  {t("adminModules.fields.required")}
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.icon")}
                </label>
                <input
                  className="mt-1 input"
                  value={form.icon}
                  onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.color")}
                </label>
                <input
                  className="mt-1 input"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  placeholder="#1E6FAE"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">
                  {t("adminModules.fields.driveFolder")}
                </label>
                <input
                  className="mt-1 input"
                  value={form.drive_folder || ""}
                  onChange={(e) => setForm((p) => ({ ...p, drive_folder: e.target.value }))}
                  placeholder="Optional (e.g., Warranty-Procedures)"
                />
              </div>
            </div>

            {/* Edit-only actions */}
            {!isCreating ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-extrabold text-slate-800">Drive Maintenance</div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Move to Domain (Anchor)</label>
                    <select
                      className="mt-1 input bg-white"
                      value={moveAnchor}
                      onChange={(e) => setMoveAnchor(e.target.value)}
                    >
                      {DRIVE_ANCHORS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Subfolder (optional)</label>
                    <input
                      className="mt-1 input"
                      value={moveSubfolder}
                      onChange={(e) => setMoveSubfolder(e.target.value)}
                      placeholder='e.g., "Universal" or "Onboarding: Shop Tour & Expectations"'
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      This moves the module folder in Drive (does not change module ID).
                    </div>
                    <button className="btn-outline-sm" onClick={moveModule} type="button">
                      Move Module Folder
                    </button>
                  </div>
                </div>

                <div className="mt-5 border-t pt-4">
                  <div className="text-sm font-extrabold text-red-700">Delete Module</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Deletes the module from the app (DB) and moves its Drive folder to{" "}
                    <b>99_ARCHIVE/DELETED_MODULES</b>.
                  </div>

                  <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div className="w-full md:max-w-[320px]">
                      <label className="text-xs font-semibold text-slate-600">Type DELETE to confirm</label>
                      <input
                        className="mt-1 input"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>

                    <button
                      className="btn-sm rounded-2xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-700"
                      onClick={deleteModule}
                      type="button"
                    >
                      Delete Module
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-outline-sm" onClick={close} type="button">
                {t("actions.cancel")}
              </button>
              <button className="btn-primary btn-sm px-4" onClick={save} type="button">
                {t("actions.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Database Tools: Translate existing questions ─────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">🌐 Bilingual Migration</h2>
            <p className="mt-1 text-xs text-slate-500">
              Translate existing assessment questions to Spanish using AI.
              Safe to run multiple times — skips already-translated questions.
            </p>
          </div>
          <button
            type="button"
            onClick={runMigration}
            disabled={migrating}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-sm disabled:opacity-50 transition-all"
            style={{ background: "#1E6FAE" }}
          >
            {migrating ? "🔄 Translating…" : "▶ Run Migration"}
          </button>
        </div>

        {/* Progress bar */}
        {migrating && migProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Translating questions…</span>
              <span>{migProgress.done}/{migProgress.total}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  background: "#1E6FAE",
                  width: migProgress.total > 0
                    ? `${Math.round((migProgress.done / migProgress.total) * 100)}%`
                    : "0%",
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              ✅ {migProgress.translated} translated
              {migProgress.failed > 0 && <span className="text-red-400"> · ❌ {migProgress.failed} failed</span>}
            </div>
          </div>
        )}

        {/* Done result */}
        {migDone && !migrating && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            migDone.error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}>
            {migDone.error ? (
              <span>❌ {migDone.error}</span>
            ) : (
              <span>
                ✅ Done — <strong>{migDone.translated}</strong> questions translated
                {migDone.failed > 0 && <span className="text-red-600"> · {migDone.failed} failed</span>}
                {" "}out of <strong>{migDone.total}</strong> total missing translations.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
