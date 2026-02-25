import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { Pencil } from "lucide-react";
import { apiFetch } from "../lib/api";
import { translateModuleList } from "../hooks/useModuleTranslation";

// ─── helpers ──────────────────────────────────────────────────────────────────

function inferTypeFromTitle(title = "") {
  const tl = title.toLowerCase();
  if (tl.startsWith("onboarding:")) return "onboarding";
  if (tl.startsWith("assessment:") || tl.startsWith("knowledge check:") || tl.startsWith("skills check:"))
    return "assessments";
  if (tl.startsWith("culture:")) return "culture";
  return "training";
}

function inferTypeFromModule(m) {
  const d = (m?.domain || "").toLowerCase().trim();
  if (d === "onboarding") return "onboarding";
  if (d === "training") return "training";
  if (d === "culture") return "culture";
  if (d === "evaluations") return "assessments";
  if (d === "global") return "training";
  if (d === "archive") return "training";
  return inferTypeFromTitle(m?.title || "");
}

// Role tabs config
const ROLE_TABS = [
  { key: "all",             labelKey: "modules.tabs.all" },
  { key: "technician",      labelKey: "modules.tabs.technician" },
  { key: "service_advisor", labelKey: "modules.tabs.serviceAdvisor" },
  { key: "administrative",  labelKey: "modules.tabs.administrative" },
];

// Defines display order for subcategories
const SUBCATEGORY_ORDER = [
  // Technician
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
  // Service Advisor
  "Customer Communication",
  "Shop Operations",
  "Vehicle Delivery",
  // Administrative
  "Onboarding & Orientation",
  "HR & Policies",
  "Operations & Inventory",
  // Fallback
  "General",
];

const SUBCATEGORY_META = {
  "Fluids & Maintenance":      { icon: "🛢️",  color: "text-amber-700   bg-amber-50   border-amber-200"   },
  "Brakes & Chassis":          { icon: "🔴",  color: "text-red-700     bg-red-50     border-red-200"     },
  "Tires & Wheels":            { icon: "⚫",  color: "text-slate-700   bg-slate-50   border-slate-200"   },
  "Engine & Cooling":          { icon: "🌡️",  color: "text-orange-700  bg-orange-50  border-orange-200"  },
  "HVAC & Climate":            { icon: "❄️",  color: "text-sky-700     bg-sky-50     border-sky-200"     },
  "Electrical & Diagnostics":  { icon: "⚡",  color: "text-yellow-700  bg-yellow-50  border-yellow-200"  },
  "Transmission & Drivetrain": { icon: "⚙️",  color: "text-indigo-700  bg-indigo-50  border-indigo-200"  },
  "Suspension & Steering":     { icon: "🔧",  color: "text-violet-700  bg-violet-50  border-violet-200"  },
  "Safety & Compliance":       { icon: "🦺",  color: "text-green-700   bg-green-50   border-green-200"   },
  "State Inspection":          { icon: "📋",  color: "text-teal-700    bg-teal-50    border-teal-200"    },
  "Customer Communication":    { icon: "💬",  color: "text-blue-700    bg-blue-50    border-blue-200"    },
  "Shop Operations":           { icon: "📝",  color: "text-cyan-700    bg-cyan-50    border-cyan-200"    },
  "Vehicle Delivery":          { icon: "🚗",  color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Onboarding & Orientation":  { icon: "👋",  color: "text-pink-700    bg-pink-50    border-pink-200"    },
  "HR & Policies":             { icon: "📖",  color: "text-purple-700  bg-purple-50  border-purple-200"  },
  "Operations & Inventory":    { icon: "📦",  color: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200" },
  "General":                   { icon: "📚",  color: "text-slate-600   bg-slate-50   border-slate-200"   },
};

function groupBySubcategory(modules) {
  const groups = {};
  for (const m of modules) {
    const sub = m.subcategory?.trim() || "General";
    if (!groups[sub]) groups[sub] = [];
    groups[sub].push(m);
  }
  return groups;
}

function sortedSubcategoryKeys(groups) {
  return Object.keys(groups).sort((a, b) => {
    const ai = SUBCATEGORY_ORDER.indexOf(a);
    const bi = SUBCATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function SubcategoryHeader({ name }) {
  const { t, i18n } = useTranslation();
  const meta = SUBCATEGORY_META[name] || SUBCATEGORY_META["General"];
  const i18nKey = `modules.subcategoryLabels.${name}`;
  const label = i18n.exists(i18nKey) ? t(i18nKey) : name;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold w-fit ${meta.color}`}>
      <span>{meta.icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Edit Modal (inline, admin-only) ──────────────────────────────────────────

const CATEGORIES = [
  { value: "universal",       label: "Universal" },
  { value: "technician",      label: "Technician" },
  { value: "service_advisor", label: "Service Advisor" },
  { value: "administrative",  label: "Administrative" },
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
  "General",
];

function EditModuleModal({ module: m, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title:       m.title       || "",
    description: m.description || "",
    category:    m.category    || "universal",
    subcategory: m.subcategory || "",
    required:    !!m.required,
    icon:        m.icon        || "Shield",
    color:       m.color       || "#1E6FAE",
    drive_folder: m.drive_folder ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const save = async () => {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    setSaving(true);
    setErr("");
    try {
      await apiFetch(`/api/admin/modules/${m.id}`, {
        method: "PATCH",
        body: {
          title:        form.title.trim(),
          description:  form.description.trim() || null,
          category:     form.category,
          subcategory:  form.subcategory?.trim() || null,
          required:     form.required,
          icon:         form.icon  || null,
          color:        form.color || null,
          drive_folder: form.drive_folder || null,
        },
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-[94%] max-w-[720px] max-h-[90vh] overflow-y-auto rounded-3xl border bg-white shadow-xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {t("adminModules.editing", "Editing")}
            </p>
            <h2 className="text-xl font-extrabold leading-snug">{m.title}</h2>
          </div>
          <button className="btn-outline-sm" onClick={onClose} type="button">
            {t("actions.close", "Close")}
          </button>
        </div>

        {err ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.title", "Title")}
            </label>
            <input
              className="mt-1 input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.description", "Description")}
            </label>
            <textarea
              className="mt-1 input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.category", "Category")}
            </label>
            <select
              className="mt-1 input bg-white"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.subcategory", "Subcategory")}
            </label>
            <select
              className="mt-1 input bg-white"
              value={form.subcategory || ""}
              onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
            >
              <option value="">— {t("adminModules.fields.subcategoryNone", "No subcategory")} —</option>
              {ALL_SUBCATEGORIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Required */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))}
                className="rounded"
              />
              {t("adminModules.fields.required", "Required")}
            </label>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.icon", "Icon")}
            </label>
            <input
              className="mt-1 input"
              value={form.icon}
              onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.color", "Color")}
            </label>
            <input
              className="mt-1 input"
              value={form.color}
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              placeholder="#1E6FAE"
            />
          </div>

          {/* Drive folder */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.driveFolder", "Drive Folder")}
            </label>
            <input
              className="mt-1 input"
              value={form.drive_folder || ""}
              onChange={(e) => setForm((p) => ({ ...p, drive_folder: e.target.value }))}
              placeholder="e.g., Warranty-Procedures"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline-sm" onClick={onClose} type="button">
            {t("actions.cancel", "Cancel")}
          </button>
          <button
            className="btn-primary btn-sm px-5 disabled:opacity-60"
            onClick={save}
            disabled={saving}
            type="button"
          >
            {saving ? "Saving…" : t("actions.save", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function ModulesListPage({ pageType }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const ctx = useOutletContext() || {};
  const user = ctx.user;
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Admin: which module is being edited inline
  const [editingModule, setEditingModule] = useState(null);

  // ── which tabs are visible for this user ──
  const visibleTabs = useMemo(() => {
    if (!user || user.role === "admin") return ROLE_TABS;
    if (user.role === "technician")
      return ROLE_TABS.filter((tab) => tab.key === "all" || tab.key === "technician");
    if (user.role === "service_advisor")
      return ROLE_TABS.filter((tab) => tab.key === "all" || tab.key === "service_advisor");
    if (user.role === "administrative")
      return ROLE_TABS.filter((tab) => tab.key === "all" || tab.key === "administrative");
    return ROLE_TABS.filter((tab) => tab.key === "all");
  }, [user]);

  const defaultTab = useMemo(() => {
    if (!user || user.role === "admin") return "all";
    const match = visibleTabs.find((tab) => tab.key === user.role);
    return match ? match.key : "all";
  }, [user, visibleTabs]);

  const [activeTab, setActiveTab] = useState(defaultTab);
  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  const loadModules = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await apiFetch("/api/modules/user");
      setModules(data.modules || []);
    } catch (e) {
      setErr(e.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  // 1. Filter by domain/type (training vs onboarding etc.)
  const filteredByType = useMemo(() => {
    if (pageType?.startsWith("admin-")) return [];
    return (modules || []).filter((m) => inferTypeFromModule(m) === pageType);
  }, [modules, pageType]);

  // 2. Filter by active role tab
  const filteredByTab = useMemo(() => {
    if (activeTab === "all") return filteredByType;
    return filteredByType.filter(
      (m) => m.category === activeTab || m.category === "universal"
    );
  }, [filteredByType, activeTab]);

  // 3. Translate titles / descriptions
  const translated = useMemo(
    () => translateModuleList(filteredByTab, t, i18n),
    [filteredByTab, t, i18n]
  );

  // 4. Group by subcategory
  const groups = useMemo(() => groupBySubcategory(translated), [translated]);
  const orderedKeys = useMemo(() => sortedSubcategoryKeys(groups), [groups]);

  // ── i18n page header ──
  const titleKey =
    pageType === "onboarding"  ? "modules.onboarding.title"  :
    pageType === "training"    ? "modules.training.title"    :
    pageType === "culture"     ? "modules.culture.title"     :
    pageType === "assessments" ? "modules.assessments.title" :
                                 "modules.training.title";
  const subtitleKey =
    pageType === "onboarding"  ? "modules.onboarding.subtitle"  :
    pageType === "training"    ? "modules.training.subtitle"     :
    pageType === "culture"     ? "modules.culture.subtitle"      :
    pageType === "assessments" ? "modules.assessments.subtitle"  :
                                 "modules.training.subtitle";

  const safeT = (key, fallback = "") => {
    try { const v = t(key); return v !== key ? v : fallback; } catch { return fallback; }
  };

  // ── role label helper ──
  const roleLabel = (category) => {
    if (category === "service_advisor") return safeT("modules.tabs.serviceAdvisor", "SA");
    if (category === "technician")      return safeT("modules.tabs.technician", "Technician");
    if (category === "administrative")  return safeT("modules.tabs.administrative", "Admin");
    return category;
  };

  const showTabs = pageType === "training" && visibleTabs.length > 1;

  // ─── render ───────────────────────────────────────────────────────────────
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
      {/* Page header */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{safeT(titleKey, "Training")}</h1>
        <p className="mt-2 text-sm text-slate-600">{safeT(subtitleKey, "")}</p>
      </div>

      {/* Role filter tabs — Training page only */}
      {showTabs && (
        <div className="flex gap-2 flex-wrap">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              {safeT(tab.labelKey, tab.key)}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {translated.length === 0 ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
          <div className="font-extrabold">{t("modules.empty.title")}</div>
          <div className="mt-2 text-xs text-slate-500">{t("modules.empty.hint")}</div>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedKeys.map((subcat) => (
            <div key={subcat} className="space-y-3">
              {/* Subcategory section header */}
              {pageType === "training" && <SubcategoryHeader name={subcat} />}

              {/* Module cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups[subcat].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/modules/${m.id}`)}
                    className="group relative rounded-3xl border bg-white p-5 shadow-sm transition cursor-pointer hover:-translate-y-[2px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
                  >
                    {/* Admin Edit button — top-right, stops card click propagation */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingModule(m); }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm hover:border-brand-primary hover:text-brand-primary"
                        title="Edit module"
                        aria-label="Edit module"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Role badge — hide on "universal" since it appears everywhere */}
                    {m.category && m.category !== "universal" && (
                      <div className="mb-3">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {roleLabel(m.category)}
                        </span>
                      </div>
                    )}

                    <div className="font-extrabold leading-snug pr-7">{m.translatedTitle}</div>
                    <div
                      className="mt-2 text-sm text-slate-600 leading-relaxed"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={m.translatedDescription || ""}
                    >
                      {m.translatedDescription || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin inline edit modal */}
      {editingModule && (
        <EditModuleModal
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onSaved={async () => {
            setEditingModule(null);
            await loadModules();
          }}
        />
      )}
    </div>
  );
}
