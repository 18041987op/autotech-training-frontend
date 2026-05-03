/**
 * ReleasesPage — employee-facing changelog at /releases.
 *
 * Read-only list of published release notes, newest first, grouped by month.
 * Each release shows: date, title, summary, and the items that shipped
 * (with category icons).
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Rocket, Sparkles, Bug, Zap, Wrench, Settings as SettingsIcon, Calendar,
} from "lucide-react";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { getReleases } from "../lib/roadmapApi";
import { PageHero } from "../components/PageHero";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const CATEGORY_META = {
  feature:        { icon: Sparkles,    color: "violet",  label: "Feature" },
  improvement:    { icon: Zap,         color: "amber",   label: "Improvement" },
  fix:            { icon: Bug,         color: "red",     label: "Fix" },
  infrastructure: { icon: Wrench,      color: "slate",   label: "Infrastructure" },
  integration:    { icon: SettingsIcon, color: "blue",   label: "Integration" },
};

function fmtDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function monthKey(iso) {
  const d = new Date(iso + "T12:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMonth(key) {
  const [y, m] = key.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[m - 1]} ${y}`;
}

export function ReleasesPage() {
  const { t } = useTranslation();
  const ready = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const email = user?.email;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["releases", email],
    queryFn: () => getReleases(email, false),
    enabled: !!ready && !!email,
    staleTime: 5 * 60 * 1000,
  });

  const grouped = useMemo(() => {
    const releases = data?.releases || [];
    const groups = {};
    for (const r of releases) {
      const key = monthKey(r.released_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    // Sort months desc, releases within month desc
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, list]) => ({
        key,
        label: fmtMonth(key),
        releases: list.sort((a, b) => b.released_at.localeCompare(a.released_at)),
      }));
  }, [data]);

  if (!ready) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("nav2.feedback", "Feedback")}
        title={t("releases.title", "What's New")}
        subtitle={t("releases.subtitle", "Recent updates to the AutoRx Training App. Newest first.")}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-sm">
          {error?.message || t("releases.loadError", "Could not load releases")}
        </div>
      ) : grouped.length === 0 ? (
        <div className="card p-8 text-center text-slate-500 text-sm">
          <Rocket className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          {t("releases.empty", "No releases published yet.")}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <div key={g.key} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900">{g.label}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-slate-100 text-slate-500">
                  {g.releases.length}
                </span>
              </div>
              {g.releases.map((r) => (
                <ReleaseCard key={r.id} release={r} t={t} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReleaseCard({ release, t }) {
  const items = Array.isArray(release.items) ? release.items : [];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-sky-50 to-violet-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white shadow-sm">
            <Rocket className="h-4 w-4 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold text-slate-900 leading-tight">{release.title}</p>
            <p className="text-[11px] text-slate-500">{fmtDate(release.released_at)}</p>
          </div>
        </div>
        {release.summary && (
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{release.summary}</p>
        )}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="px-5 py-3 space-y-1.5">
          {items.map((it, idx) => {
            const cat = CATEGORY_META[it.category] || CATEGORY_META.feature;
            const Icon = cat.icon;
            return (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <div className={`flex-shrink-0 grid h-5 w-5 place-items-center rounded-md bg-${cat.color}-100 text-${cat.color}-700 mt-0.5`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{it.title}</p>
                  {it.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{it.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
