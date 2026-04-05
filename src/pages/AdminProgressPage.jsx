import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  Clock,
  Search,
  Award,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { PageHero } from "../components/PageHero";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ScorePill({ score, passing = 70 }) {
  if (score === null || score === undefined)
    return <span className="text-slate-300 text-xs">—</span>;
  const passed = score >= passing;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
        passed
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      {score}%
    </span>
  );
}

function CompletionBar({ value }) {
  const color =
    value === 100 ? "#22c55e" : value >= 50 ? "#f59e0b" : value > 0 ? "#3b82f6" : "#e2e8f0";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── User detail row (expandable) ────────────────────────────────────────────
function UserRow({ user }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const statusColor =
    user.avgCompletion === 100
      ? "border-emerald-200 bg-emerald-50"
      : user.avgCompletion >= 50
      ? "border-amber-200 bg-amber-50"
      : user.started > 0
      ? "border-blue-200 bg-blue-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border ${statusColor} overflow-hidden`}>
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/60 transition-colors"
      >
        {/* Avatar */}
        <div
          className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-black text-white"
          style={{ background: "#1E6FAE" }}
        >
          {(user.name || "?")[0].toUpperCase()}
        </div>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-sm text-slate-800 truncate">{user.name}</div>
          <div className="text-xs text-slate-500 truncate">{user.email}</div>
        </div>

        {/* Stats chips */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t("adminProgress2.stats.completion")}</div>
            <div className="text-sm font-extrabold text-slate-700">{user.avgCompletion}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t("adminProgress2.stats.passed")}</div>
            <div className="text-sm font-extrabold text-slate-700">
              {user.passed}/{user.totalModules}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t("adminProgress2.stats.avgScore")}</div>
            <div className="text-sm font-extrabold text-slate-700">
              {user.avgScore !== null ? `${user.avgScore}%` : "—"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t("adminProgress2.stats.lastActive")}</div>
            <div className="text-sm font-semibold text-slate-500">{fmtDate(user.lastActivity)}</div>
          </div>
        </div>

        {/* Mobile summary */}
        <div className="sm:hidden shrink-0 text-right">
          <div className="text-sm font-extrabold text-slate-700">{user.avgCompletion}%</div>
          <div className="text-xs text-slate-400">{user.passed}/{user.totalModules} passed</div>
        </div>

        <div className="shrink-0 ml-1 text-slate-400">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Module detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/60 px-4 py-3 bg-white/50">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wide">
                      <th className="text-left pb-2 font-semibold pr-4">{t("adminProgress2.table.module")}</th>
                      <th className="text-left pb-2 font-semibold pr-4">{t("adminProgress2.table.completion")}</th>
                      <th className="text-center pb-2 font-semibold pr-4">{t("adminProgress2.table.bestScore")}</th>
                      <th className="text-center pb-2 font-semibold pr-4">{t("adminProgress2.table.firstAttempt")}</th>
                      <th className="text-left pb-2 font-semibold">{t("adminProgress2.table.lastAccess")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {user.moduleProgress.map((m) => (
                      <tr key={m.moduleId} className="hover:bg-white/60">
                        <td className="py-2 pr-4">
                          <div className="font-semibold text-slate-700 truncate max-w-[180px]">
                            {m.title}
                          </div>
                          {m.required && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                              {t("adminProgress2.required")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 min-w-[120px]">
                          <CompletionBar value={m.completionRate} />
                        </td>
                        <td className="py-2 pr-4 text-center">
                          <ScorePill score={m.quizScore} />
                        </td>
                        <td className="py-2 pr-4 text-center">
                          <ScorePill score={m.firstAttemptScore} />
                        </td>
                        <td className="py-2 text-slate-400">{fmtDate(m.lastAccessed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AdminProgressPage() {
  const { t } = useTranslation();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [sortBy, setSortBy]   = useState("name"); // name | completion | passed | activity

  useEffect(() => {
    apiFetch("/api/admin/progress")
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // Global stats
  const globalStats = useMemo(() => {
    if (!data) return null;
    const users = data.users;
    const total = users.length;
    const activeThisWeek = users.filter((u) => {
      if (!u.lastActivity) return false;
      return Date.now() - new Date(u.lastActivity) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const avgCompletion = total
      ? Math.round(users.reduce((s, u) => s + u.avgCompletion, 0) / total)
      : 0;
    const fullyPassed = users.filter(
      (u) => u.passed === u.totalModules && u.totalModules > 0
    ).length;
    return { total, activeThisWeek, avgCompletion, fullyPassed };
  }, [data]);

  // Filtered + sorted users
  const visibleUsers = useMemo(() => {
    if (!data) return [];
    let list = data.users;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "completion") return b.avgCompletion - a.avgCompletion;
      if (sortBy === "passed") return b.passed - a.passed;
      if (sortBy === "activity") {
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      }
      return a.name.localeCompare(b.name);
    });
  }, [data, search, sortBy]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="card p-6 animate-pulse h-32" />
        <div className="card p-6 animate-pulse h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow={t("adminProgress2.eyebrow")}
        title={t("adminProgress2.title")}
        subtitle={t("adminProgress2.subtitle")}
      />

      {/* Global stats */}
      {globalStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: Users,
              label: t("adminProgress2.globalStats.activeUsers"),
              value: globalStats.total,
              color: "#1E6FAE",
              bg: "#EFF6FF",
            },
            {
              icon: Clock,
              label: t("adminProgress2.globalStats.activeThisWeek"),
              value: globalStats.activeThisWeek,
              color: "#F59E0B",
              bg: "#FFFBEB",
            },
            {
              icon: TrendingUp,
              label: t("adminProgress2.globalStats.avgCompletion"),
              value: `${globalStats.avgCompletion}%`,
              color: "#3B82F6",
              bg: "#EFF6FF",
            },
            {
              icon: Award,
              label: t("adminProgress2.globalStats.allModulesPassed"),
              value: globalStats.fullyPassed,
              color: "#22C55E",
              bg: "#F0FDF4",
            },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col items-center justify-center gap-2 p-4 text-center"
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: s.bg }}
              >
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* User list */}
      <div className="card p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-soft transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">{t("adminProgress2.sort")}:</span>
            {[
              { key: "name", label: t("adminProgress2.sortOptions.name") },
              { key: "completion", label: t("adminProgress2.sortOptions.completion") },
              { key: "passed", label: t("adminProgress2.sortOptions.passed") },
              { key: "activity", label: t("adminProgress2.sortOptions.recent") },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sortBy === opt.key
                    ? "bg-brand-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 ml-auto">
            {visibleUsers.length} user{visibleUsers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* User rows */}
        <div className="space-y-2">
          {visibleUsers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">{t("adminProgress2.noUsers")}</p>
          ) : (
            visibleUsers.map((u) => <UserRow key={u.id} user={u} />)
          )}
        </div>
      </div>
    </div>
  );
}
