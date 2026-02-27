import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { apiFetch } from "../lib/api";
import { AICoachWidget } from "../components/AICoachWidget";
import { PageHero } from "../components/PageHero";
import { normalizeAllCaps, normalizeAllCapsText } from "../lib/text";
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
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith("es");

  const { user } = useOutletContext();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [module, setModule] = useState(null);
  const { moduleTitle, moduleDescription } = useModuleTranslation(module);
  const [resources, setResources] = useState([]);
  const [active, setActive] = useState(null);
  const [readerPage, setReaderPage] = useState(0);
  // Page-flip state
  const [flipAngle, setFlipAngle]       = useState(0);   // 0–180 degrees
  const [flipDir, setFlipDir]           = useState("next"); // "next"|"prev"
  const [flipPhase, setFlipPhase]       = useState("idle"); // "idle"|"dragging"|"settling"|"done"
  const [flipNextPage, setFlipNextPage] = useState(null);
  const flipTouchStartX = useRef(null);
  const flipContainerRef = useRef(null);
  const flipRafRef       = useRef(null);

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
  const userResourcesSubtitle = useMemo(() => t("moduleDetail.user.contentSubtitle"), [t]);

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
      setReaderPage(0);
      setFlipAngle(0);
      setFlipPhase("idle");
      setFlipNextPage(null);
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
      <PageHero
        eyebrow="AutoRx Academy"
        title={normalizeAllCaps(moduleTitle)}
        subtitle={
          <span
            className="block line-clamp-2"
            title={normalizeAllCaps(moduleDescription || "")}
          >
            {normalizeAllCaps(moduleDescription) || "—"}
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 active:scale-95"
            style={{ background: "#F7941D" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#e07d0e")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#F7941D")
            }
          >
            AI Coach
          </button>
        }
      />

      <div className="card p-5">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          AI Coach
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <span className="text-xl shrink-0" role="img" aria-label="AI Coach">🤖</span>

          <input
            type="text"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none min-w-0"
            placeholder="Ask AI Coach anything about this module…"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") askAiInline(); }}
          />

          {aiQuery && (
            <button
              type="button"
              onClick={() => { setAiQuery(""); setAiInlineResult(null); }}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
              aria-label="Clear"
            >
              ×
            </button>
          )}

          <button
            type="button"
            onClick={askAiInline}
            disabled={aiInlineLoading || !aiQuery.trim()}
            className="shrink-0 btn-primary btn-sm disabled:opacity-40"
          >
            {aiInlineLoading ? (
              <span className="animate-pulse">…</span>
            ) : (
              <>Ask <span>→</span></>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="shrink-0 text-xs text-slate-400 hover:text-brand-primary transition-colors whitespace-nowrap hidden sm:block"
            title="Open full AI Coach"
          >
            Full chat ↗
          </button>
        </div>

        {(aiInlineLoading || aiInlineResult) && (
          <div
            className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
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
                        <span className="mt-0.5 text-brand-primary">✦</span> {tk}
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
                    className="text-xs text-brand-primary hover:underline"
                  >
                    Open full AI Coach chat ↗
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Tab navigation ───────────────────────────────────────────────── */}
      <div className="tab-nav-container flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm overflow-x-auto">
        {lessons.length > 0 && (
          <button
            onClick={() => { setActiveTab("lessons"); setActiveLessonId(null); }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
              activeTab === "lessons"
                ? "bg-brand-primary text-white"
                : "tab-inactive text-slate-500 hover:text-slate-700"
            }`}
          >
            📖 {t("lessons.tabLabel")}
          </button>
        )}
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === "overview"
              ? "bg-brand-primary text-white"
              : "tab-inactive text-slate-500 hover:text-slate-700"
          }`}
        >
          📋 {t("moduleDetail.user.contentTitle", "Content")}
        </button>
        <button
          onClick={() => setActiveTab("assessments")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === "assessments"
              ? "bg-brand-primary text-white"
              : "tab-inactive text-slate-500 hover:text-slate-700"
          }`}
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
                className="btn-outline-sm"
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
                    className="lesson-card card text-left p-3.5 hover:border-brand-primary hover:shadow-md transition-all"
                    type="button"
                  >
                    <div className="text-2xl mb-2">{lesson.icon}</div>
                    <div className="font-extrabold text-slate-800 text-sm mb-1 leading-snug">
                      {t(lesson.titleKey)}
                    </div>
                    <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {t(lesson.descriptionKey)}
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white bg-brand-primary">
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
                  {t("moduleDetail.showInactive", { count: inactiveCount })}
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
                      ? "card p-4"
                      : "card p-4 bg-slate-50 opacity-70"
                  }
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-extrabold truncate">
                          {normalizeAllCaps(a.title || "Assessment")}
                        </div>
                        {!isActive ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold">
                            {t("moduleDetail.inactive")}
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
                            {t("actions.deactivate")}
                          </button>
                        ) : (
                          <button
                            className="btn-outline-sm"
                            type="button"
                            onClick={() => activateAssessment(a.id)}
                          >
                            {t("actions.activate")}
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
              {isAdmin ? t("moduleDetail.resourcesTitle") : t("moduleDetail.user.contentTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{headerSubtitle}</p>

            {/* Admin: recommended language hint */}
            {isAdmin && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <span className="mt-0.5 text-base">💡</span>
                <span>
                  For best results, upload files to Drive <strong>in English</strong>. The app will automatically generate the Spanish translation on Sync.
                </span>
              </div>
            )}

            {/* Admin: resync banner when resources have text but missing ES translation */}
            {isAdmin && resources.some((r) => r.hasText && !r.hasTextEs) && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5 text-base">⚠️</span>
                <span>
                  Some resources are missing the Spanish translation. Run <strong>Sync Drive</strong> to generate it.
                </span>
              </div>
            )}

            {resources.length === 0 ? (
              <div className="mt-4 text-sm text-slate-600">{t("moduleDetail.noResources")}</div>
            ) : (
              <div className="mt-4 grid gap-3">
                {resources.map((r) => (
                  <div key={r.id} className="card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-extrabold truncate">{normalizeAllCaps(r.name)}</div>
                          {isAdmin && r.hasText && !r.hasTextEs && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              🔄 Needs sync
                            </span>
                          )}
                        </div>
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
                          {isAdmin ? t("moduleDetail.fullText") : t("moduleDetail.user.read")}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {r.hasText ? (
                        normalizeAllCapsText(
                          (isEs && r.previewTextEs ? r.previewTextEs : r.previewText || "")
                            .replace(/={3,}/g, "").replace(/_{3,}/g, "")
                            .replace(/\*{3,}/g, "").replace(/-{4,}/g, "")
                            .replace(/\s+/g, " ").trim()
                        )
                      ) : (
                        <span className="text-slate-400 italic">{t("moduleDetail.noExtractedText")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expanded full text — paginated book reader */}
          {active ? (
            <div ref={fullTextRef} className="card p-5 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold leading-snug">{normalizeAllCaps(active.name)}</h3>
                  {isAdmin ? <p className="text-xs text-slate-400 mt-0.5">{active.mimeType}</p> : null}
                </div>
                <button className="btn-outline-sm shrink-0" onClick={() => setActive(null)} type="button">
                  {t("actions.close")}
                </button>
              </div>

              {(() => {
                const rawText = (isEs && active.textEs) ? active.textEs : (active.text || "");

                // Clean up extracted text artifacts
                const cleaned = rawText
                  .replace(/={3,}/g, "")
                  .replace(/_{3,}/g, "")
                  .replace(/\*{3,}/g, "")
                  .replace(/-{4,}/g, "")
                  .replace(/\r\n/g, "\n")
                  .replace(/[ \t]+\n/g, "\n")
                  .replace(/\n{3,}/g, "\n\n");

                // Build blocks (paragraphs / headings)
                const allBlocks = cleaned.split(/\n{2,}/).map((block) =>
                  block.split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
                ).filter((b) => b.trim().length > 0);

                const isHeading = (text) =>
                  text.length < 80 && !text.endsWith(".") && !text.endsWith(",");

                // Paginate: ~6 blocks per page
                const BLOCKS_PER_PAGE = 6;
                const totalPages = Math.max(1, Math.ceil(allBlocks.length / BLOCKS_PER_PAGE));
                const safePage = Math.min(readerPage, totalPages - 1);
                const pageBlocks = allBlocks.slice(
                  safePage * BLOCKS_PER_PAGE,
                  safePage * BLOCKS_PER_PAGE + BLOCKS_PER_PAGE
                );

                // ── Book-page flip helpers ───────────────────────────────────
                // angle: 0 = flat, 180 = fully turned (we animate 0→180 for next, 180→0 for prev)
                // We use a split-page technique: the page is divided at the spine (center).
                // "next": right half of current page folds toward us (rotateY 0→-180, origin=left of that half)
                //         revealing right half of next page behind it
                // "prev": left half of current page folds toward us (rotateY 0→180, origin=right of that half)
                //         revealing left half of prev page behind it
                const isFlipping = flipPhase !== "idle";

                const animateTo = (fromAngle, toAngle, duration, onDone) => {
                  if (flipRafRef.current) cancelAnimationFrame(flipRafRef.current);
                  const start = performance.now();
                  const range = toAngle - fromAngle;
                  // ease-in-out cubic for natural page feel
                  const ease = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
                  const step = (now) => {
                    const raw = Math.min((now - start) / duration, 1);
                    setFlipAngle(fromAngle + range * ease(raw));
                    if (raw < 1) {
                      flipRafRef.current = requestAnimationFrame(step);
                    } else {
                      flipRafRef.current = null;
                      onDone && onDone();
                    }
                  };
                  flipRafRef.current = requestAnimationFrame(step);
                };

                const commitFlip = (startAngle, newPage) => {
                  setFlipPhase("settling");
                  setFlipNextPage(newPage);
                  // Animate to 180° (page fully turned), then swap and reset
                  animateTo(startAngle, 180, (180 - startAngle) / 180 * 420, () => {
                    setReaderPage(newPage);
                    setFlipNextPage(null);
                    setFlipAngle(0);
                    setFlipPhase("idle");
                    if (fullTextRef.current)
                      fullTextRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                };

                const springBack = (currentAngle) => {
                  setFlipPhase("settling");
                  animateTo(currentAngle, 0, (currentAngle / 180) * 300, () => {
                    setFlipPhase("idle");
                    setFlipNextPage(null);
                  });
                };

                const goTo = (p) => {
                  if (isFlipping) return;
                  const dir = p > safePage ? "next" : "prev";
                  setFlipDir(dir);
                  setFlipNextPage(p);
                  setFlipPhase("settling");
                  setFlipAngle(0);
                  commitFlip(0, p);
                };

                // ── Touch handlers ───────────────────────────────────────────
                const onTouchStart = (e) => {
                  if (isFlipping) return;
                  flipTouchStartX.current = e.touches[0].clientX;
                };

                const onTouchMove = (e) => {
                  if (flipTouchStartX.current === null || flipPhase === "settling") return;
                  const touchDx = e.touches[0].clientX - flipTouchStartX.current;
                  const dir = touchDx < 0 ? "next" : "prev";

                  if (dir === "next" && safePage === totalPages - 1) return;
                  if (dir === "prev" && safePage === 0) return;

                  if (flipPhase === "idle") {
                    setFlipDir(dir);
                    setFlipPhase("dragging");
                  }
                  // Map drag distance → 0–180°
                  const w = flipContainerRef.current?.offsetWidth || 320;
                  const angle = Math.min(Math.abs(touchDx) / (w * 0.6) * 180, 175);
                  setFlipAngle(angle);
                };

                const onTouchEnd = () => {
                  if (flipTouchStartX.current === null) return;
                  flipTouchStartX.current = null;
                  if (flipPhase !== "dragging") return;
                  if (flipAngle >= 60) {
                    const newPage = flipDir === "next" ? safePage + 1 : safePage - 1;
                    commitFlip(flipAngle, newPage);
                  } else {
                    springBack(flipAngle);
                  }
                };

                // ── Render: split-page book flip ─────────────────────────────
                // angle goes 0→180. At 90° the fold is edge-on.
                // Left half: stays put (static, clipped at center)
                // Right half of CURRENT page: rotates around left edge of that half (= center of page)
                //   rotateY: 0→-180 (folds backward for "next")
                // Right half of NEXT page: sits behind, revealed as flap sweeps over it
                //   it's already at -180°, but we show it via backface of the fold (or just absolute under)

                const nextPageBlocks = flipNextPage !== null
                  ? allBlocks.slice(flipNextPage * BLOCKS_PER_PAGE, flipNextPage * BLOCKS_PER_PAGE + BLOCKS_PER_PAGE)
                  : [];

                const renderBlocks = (blocks, pageIdx) =>
                  blocks.length > 0 ? blocks.map((block, i) => {
                    const norm = normalizeAllCapsText(block);
                    return isHeading(block) && !(pageIdx === 0 && i === 0)
                      ? <p key={i} className="text-base sm:text-lg font-bold text-slate-700 pt-2">{norm}</p>
                      : <p key={i} className="text-base sm:text-[17px] text-slate-800 leading-relaxed sm:leading-7">{norm}</p>;
                  }) : <p className="text-sm text-slate-500">—</p>;

                // For "next": fold right half of current page to the left
                // For "prev": fold left half of current page to the right
                // foldAngle: how far along 0→180 the fold is
                const foldAngle = flipAngle; // 0–180
                // The half that lifts: its rotateY
                // next: starts 0°, goes to -180° (folds back left)
                // prev: starts 0°, goes to  180° (folds back right)
                const flapRotate = flipDir === "next" ? -foldAngle : foldAngle;
                // Fold origin is at the spine (center of book)
                // Shadow intensity on the fold
                const shadowStrength = Math.sin((foldAngle / 180) * Math.PI); // peaks at 90°
                const flapShadow = shadowStrength > 0.05
                  ? `inset ${flipDir === "next" ? "-" : ""}${Math.round(shadowStrength * 20)}px 0 ${Math.round(shadowStrength * 30)}px rgba(0,0,0,${(shadowStrength * 0.35).toFixed(2)})`
                  : "none";
                // Static half shadow (the non-folding half gets darker as flap passes over it)
                const staticShadow = shadowStrength > 0.05
                  ? `inset ${flipDir === "next" ? "" : "-"}${Math.round(shadowStrength * 12)}px 0 ${Math.round(shadowStrength * 20)}px rgba(0,0,0,${(shadowStrength * 0.15).toFixed(2)})`
                  : "none";

                // Corner peel indicator
                const showPeelNext = isFlipping && flipDir === "next" && foldAngle > 3;
                const showPeelPrev = isFlipping && flipDir === "prev" && foldAngle > 3;

                return (
                  <div className="flex flex-col gap-6">
                    {/* Book-flip CSS */}
                    <style>{`
                      .book-page { position: relative; background: white; border-radius: 1rem; }
                      .book-half {
                        position: absolute; top: 0; bottom: 0; width: 50%; overflow: hidden;
                        background: white;
                      }
                      .book-half-left  { left: 0;  border-radius: 1rem 0 0 1rem; }
                      .book-half-right { right: 0; border-radius: 0 1rem 1rem 0; }
                      /* inner div shifts content so both halves show the full page text */
                      .book-half-inner { position: absolute; top: 0; left: 0; right: 0; }
                      .book-half-left  .book-half-inner { width: 200%; }
                      .book-half-right .book-half-inner { width: 200%; right: auto; }
                      .book-flap {
                        position: absolute; top: 0; bottom: 0; width: 50%;
                        will-change: transform; background: white; overflow: hidden;
                        transform-style: preserve-3d;
                      }
                      .book-flap-next { right: 0; border-radius: 0 1rem 1rem 0; transform-origin: left center; }
                      .book-flap-prev { left: 0;  border-radius: 1rem 0 0 1rem; transform-origin: right center; }
                      .book-flap-inner { position: absolute; top: 0; bottom: 0; }
                      .book-flap-next .book-flap-inner { right: 0; left: -100%; }
                      .book-flap-prev .book-flap-inner { left: 0; right: -100%; }
                      .corner-peel-r, .corner-peel-l {
                        position: absolute; bottom: 0; z-index: 20;
                        width: 0; height: 0; border-style: solid;
                        opacity: 0; transition: opacity 0.1s ease;
                        pointer-events: none;
                      }
                      .corner-peel-r { right: 0; border-color: transparent transparent #475569 transparent; border-width: 0 0 48px 48px; }
                      .corner-peel-l { left: 0;  border-color: transparent transparent transparent #475569; border-width: 0 0 48px 48px; }
                      .corner-peel-r.on, .corner-peel-l.on { opacity: 1; }
                    `}</style>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ background: "#1E6FAE", width: `${((safePage + 1) / totalPages) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-400 shrink-0">
                        {safePage + 1} / {totalPages}
                      </span>
                    </div>

                    {/* Book page — split-half flip */}
                    <div
                      ref={flipContainerRef}
                      className="book-page select-none"
                      style={{ perspective: "1400px", touchAction: "pan-y" }}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      {/* Invisible full-page content — sets the container height */}
                      <div className="invisible p-5 sm:p-6 space-y-5 pointer-events-none" aria-hidden>
                        {renderBlocks(pageBlocks, safePage)}
                      </div>

                      {/* Static left half — current page left side (always visible) */}
                      <div
                        className="book-half book-half-left"
                        style={{ boxShadow: flipDir === "next" ? staticShadow : "none" }}
                      >
                        <div className="book-half-inner p-5 sm:p-6 space-y-5">
                          {renderBlocks(pageBlocks, safePage)}
                        </div>
                      </div>

                      {/* Static right half — shows NEXT page right side (revealed as flap sweeps left) */}
                      <div
                        className="book-half book-half-right"
                        style={{ boxShadow: flipDir === "prev" ? staticShadow : "none" }}
                      >
                        <div
                          className="book-half-inner p-5 sm:p-6 space-y-5"
                          style={{ paddingLeft: "calc(50% + 1.25rem)" }}
                        >
                          {isFlipping
                            ? renderBlocks(nextPageBlocks, flipNextPage)
                            : renderBlocks(pageBlocks, safePage)}
                        </div>
                      </div>

                      {/* Folding flap — the half that lifts and curls */}
                      <div
                        className={`book-flap ${flipDir === "next" ? "book-flap-next" : "book-flap-prev"}`}
                        style={{
                          transform: `rotateY(${flapRotate}deg)`,
                          boxShadow: flapShadow,
                          // Hide once past 90° — backface would show mirrored text
                          opacity: foldAngle > 90 ? 0 : 1,
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          className="book-flap-inner p-5 sm:p-6 space-y-5"
                          style={
                            flipDir === "next"
                              ? { right: 0, left: "-100%", paddingLeft: "calc(50% + 1.25rem)" }
                              : { left: 0, right: "-100%" }
                          }
                        >
                          {renderBlocks(pageBlocks, safePage)}
                        </div>
                      </div>

                      {/* Corner peels */}
                      <div className={`corner-peel-r${showPeelNext ? " on" : ""}`} />
                      <div className={`corner-peel-l${showPeelPrev ? " on" : ""}`} />
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <button
                        className="btn-outline-sm flex items-center gap-1.5 disabled:opacity-40"
                        onClick={() => goTo(safePage - 1)}
                        disabled={safePage === 0 || isFlipping}
                        type="button"
                      >
                        ← {t("lessons.previous", "Previous")}
                      </button>

                      {/* Page dots — show up to 7 */}
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          if (totalPages > 7 && Math.abs(i - safePage) > 2 && i !== 0 && i !== totalPages - 1) {
                            if (i === 1 || i === totalPages - 2) return <span key={i} className="text-slate-300 text-xs">…</span>;
                            return null;
                          }
                          return (
                            <button
                              key={i}
                              onClick={() => !isFlipping && goTo(i)}
                              type="button"
                              className={`rounded-full transition-all ${
                                i === safePage
                                  ? "w-3 h-3 bg-brand-primary"
                                  : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                              }`}
                            />
                          );
                        })}
                      </div>

                      <button
                        className="btn-outline-sm flex items-center gap-1.5 disabled:opacity-40"
                        onClick={() => goTo(safePage + 1)}
                        disabled={safePage >= totalPages - 1 || isFlipping}
                        type="button"
                      >
                        {t("lessons.next", "Next")} →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </>
      )} {/* end activeTab === "overview" */}

      {/* ── Admin tools card (below Resources, visible on any tab) ─────────── */}
      {isAdmin && (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            {t("admin.toolsLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Edit module */}
            <button
              className="btn-outline-sm"
              onClick={() => setEditOpen(true)}
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("actions.edit", "Edit")}
            </button>

            {/* Sync Drive */}
            <button
              className="btn-outline-sm disabled:opacity-50"
              onClick={runSync}
              disabled={syncing}
              type="button"
            >
              <span className="text-sm">{syncing ? "⏳" : "↻"}</span>
              {syncing ? t("actions.syncing") : t("actions.sync")}
            </button>

            {/* Generate / Append assessment */}
            <button
              className={`btn-sm flex items-center gap-1.5 font-extrabold text-white disabled:opacity-50 transition-all ${appendStop ? "bg-slate-400" : "bg-brand-primary hover:bg-brand-primaryHover"}`}
              onClick={runAdaptiveAssessmentAction}
              disabled={adaptiveButtonDisabled}
              type="button"
              title={appendStop ? "Bank stopped (cap reached or material exhausted)." : ""}
            >
              <span>{hasActiveAssessment ? "⚡" : "✨"}</span>
              {hasActiveAssessment
                ? (appendLoading ? t("actions.appending10") : t("actions.append10"))
                : (genLoading ? t("actions.generating") : t("actions.generate"))}
            </button>
          </div>
        </div>
      )}

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
