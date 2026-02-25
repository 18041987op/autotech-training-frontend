import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { apiFetch } from "../lib/api";
import { AICoachWidget } from "../components/AICoachWidget";
import { useModuleTranslation } from "../hooks/useModuleTranslation";
import { lessonRegistry, lessonRegistryByTitle } from "../lessons/registry";
import { ToastContainer, useToast } from "../components/Toast";

// ─── Inline edit modal (admin-only) ───────────────────────────────────────────

const EDIT_CATEGORIES = [
  { value: "universal",       label: "Universal" },
  { value: "technician",      label: "Technician" },
  { value: "service_advisor", label: "Service Advisor" },
  { value: "administrative",  label: "Administrative" },
];

const EDIT_SUBCATEGORIES = [
  "Fluids & Maintenance", "Brakes & Chassis", "Tires & Wheels", "Engine & Cooling",
  "HVAC & Climate", "Electrical & Diagnostics", "Transmission & Drivetrain",
  "Suspension & Steering", "Safety & Compliance", "State Inspection",
  "Customer Communication", "Shop Operations", "Vehicle Delivery",
  "Onboarding & Orientation", "HR & Policies", "Operations & Inventory", "General",
];

function EditModuleModal({ module: m, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title:        m.title        || "",
    description:  m.description  || "",
    category:     m.category     || "universal",
    subcategory:  m.subcategory  || "",
    required:     !!m.required,
    icon:         m.icon         || "Shield",
    color:        m.color        || "#1E6FAE",
    drive_folder: m.drive_folder ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[94%] max-w-[720px] max-h-[90vh] overflow-y-auto rounded-3xl border bg-white shadow-xl p-6">
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
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.title", "Title")}
            </label>
            <input className="mt-1 input" value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.description", "Description")}
            </label>
            <textarea className="mt-1 input" rows={3} value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.category", "Category")}
            </label>
            <select className="mt-1 input bg-white" value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {EDIT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.subcategory", "Subcategory")}
            </label>
            <select className="mt-1 input bg-white" value={form.subcategory || ""}
              onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}>
              <option value="">— {t("adminModules.fields.subcategoryNone", "No subcategory")} —</option>
              {EDIT_SUBCATEGORIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.required} className="rounded"
                onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))} />
              {t("adminModules.fields.required", "Required")}
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.icon", "Icon")}
            </label>
            <input className="mt-1 input" value={form.icon}
              onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.color", "Color")}
            </label>
            <input className="mt-1 input" value={form.color} placeholder="#1E6FAE"
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("adminModules.fields.driveFolder", "Drive Folder")}
            </label>
            <input className="mt-1 input" value={form.drive_folder || ""} placeholder="e.g., Warranty-Procedures"
              onChange={(e) => setForm((p) => ({ ...p, drive_folder: e.target.value }))} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline-sm" onClick={onClose} type="button">
            {t("actions.cancel", "Cancel")}
          </button>
          <button className="btn-primary btn-sm px-5 disabled:opacity-60" onClick={save} disabled={saving} type="button">
            {saving ? "Saving…" : t("actions.save", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModuleDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();

  const { user } = useOutletContext();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [module, setModule] = useState(null);
  const { moduleTitle, moduleDescription } = useModuleTranslation(module);
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);

  const [assessments, setAssessments] = useState([]);
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessErr, setAssessErr] = useState("");

  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [syncing, setSyncing] = useState(false);

  const [genLoading, setGenLoading] = useState(false);

  // Append questions UI state
  const [appendLoading, setAppendLoading] = useState(false);
  const [appendStop, setAppendStop] = useState(false);

  const fullTextRef = useRef(null);

  // Toast notifications
  const { toasts, showToast, removeToast } = useToast();

  // Modal state for AI Coach (keeps user on this page)
  const [aiOpen, setAiOpen] = useState(false);

  // Inline AI Coach search bar state
  const [aiQuery, setAiQuery] = useState("");
  const [aiInlineResult, setAiInlineResult] = useState(null);
  const [aiInlineLoading, setAiInlineLoading] = useState(false);

  // Admin: inline edit modal
  const [editOpen, setEditOpen] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("overview");

  // Interactive lessons for this module — try UUID first, then fall back to title
  const lessons = lessonRegistry[module?.id] || lessonRegistryByTitle[module?.title] || [];

  // Which individual lesson is open (null = show gallery)
  const [activeLessonId, setActiveLessonId] = useState(null);
  const activeLesson = lessons.find((l) => l.id === activeLessonId) || null;

  // Sync lesson content to module_resources for AI assessment (admin only)
  const [syncLessonLoading, setSyncLessonLoading] = useState(false);
  const [syncLessonMsg, setSyncLessonMsg] = useState("");

  // When module loads and lessons exist, switch to "lessons" tab by default
  useEffect(() => {
    if (module?.id) {
      const ls = lessonRegistry[module.id] || lessonRegistryByTitle[module.title] || [];
      if (ls.length > 0) setActiveTab("lessons");
    }
  }, [module?.id, module?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Admin subtitle (existing translation)
  const adminResourcesSubtitle = useMemo(() => t("moduleDetail.resourcesSubtitle"), [t]);

  // User subtitle (no Drive mention)
  const userResourcesSubtitle = useMemo(() => {
    // Keep this simple; we can move it into i18n later if you want.
    return "Training content is available inside the app. Open Full text to read.";
  }, []);

  const headerSubtitle = isAdmin ? adminResourcesSubtitle : userResourcesSubtitle;

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

  // When "active" full text is set, scroll to it so the user sees it opened
  useEffect(() => {
    if (!active) return;
    const tmr = setTimeout(() => {
      fullTextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => clearTimeout(tmr);
  }, [active]);

  const inactiveCount = useMemo(() => {
    return (assessments || []).filter((a) => a.isActive === false).length;
  }, [assessments]);

  const visibleAssessments = useMemo(() => {
    const activeOnes = (assessments || []).filter((a) => a.isActive !== false);
    const inactiveOnes = (assessments || []).filter((a) => a.isActive === false);

    if (!isAdmin) return activeOnes;
    return showInactive ? [...activeOnes, ...inactiveOnes] : activeOnes;
  }, [assessments, isAdmin, showInactive]);

  // Determines whether we already have an active bank for this module
  const hasActiveAssessment = useMemo(() => {
    return (assessments || []).some((a) => a.isActive !== false);
  }, [assessments]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const out = await apiFetch(`/api/admin/modules/${id}/sync`, { method: "POST" });
      showToast(`↻ Sync complete: ${out.totalFiles} files, ${out.extractedWithText} extracted`, "success");
      await load();
    } catch (e) {
      showToast(e.message || "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const syncLessonContent = async () => {
    setSyncLessonMsg("");
    setSyncLessonLoading(true);
    try {
      const payload = lessons.map((l) => ({
        id:    l.id,
        title: t(l.titleKey),
        text:  l.contentText || "",
      }));
      await apiFetch(`/api/admin/modules/${id}/sync-lesson-content`, {
        method: "POST",
        body: { lessons: payload },
      });
      setSyncLessonMsg(t("lessons.syncDone"));
    } catch (e) {
      setSyncLessonMsg(e.message || "Sync failed");
    } finally {
      setSyncLessonLoading(false);
    }
  };

  const generateAssessment = async () => {
    setGenLoading(true);
    setAppendStop(false);
    try {
      const out = await apiFetch(`/api/admin/modules/${id}/generate-assessment`, { method: "POST" });
      showToast(`✨ Assessment created: ${out.title}`, "success");
      await loadAssessments();
    } catch (e) {
      showToast(e.message || "Generation failed", "error");
    } finally {
      setGenLoading(false);
    }
  };

  const appendQuestions = async () => {
    setAppendLoading(true);
    try {
      const out = await apiFetch(`/api/admin/modules/${id}/append-questions`, { method: "POST" });

      const inserted = typeof out.insertedCount === "number" ? out.insertedCount : 0;
      const dupes    = typeof out.duplicateCount  === "number" ? out.duplicateCount  : 0;
      const totalNow = typeof out.totalQuestionsNow === "number" ? out.totalQuestionsNow : null;

      const stop = out.stop === true;
      setAppendStop(stop);

      if (stop) {
        showToast(`⚡ Bank complete — ${totalNow ?? "??"}/200 questions`, "info", 6000);
      } else {
        const msg = `⚡ +${inserted} questions added${dupes ? ` (${dupes} dupes skipped)` : ""}${totalNow != null ? ` • Total: ${totalNow}/200` : ""}`;
        showToast(msg, inserted > 0 ? "success" : "warning");
      }

      await loadAssessments();
    } catch (e) {
      showToast(e.message || "Append failed", "error");
    } finally {
      setAppendLoading(false);
    }
  };

  // Single adaptive admin action button:
  // - if no active assessment => Generate
  // - else => Append 10 questions
  const runAdaptiveAssessmentAction = async () => {
    if (!hasActiveAssessment) return generateAssessment();
    return appendQuestions();
  };


  const adaptiveButtonDisabled = useMemo(() => {
    if (!hasActiveAssessment) return genLoading;
    return appendLoading || appendStop;
  }, [hasActiveAssessment, genLoading, appendLoading, appendStop]);

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

  // ── Inline AI Coach ask ────────────────────────────────────────────────────
  const askAiInline = async () => {
    if (!aiQuery.trim()) return;
    setAiInlineLoading(true);
    setAiInlineResult(null);
    try {
      const data = await apiFetch("/api/ai/coach", {
        method: "POST",
        body: { question: aiQuery.trim(), moduleId: module?.id || null },
      });
      setAiInlineResult(data);
    } catch (e) {
      setAiInlineResult({ answer: e?.message || "Error getting AI response", takeaways: [], nextStep: "" });
    } finally {
      setAiInlineLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header card ──────────────────────────────────────────────────────── */}
      <div
        className="card overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ffffff 0%, #eef6ff 100%)" }}
      >
        {/* Zone 1 — Title + description */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{moduleTitle}</h1>
          <p
            className="mt-1.5 text-sm text-slate-500 leading-relaxed"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={moduleDescription || ""}
          >
            {moduleDescription || "—"}
          </p>
        </div>

        {/* Zone 2 — AI Coach inline search bar */}
        <div className="px-6 pb-5">
          <div
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
            style={{ boxShadow: "0 1px 6px rgba(30,111,174,0.08), inset 0 1px 2px rgba(0,0,0,0.03)" }}
          >
            {/* Bot icon */}
            <span className="text-xl shrink-0" role="img" aria-label="AI Coach">🤖</span>

            {/* Text input */}
            <input
              type="text"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none min-w-0"
              placeholder="Ask AI Coach anything about this module…"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") askAiInline(); }}
            />

            {/* Clear button when there's text */}
            {aiQuery && (
              <button
                type="button"
                onClick={() => { setAiQuery(""); setAiInlineResult(null); }}
                className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors text-lg leading-none"
                aria-label="Clear"
              >
                ×
              </button>
            )}

            {/* Send button */}
            <button
              type="button"
              onClick={askAiInline}
              disabled={aiInlineLoading || !aiQuery.trim()}
              className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-40 transition-all"
              style={{ background: "#1E6FAE" }}
            >
              {aiInlineLoading ? (
                <span className="animate-pulse">…</span>
              ) : (
                <>Ask <span>→</span></>
              )}
            </button>

            {/* Full modal link */}
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="shrink-0 text-xs text-slate-400 hover:text-blue-600 transition-colors whitespace-nowrap hidden sm:block"
              title="Open full AI Coach"
            >
              Full chat ↗
            </button>
          </div>

          {/* Inline AI result (fade-in card) */}
          {(aiInlineLoading || aiInlineResult) && (
            <div
              className="mt-3 rounded-2xl border border-blue-100 bg-white p-4 text-sm shadow-sm"
              style={{ animation: "fadeSlideIn 0.25s ease" }}
            >
              <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-6px);} to { opacity:1; transform:translateY(0);} }`}</style>
              {aiInlineLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="animate-pulse text-lg">🤖</span>
                  <span>Thinking…</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{aiInlineResult.answer}</p>
                  {aiInlineResult.takeaways?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {aiInlineResult.takeaways.map((tk, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <span className="mt-0.5 text-blue-500">✦</span> {tk}
                        </li>
                      ))}
                    </ul>
                  )}
                  {aiInlineResult.nextStep && (
                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-semibold">Next step:</span> {aiInlineResult.nextStep}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAiOpen(true)}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Open full AI Coach chat ↗
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Zone 3 — Admin toolbar (only if isAdmin) */}
        {isAdmin && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* LEFT: Edit */}
              <button
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-700 transition-all"
                onClick={() => setEditOpen(true)}
                type="button"
              >
                <Pencil className="h-3 w-3" />
                {t("actions.edit", "Edit")}
              </button>

              {/* CENTER: Generate / Append assessment */}
              <button
                className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-extrabold text-white shadow-sm disabled:opacity-50 transition-all"
                style={{ background: appendStop ? "#94a3b8" : "#1E6FAE" }}
                onClick={runAdaptiveAssessmentAction}
                disabled={adaptiveButtonDisabled}
                type="button"
                title={appendStop ? "Bank stopped (cap reached or material exhausted)." : ""}
              >
                <span>{hasActiveAssessment ? "⚡" : "✨"}</span>
                {hasActiveAssessment
                  ? (appendLoading ? "+10…" : "+10 Questions")
                  : (genLoading ? "Generating…" : "Generate")}
              </button>

              {/* RIGHT: Sync */}
              <button
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 transition-all"
                onClick={runSync}
                disabled={syncing}
                type="button"
              >
                <span>{syncing ? "⏳" : "↻"}</span>
                {syncing ? "Syncing…" : "Sync Drive"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab navigation ───────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm overflow-x-auto">
        {lessons.length > 0 && (
          <button
            onClick={() => { setActiveTab("lessons"); setActiveLessonId(null); }}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all"
            style={{
              background: activeTab === "lessons" ? "#1E6FAE" : "transparent",
              color:      activeTab === "lessons" ? "white"   : "#64748b",
            }}
          >
            📖 {t("lessons.tabLabel")}
          </button>
        )}
        <button
          onClick={() => setActiveTab("overview")}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all"
          style={{
            background: activeTab === "overview" ? "#1E6FAE" : "transparent",
            color:      activeTab === "overview" ? "white"   : "#64748b",
          }}
        >
          📋 {t("moduleDetail.user.contentTitle", "Content")}
        </button>
        <button
          onClick={() => setActiveTab("assessments")}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all"
          style={{
            background: activeTab === "assessments" ? "#1E6FAE" : "transparent",
            color:      activeTab === "assessments" ? "white"   : "#64748b",
          }}
        >
          🎯 {t("moduleDetail.assessmentsTitle")}
        </button>
      </div>

      {/* ── Lessons tab ──────────────────────────────────────────────────── */}
      {activeTab === "lessons" && lessons.length > 0 && (
        <div className="space-y-4">
          {/* Back button + individual lesson view */}
          {activeLesson ? (
            <>
              <button
                onClick={() => setActiveLessonId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                type="button"
              >
                {t("lessons.backToLessons")}
              </button>
              <activeLesson.component />
            </>
          ) : (
            /* Lesson gallery */
            <>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className="text-left rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
                    type="button"
                  >
                    <div className="text-2xl mb-2">{lesson.icon}</div>
                    <div className="font-extrabold text-slate-800 text-sm mb-1 leading-snug">
                      {t(lesson.titleKey)}
                    </div>
                    <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {t(lesson.descriptionKey)}
                    </div>
                    <div
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white"
                      style={{ background: "#1E6FAE" }}
                    >
                      {t("moduleDetail.user.read", "Open")} →
                    </div>
                  </button>
                ))}
              </div>

              {/* Admin: sync lesson content for AI assessment generation */}
              {isAdmin && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 text-sm text-slate-600">
                    <span className="font-extrabold text-slate-700">Admin:</span>{" "}
                    {t("lessons.syncContent")}
                  </div>
                  <button
                    onClick={syncLessonContent}
                    disabled={syncLessonLoading}
                    className="btn-outline-sm disabled:opacity-60 flex-shrink-0"
                    type="button"
                  >
                    {syncLessonLoading ? t("lessons.syncing") : t("lessons.syncContent")}
                  </button>
                  {syncLessonMsg ? (
                    <div className="text-xs text-slate-600 sm:ml-2">{syncLessonMsg}</div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Assessments tab ──────────────────────────────────────────────── */}
      {activeTab === "assessments" && (
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
      )} {/* end activeTab === "assessments" */}

      {/* ── Content (overview) tab: resources + full text ─────────────────── */}
      {activeTab === "overview" && (
        <>
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">
              {isAdmin ? t("moduleDetail.resourcesTitle") : "Module content"}
            </h2>
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
                        {isAdmin ? <div className="text-xs text-slate-500">{r.mimeType}</div> : null}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {isAdmin && r.webViewLink ? (
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
                          {isAdmin ? t("moduleDetail.fullText") : "Read"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 max-h-24 overflow-hidden">
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

          {/* Expanded full text section */}
          {active ? (
            <div ref={fullTextRef} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold">{active.name}</h3>
                  {isAdmin ? <p className="text-xs text-slate-500">{active.mimeType}</p> : null}
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
        </>
      )} {/* end activeTab === "overview" */}

      {/* Admin: Inline Edit Modal */}
      {editOpen && module ? (
        <EditModuleModal
          module={module}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            setEditOpen(false);
            await load();
          }}
        />
      ) : null}

      {/* AI Coach Modal */}
      {aiOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close AI Coach"
            className="absolute inset-0 bg-black/40"
            onClick={() => setAiOpen(false)}
          />

          <div className="relative w-[94%] max-w-3xl max-h-[86vh] overflow-auto rounded-3xl bg-white shadow-xl border border-slate-200 p-4 md:p-6">
            <AICoachWidget
              initialModuleId={id}
              showHeader={false}
              onClose={() => setAiOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
