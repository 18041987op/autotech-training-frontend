import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

const CATEGORIES = [
  { value: "universal", labelKey: "modules.categories.universal" },
  { value: "technician", labelKey: "modules.categories.technician" },
  { value: "service_advisor", labelKey: "modules.categories.serviceAdvisor" },
  { value: "administrative", labelKey: "modules.categories.administrative" }
];

// Drive domains (anchors) — used only when CREATING a module
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

  const [editing, setEditing] = useState(null); // module object or null
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "universal",
    required: true,
    icon: "Shield",
    color: "#1E6FAE", // ✅ AutoRx default
    drive_folder: null,

    // NEW: only used when creating a module
    drive_anchor: "02_TRAINING",
    drive_subfolder: ""
  });

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

      // defaults for new module creation
      drive_anchor: "02_TRAINING",
      drive_subfolder: ""
    });
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      title: m.title || "",
      description: m.description || "",
      category: m.category || "universal",
      required: !!m.required,
      icon: m.icon || "Shield",
      color: m.color || "#1E6FAE",
      drive_folder: m.drive_folder ?? null,

      // keep values but they won't be used on PATCH
      drive_anchor: "02_TRAINING",
      drive_subfolder: ""
    });
  };

  const close = () => setEditing(null);

  const save = async () => {
    try {
      if (!form.title.trim()) {
        alert("Title is required");
        return;
      }

      // normalize optional subfolder
      const subfolder = (form.drive_subfolder || "").trim();

      if (!editing?.id) {
        // CREATE
        await apiFetch("/api/admin/modules", {
          method: "POST",
          body: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            category: form.category,
            required: form.required,

            // NEW fields (backend should ignore if not supported)
            drive_anchor: form.drive_anchor || "02_TRAINING",
            drive_subfolder: subfolder || null
          }
        });
      } else {
        // UPDATE (keep existing behavior)
        await apiFetch(`/api/admin/modules/${editing.id}`, {
          method: "PATCH",
          body: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            category: form.category,
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

  const isCreating = !!editing && !editing.id;

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

          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-white p-6 shadow-xl">
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

              {/* NEW: Domain + subfolder only when CREATING */}
              {isCreating ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Drive Domain (Anchor)
                    </label>
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

                  <div className="md:col-span-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Drive Subfolder (optional)
                    </label>
                    <input
                      className="mt-1 input"
                      value={form.drive_subfolder}
                      onChange={(e) => setForm((p) => ({ ...p, drive_subfolder: e.target.value }))}
                      placeholder='e.g., "Universal" or "Universal/Brakes"'
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      Folder will be created if it doesn&apos;t exist.
                    </div>
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
    </div>
  );
}
