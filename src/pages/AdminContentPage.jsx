import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText, FolderSync, Search, BookOpen, Brain,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle,
  AlertTriangle, Layers,
  ExternalLink, Globe, Zap,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { lessonRegistry, lessonRegistryByTitle } from "../lessons/registry";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getLessonsForModule(mod) {
  return lessonRegistry[mod.id] || lessonRegistryByTitle[mod.title] || [];
}

function formatDate(d) {
  if (!d) return "Never";
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function AdminContentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, has-resources, no-resources, has-lessons
  const [expandedId, setExpandedId] = useState(null);
  const [syncingIds, setSyncingIds] = useState(new Set());

  // Fetch all modules
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["adminModules"],
    queryFn: () => apiFetch("/api/admin/modules"),
  });
  const modules = useMemo(() => modulesData?.modules || modulesData || [], [modulesData]);

  // Fetch resource stats for all modules — we get resources-cache per expanded module
  const { data: expandedResources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["moduleResources", expandedId],
    queryFn: () => apiFetch(`/api/modules/${expandedId}/resources-cache`),
    enabled: !!expandedId,
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!modules.length) return null;
    let withDrive = 0, withLessons = 0, totalLessons = 0;
    for (const mod of modules) {
      if (mod.drive_folder_id) withDrive++;
      const lessons = getLessonsForModule(mod);
      if (lessons.length) { withLessons++; totalLessons += lessons.length; }
    }
    return {
      total: modules.length,
      withDrive,
      withLessons,
      totalLessons,
      noDrive: modules.length - withDrive,
    };
  }, [modules]);

  // ── Filter + search ───────────────────────────────────────────────────────
  const filteredModules = useMemo(() => {
    let list = [...modules];

    if (filterType === "has-resources") list = list.filter((m) => m.drive_folder_id);
    else if (filterType === "no-resources") list = list.filter((m) => !m.drive_folder_id);
    else if (filterType === "has-lessons") list = list.filter((m) => getLessonsForModule(m).length > 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.subcategory?.toLowerCase().includes(q)
      );
    }

    // Sort: modules with Drive folders first, then alphabetically
    list.sort((a, b) => {
      if (a.drive_folder_id && !b.drive_folder_id) return -1;
      if (!a.drive_folder_id && b.drive_folder_id) return 1;
      return (a.title || "").localeCompare(b.title || "");
    });

    return list;
  }, [modules, filterType, search]);

  // ── Sync single module ────────────────────────────────────────────────────
  const handleSync = async (moduleId) => {
    setSyncingIds((prev) => new Set([...prev, moduleId]));
    try {
      const result = await apiFetch(`/api/admin/modules/${moduleId}/sync`, { method: "POST" });
      toast.success(`Synced: ${result.upserted} files, ${result.extractedWithText} with text`);
      queryClient.invalidateQueries({ queryKey: ["moduleResources", moduleId] });
    } catch (err) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncingIds((prev) => { const next = new Set(prev); next.delete(moduleId); return next; });
    }
  };

  // ── Sync lesson content for AI ────────────────────────────────────────────
  const handleSyncLessons = async (moduleId) => {
    setSyncingIds((prev) => new Set([...prev, `lesson-${moduleId}`]));
    try {
      const result = await apiFetch(`/api/admin/modules/${moduleId}/sync-lesson-content`, { method: "POST" });
      toast.success(result.message || "Lesson content synced for AI");
      queryClient.invalidateQueries({ queryKey: ["moduleResources", moduleId] });
    } catch (err) {
      toast.error(err.message || "Lesson sync failed");
    } finally {
      setSyncingIds((prev) => { const next = new Set(prev); next.delete(`lesson-${moduleId}`); return next; });
    }
  };

  // ── Generate assessment ───────────────────────────────────────────────────
  const handleGenerateAssessment = async (moduleId) => {
    setSyncingIds((prev) => new Set([...prev, `assess-${moduleId}`]));
    try {
      const result = await apiFetch(`/api/admin/modules/${moduleId}/generate-assessment`, { method: "POST" });
      toast.success(`Assessment generated: ${result.questionsGenerated || "?"} questions`);
    } catch (err) {
      toast.error(err.message || "Assessment generation failed");
    } finally {
      setSyncingIds((prev) => { const next = new Set(prev); next.delete(`assess-${moduleId}`); return next; });
    }
  };

  // ── Bulk sync all modules with Drive folders ──────────────────────────────
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);

  const handleBulkSync = async () => {
    const driveMods = modules.filter((m) => m.drive_folder_id);
    if (!driveMods.length) { toast.info("No modules with Drive folders to sync"); return; }

    setBulkSyncing(true);
    setBulkProgress({ done: 0, total: driveMods.length, errors: 0 });

    let done = 0, errors = 0;
    for (const mod of driveMods) {
      try {
        await apiFetch(`/api/admin/modules/${mod.id}/sync`, { method: "POST" });
      } catch { errors++; }
      done++;
      setBulkProgress({ done, total: driveMods.length, errors });
    }

    setBulkSyncing(false);
    setBulkProgress(null);
    toast.success(`Bulk sync complete: ${done - errors} succeeded, ${errors} failed`);
    queryClient.invalidateQueries({ queryKey: ["moduleResources"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-600" />
            Content Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Drive resources, interactive lessons, and AI assessments
          </p>
        </div>
        <button
          onClick={handleBulkSync}
          disabled={bulkSyncing || modulesLoading}
          className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
        >
          <FolderSync className={`h-4 w-4 ${bulkSyncing ? "animate-spin" : ""}`} />
          {bulkSyncing ? `Syncing ${bulkProgress?.done}/${bulkProgress?.total}...` : "Sync All Modules"}
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Modules" value={stats.total} icon={<Layers className="h-5 w-5 text-sky-500" />} />
          <StatCard label="With Drive Folder" value={stats.withDrive} icon={<FolderSync className="h-5 w-5 text-emerald-500" />} />
          <StatCard label="With Lessons" value={stats.withLessons} sub={`${stats.totalLessons} lessons total`} icon={<BookOpen className="h-5 w-5 text-violet-500" />} />
          <StatCard label="No Drive Folder" value={stats.noDrive} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
        </div>
      )}

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "all", label: "All" },
            { value: "has-resources", label: "Has Drive" },
            { value: "no-resources", label: "No Drive" },
            { value: "has-lessons", label: "Has Lessons" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                filterType === f.value
                  ? "bg-sky-100 text-sky-700 border border-sky-300"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module list */}
      {modulesLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No modules match your filter
        </div>
      ) : (
        <div className="space-y-2">
          {filteredModules.map((mod) => {
            const lessons = getLessonsForModule(mod);
            const isExpanded = expandedId === mod.id;
            const isSyncing = syncingIds.has(mod.id);
            const isLessonSyncing = syncingIds.has(`lesson-${mod.id}`);
            const isAssessing = syncingIds.has(`assess-${mod.id}`);

            return (
              <div key={mod.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Module row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: (mod.color || "#e2e8f0") + "20" }}>
                    {mod.icon || "📄"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{mod.title}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                        {mod.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {mod.subcategory && (
                        <span className="text-xs text-slate-400">{mod.subcategory}</span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {mod.drive_folder_id ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <FolderSync className="h-3 w-3" /> Drive
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> No Drive
                      </span>
                    )}
                    {lessons.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {lessons.length} Lesson{lessons.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                      {mod.drive_folder_id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSync(mod.id); }}
                          disabled={isSyncing}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                          {isSyncing ? "Syncing..." : "Sync Drive"}
                        </button>
                      )}
                      {lessons.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSyncLessons(mod.id); }}
                          disabled={isLessonSyncing}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Zap className={`h-3 w-3 ${isLessonSyncing ? "animate-spin" : ""}`} />
                          {isLessonSyncing ? "Syncing..." : "Sync Lessons for AI"}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateAssessment(mod.id); }}
                        disabled={isAssessing}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Brain className={`h-3 w-3 ${isAssessing ? "animate-spin" : ""}`} />
                        {isAssessing ? "Generating..." : "Generate Assessment"}
                      </button>
                      <Link
                        to={`/modules/${mod.id}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" /> View Module
                      </Link>
                    </div>

                    {/* Interactive lessons list */}
                    {lessons.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                          Interactive Lessons
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100">
                              <span className="text-lg">{lesson.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">{lesson.titleKey.split(".").pop()}</p>
                                <p className="text-[10px] text-slate-400">ID: {lesson.id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drive resources */}
                    {isExpanded && expandedId === mod.id && (
                      <ResourcesSection
                        moduleId={mod.id}
                        resources={expandedResources?.resources}
                        loading={resourcesLoading}
                        hasDrive={!!mod.drive_folder_id}
                      />
                    )}

                    {/* Module metadata */}
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                      <span>ID: <code className="text-slate-500">{mod.id}</code></span>
                      {mod.drive_folder_id && (
                        <span>Drive Folder: <code className="text-slate-500">{mod.drive_folder_id.slice(0, 12)}...</code></span>
                      )}
                      {mod.domain && <span>Domain: {mod.domain}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Resources Section (inside expanded module) ─────────────────────────────

function ResourcesSection({ moduleId, resources, loading, hasDrive }) {
  if (!hasDrive) {
    return (
      <div className="text-xs text-slate-400 italic">
        No Google Drive folder linked. Set the Drive folder in Manage Modules to enable resource sync.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic">
        No cached resources. Click "Sync Drive" to pull files from Google Drive.
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
        Drive Resources ({resources.length})
      </h4>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {resources.map((res) => (
          <div key={res.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 text-xs">
            <MimeIcon mimeType={res.mimeType} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-700 truncate">{res.name}</p>
              <p className="text-[10px] text-slate-400">
                {res.hasText ? "Text extracted" : "No text"}
                {res.hasTextEs ? " | Spanish" : ""}
                {res.extractedAt ? ` | ${formatDate(res.extractedAt)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {res.hasText ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              )}
              {res.hasTextEs && <Globe className="h-3.5 w-3.5 text-sky-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Small components ───────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function MimeIcon({ mimeType }) {
  const type = mimeType || "";
  let emoji = "📄";
  if (type.includes("document") || type.includes("word")) emoji = "📝";
  else if (type.includes("spreadsheet") || type.includes("excel")) emoji = "📊";
  else if (type.includes("presentation") || type.includes("powerpoint")) emoji = "📽";
  else if (type.includes("pdf")) emoji = "📕";
  else if (type.includes("video")) emoji = "🎬";
  else if (type.includes("image")) emoji = "🖼";
  else if (type.includes("folder")) emoji = "📁";
  return <span className="text-base">{emoji}</span>;
}
