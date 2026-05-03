import React from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Award, DollarSign, Car, Wrench, AlertCircle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

// ── Tier colour map — matches app's badge patterns ────────────────────────────
const TIER_STYLE = {
  Expert:     { pill: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700" },
  Proficient: { pill: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700" },
  Developing: { pill: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700" },
  Entry:      { pill: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700" },
};

// ── Benchmark bar ──────────────────────────────────────────────────────────────
function BenchmarkBar({ value, benchmarks, isMoney = false, isPercent = false }) {
  if (value == null) return null;

  const vals = Object.values(benchmarks);
  const max  = vals[vals.length - 1] * 1.15;
  const pct  = Math.min(100, Math.max(0, (value / max) * 100));

  const ticks = Object.entries(benchmarks).map(([label, v]) => ({
    label,
    pct: Math.min(100, (v / max) * 100),
  }));

  const fmt = (v) => {
    if (isMoney)   return `$${Math.round(v)}`;
    if (isPercent) return `${Math.round(v)}%`;
    return `${v}`;
  };

  return (
    <div className="mt-2.5">
      <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-visible">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #1E6FAE 0%, #7c3aed 100%)",
          }}
        />
        {ticks.map((tick) => (
          <div
            key={tick.label}
            className="absolute top-0 bottom-0 w-px bg-slate-400/40 dark:bg-slate-500/50"
            style={{ left: `${tick.pct}%` }}
          />
        ))}
      </div>
      <div className="relative mt-1 h-4">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className="absolute text-[9px] font-semibold text-slate-400 dark:text-slate-500 -translate-x-1/2"
            style={{ left: `${tick.pct}%` }}
          >
            {fmt(benchmarks[tick.label])}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stat pill — matches app's TinyStat style ──────────────────────────────────
function StatPill({ icon: Icon, label, value, color = "#1E6FAE" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 gap-1 text-center">
      <div
        className="grid h-7 w-7 place-items-center rounded-xl"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-none">
        {value ?? "—"}
      </div>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PayrollMetricsCard({ metricsData, compact = false }) {
  const { t } = useTranslation();
  const userRole = useAuthStore((s) => s.user?.role);

  // Owner/super-admin (Osman) — production metrics don't apply, hide the card.
  if ((userRole || "").toLowerCase() === "admin") {
    return null;
  }

  // Not linked to payroll portal
  if (!metricsData?.linked) {
    return (
      <div className="card p-5 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-700">
          <AlertCircle className="h-4.5 w-4.5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("payroll.notLinked")}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t("payroll.notLinkedHint")}
          </p>
        </div>
      </div>
    );
  }

  const { employee, period, metrics, ranking, benchmarks } = metricsData;
  const isTech    = employee?.is_tech;
  const tier      = metrics?.tier;
  const tierStyle = TIER_STYLE[tier] ?? TIER_STYLE.Entry;
  const tierKey   = tier ? `payroll.${tier.toLowerCase()}` : null;

  return (
    <div className="card overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ background: "#1E6FAE18" }}
          >
            {isTech
              ? <Wrench   className="h-4 w-4 text-[#1E6FAE]" />
              : <TrendingUp className="h-4 w-4 text-[#1E6FAE]" />
            }
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("payroll.title")}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {period?.label ?? t("payroll.period")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Tier badge */}
          {tierKey && (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${tierStyle.pill}`}>
              {t(tierKey)}
            </span>
          )}
          {/* Live badge */}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <span className="text-emerald-500">●</span>
            {t("payroll.linkedBadge")}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 space-y-4">

        {/* Primary metric + benchmark bar */}
        {isTech ? (
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("payroll.billedHours")}
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                    {metrics?.billed_hours ?? "—"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t("payroll.hoursUnit")}
                  </span>
                </div>
              </div>
              {ranking?.rank && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("payroll.rank")}
                  </p>
                  <p className="text-base font-extrabold text-slate-700 dark:text-slate-300 leading-none mt-0.5">
                    #{ranking.rank}
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-1">
                      / {ranking.total_peers}
                    </span>
                  </p>
                </div>
              )}
            </div>
            {metrics?.billed_hours != null && (
              <BenchmarkBar value={metrics.billed_hours} benchmarks={benchmarks} />
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {/* Close Ratio */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("payroll.closeRatio")}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                    {metrics?.close_ratio != null ? `${Math.round(metrics.close_ratio)}%` : "—"}
                  </span>
                </div>
                {metrics?.close_ratio != null && (
                  <BenchmarkBar
                    value={metrics.close_ratio}
                    benchmarks={benchmarks.close_ratio}
                    isPercent
                  />
                )}
              </div>
              {/* ARO */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("payroll.aro")}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                    {metrics?.aro != null ? `$${Math.round(metrics.aro)}` : "—"}
                  </span>
                </div>
                {metrics?.aro != null && (
                  <BenchmarkBar
                    value={metrics.aro}
                    benchmarks={benchmarks.aro}
                    isMoney
                  />
                )}
              </div>
            </div>
            {ranking?.rank && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("payroll.rank")}:{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  #{ranking.rank}
                </span>
                <span className="text-slate-400 dark:text-slate-500"> / {ranking.total_peers}</span>
              </p>
            )}
          </div>
        )}

        {/* Secondary stats */}
        {!compact && (
          <div className={`grid gap-2.5 ${isTech ? "grid-cols-3" : "grid-cols-2"}`}>
            {isTech ? (
              <>
                <StatPill
                  icon={DollarSign}
                  label={t("payroll.laborSales")}
                  value={metrics?.labor_sales != null ? `$${Math.round(metrics.labor_sales).toLocaleString()}` : "—"}
                  color="#22c55e"
                />
                <StatPill
                  icon={Wrench}
                  label={t("payroll.jobCount")}
                  value={metrics?.job_count ?? "—"}
                  color="#f59e0b"
                />
                <StatPill
                  icon={Award}
                  label={t("payroll.tier")}
                  value={tierKey ? t(tierKey) : "—"}
                  color="#7c3aed"
                />
              </>
            ) : (
              <>
                <StatPill
                  icon={DollarSign}
                  label={t("payroll.totalSold")}
                  value={metrics?.total_sold != null ? `$${Math.round(metrics.total_sold).toLocaleString()}` : "—"}
                  color="#22c55e"
                />
                <StatPill
                  icon={Car}
                  label={t("payroll.carCount")}
                  value={metrics?.car_count ?? "—"}
                  color="#f59e0b"
                />
              </>
            )}
          </div>
        )}

        {/* Motivational message — matches app's info-box style */}
        {metrics?.motivation && (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
              {t("payroll.motivation")}
            </p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {metrics.motivation}
            </p>
          </div>
        )}

        {/* No data fallback */}
        {metrics?.billed_hours === null && metrics?.close_ratio === null && (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
            {t("payroll.noDataThisPeriod")}
          </p>
        )}
      </div>
    </div>
  );
}
