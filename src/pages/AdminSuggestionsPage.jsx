import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lightbulb, ArrowRight, RefreshCw, PlusCircle, User, Calendar } from "lucide-react";
import { apiFetch } from "../lib/api";

// ── Category label helpers ──────────────────────────────────────────────────

const TECH_CATEGORY_LABELS = {
  brakes:        "Brakes",
  suspension:    "Suspension & Steering",
  diagnostics:   "Diagnostics & Electronics",
  engine:        "Engine Performance",
  maintenance:   "Preventive Maintenance",
  other:         "Other",
};

const SA_CATEGORY_LABELS = {
  presenting:  "Presenting repair options to customers",
  declined:    "Following up on declined work",
  estimates:   "Estimate accuracy",
  techComm:    "Communicating with technicians",
  other:       "Other",
};

function getCategoryLabel(category, isTech) {
  if (!category) return category;
  // handle "other: <text>" free-text
  if (category.startsWith("other: ")) return category;
  const map = isTech ? TECH_CATEGORY_LABELS : SA_CATEGORY_LABELS;
  return map[category] ?? category;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// Map category key → suggested module category for new module pre-fill
const CATEGORY_TO_MODULE = {
  brakes:      "Brakes",
  suspension:  "Suspension",
  diagnostics: "Diagnostics",
  engine:      "Engine",
  maintenance: "Preventive Maintenance",
  presenting:  "Sales",
  declined:    "Sales",
  estimates:   "Sales",
  techComm:    "Communication",
};

// ── Main Component ──────────────────────────────────────────────────────────

export function AdminSuggestionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all"); // "all" | "tech" | "sa"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-suggestions"],
    queryFn: () => apiFetch("/api/admin/suggestions"),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const suggestions = data?.suggestions ?? [];

  const filtered = suggestions.filter((s) => {
    if (filter === "tech") return s.is_tech === true;
    if (filter === "sa")   return s.is_tech === false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {t("adminSuggestions2.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("adminSuggestions2.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn-outline-sm flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("adminSuggestions2.refresh")}
        </button>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2">
        {[
          { key: "all", label: t("adminSuggestions2.filterTabs.all") },
          { key: "tech", label: t("adminSuggestions2.filterTabs.technicians") },
          { key: "sa",   label: t("adminSuggestions2.filterTabs.serviceAdvisors") },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filter === tab.key
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            {tab.label}
            {tab.key === "all" && suggestions.length > 0 && (
              <span className="ml-1.5 bg-white/20 text-white rounded-full px-1.5 text-[10px]">
                {suggestions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="card p-10 text-center">
          <p className="text-slate-500 text-sm animate-pulse">{t("adminSuggestions2.loading")}</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-red-500 text-sm mb-2">Failed to load suggestions.</p>
          <p className="text-slate-400 text-xs">
            Make sure the /api/admin/suggestions endpoint is deployed on the backend.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-3xl mb-3">💡</div>
          <p className="text-slate-500 text-sm">No suggestions yet.</p>
          <p className="text-slate-400 text-xs mt-1">
            Check-in responses will appear here when employees submit their weekly surveys.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const catLabel     = getCategoryLabel(s.category, s.is_tech);
            const modulePreset = CATEGORY_TO_MODULE[s.category] ?? "";
            const isOther      = s.category === "other" || s.category?.startsWith("other:");
            const moduleCreated = s.module_created === true;

            return (
              <div
                key={s.id}
                className={`card p-4 flex items-start gap-4 transition-all ${
                  moduleCreated
                    ? "opacity-60 border-emerald-200 dark:border-emerald-800/40"
                    : "hover:border-brand-primary/30"
                }`}
              >
                {/* Icon */}
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  s.is_tech
                    ? "bg-violet-100 dark:bg-violet-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}>
                  <span className="text-base">{s.is_tech ? "🔧" : "🤝"}</span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {catLabel}
                      </p>
                      {isOther && s.category?.startsWith("other:") && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">
                          "{s.category.replace("other: ", "")}"
                        </p>
                      )}
                    </div>
                    {moduleCreated && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium shrink-0">
                        ✅ {t("adminSuggestions2.moduleCreated")}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <User className="h-3 w-3" />
                      {s.user_name ?? s.email ?? "Unknown user"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(s.submitted_at)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.is_tech
                        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    }`}>
                      {s.is_tech ? t("adminSuggestions2.technician") : t("adminSuggestions2.serviceAdvisor")}
                    </span>
                  </div>
                </div>

                {/* Action: Create module */}
                {!moduleCreated && !isOther && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/modules?suggest=${encodeURIComponent(modulePreset)}&suggestion_id=${s.id}`)
                    }
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-semibold transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    {t("adminSuggestions2.createModule")}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Stats summary ── */}
      {suggestions.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">
            {t("adminSuggestions2.topicFrequency")}
          </p>
          <div className="space-y-1.5">
            {computeTopicFrequency(suggestions).map(({ label, count, pct }) => (
              <div key={label} className="flex items-center gap-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 w-52 truncate">{label}</p>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary/60 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeTopicFrequency(suggestions) {
  const map = new Map();
  for (const s of suggestions) {
    const label = getCategoryLabel(s.category, s.is_tech);
    const key   = label.startsWith("Other")
      ? (s.is_tech ? "Other (Tech)" : "Other (SA)")
      : label;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const total = suggestions.length;
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }));
}
