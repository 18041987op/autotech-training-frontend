import React from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Award, DollarSign, Car, Wrench, AlertCircle } from "lucide-react";

// ── Tier colour map ───────────────────────────────────────────────────────────
const TIER_STYLE = {
  Expert:     { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  Proficient: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  Developing: { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-300"    },
  Entry:      { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-300"   },
};

// ── Benchmark bar — shows value relative to benchmark tiers ──────────────────
function BenchmarkBar({ value, benchmarks, isMoney = false, isPercent = false }) {
  if (value == null) return null;

  const vals = Object.values(benchmarks);
  const max  = vals[vals.length - 1] * 1.1; // 10% headroom above expert
  const pct  = Math.min(100, Math.max(0, (value / max) * 100));

  // Calculate tick positions
  const ticks = Object.entries(benchmarks).map(([label, v]) => ({
    label,
    pct: Math.min(100, (v / max) * 100),
  }));

  const fmt = (v) => {
    if (isMoney) return `$${Math.round(v)}`;
    if (isPercent) return `${Math.round(v)}%`;
    return `${v}`;
  };

  return (
    <div className="mt-2">
      {/* Bar */}
      <div className="relative h-2.5 w-full rounded-full bg-slate-200 overflow-visible">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
          }}
        />
        {/* Tick marks */}
        {ticks.map((tick) => (
          <div
            key={tick.label}
            className="absolute top-0 bottom-0 w-px bg-slate-400/50"
            style={{ left: `${tick.pct}%` }}
          />
        ))}
      </div>

      {/* Benchmark labels */}
      <div className="relative mt-1 h-4">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className="absolute text-[9px] font-semibold text-slate-400 -translate-x-1/2"
            style={{ left: `${tick.pct}%` }}
          >
            {fmt(benchmarks[tick.label])}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color = "#1E6FAE" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 gap-1 text-center">
      <div
        className="grid h-8 w-8 place-items-center rounded-xl"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="text-xl font-extrabold text-slate-900 leading-none">{value ?? "—"}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PayrollMetricsCard({ metricsData, compact = false }) {
  const { t } = useTranslation();

  // Not linked to payroll
  if (!metricsData?.linked) {
    return (
      <div className="card p-5 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100">
          <AlertCircle className="h-5 w-5 text-slate-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-sm">{t("payroll.notLinked")}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t("payroll.notLinkedHint")}</p>
        </div>
      </div>
    );
  }

  const { employee, period, metrics, ranking, benchmarks } = metricsData;
  const isTech = employee?.is_tech;
  const tier   = metrics?.tier;
  const tierStyle = TIER_STYLE[tier] ?? TIER_STYLE.Entry;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ background: "#1E6FAE18" }}
          >
            {isTech ? (
              <Wrench className="h-4 w-4 text-[#1E6FAE]" />
            ) : (
              <TrendingUp className="h-4 w-4 text-[#1E6FAE]" />
            )}
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">{t("payroll.title")}</p>
            <p className="text-[10px] text-slate-500">{period?.label ?? t("payroll.period")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tier badge */}
          {tier && (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
              {t(`payroll.${tier.toLowerCase()}`)}
            </span>
          )}
          {/* Live badge */}
          <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            ● {t("payroll.linkedBadge")}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Primary metric with benchmark bar */}
        {isTech ? (
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("payroll.billedHours")}
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-4xl font-black text-slate-900 leading-none">
                    {metrics?.billed_hours ?? "—"}
                  </span>
                  <span className="text-sm text-slate-500">{t("payroll.hoursUnit")}</span>
                </div>
              </div>
              {ranking?.rank && (
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">{t("payroll.rank")}</p>
                  <p className="text-lg font-black text-slate-700">
                    #{ranking.rank}
                    <span className="text-xs font-medium text-slate-400 ml-1">
                      / {ranking.total_peers}
                    </span>
                  </p>
                </div>
              )}
            </div>
            {/* Benchmark bar */}
            {metrics?.billed_hours != null && (
              <BenchmarkBar
                value={metrics.billed_hours}
                benchmarks={benchmarks}
              />
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("payroll.closeRatio")}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {metrics?.close_ratio != null ? `${metrics.close_ratio}%` : "—"}
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
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("payroll.aro")}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {metrics?.aro != null ? `$${metrics.aro.toFixed(0)}` : "—"}
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
              <p className="mt-2 text-xs text-slate-500">
                {t("payroll.rank")}: <span className="font-bold text-slate-700">#{ranking.rank}</span>
                <span className="text-slate-400"> / {ranking.total_peers}</span>
              </p>
            )}
          </div>
        )}

        {/* Secondary stats row */}
        {!compact && (
          <div className={`grid gap-3 ${isTech ? "grid-cols-3" : "grid-cols-2"}`}>
            {isTech ? (
              <>
                <StatPill icon={DollarSign} label={t("payroll.laborSales")} value={metrics?.labor_sales != null ? `$${Math.round(metrics.labor_sales).toLocaleString()}` : "—"} color="#22c55e" />
                <StatPill icon={Wrench}     label={t("payroll.jobCount")}   value={metrics?.job_count ?? "—"} color="#f59e0b" />
                <StatPill icon={Award}      label={t("payroll.tier")}       value={tier ? t(`payroll.${tier.toLowerCase()}`) : "—"} color="#7c3aed" />
              </>
            ) : (
              <>
                <StatPill icon={DollarSign} label={t("payroll.totalSold")} value={metrics?.total_sold != null ? `$${Math.round(metrics.total_sold).toLocaleString()}` : "—"} color="#22c55e" />
                <StatPill icon={Car}        label={t("payroll.carCount")}  value={metrics?.car_count ?? "—"} color="#f59e0b" />
              </>
            )}
          </div>
        )}

        {/* Motivational message */}
        {metrics?.motivation && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {t("payroll.motivation")}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{metrics.motivation}</p>
          </div>
        )}

        {/* No data fallback */}
        {metrics?.billed_hours === null && metrics?.close_ratio === null && (
          <p className="text-sm text-slate-500 text-center py-2">{t("payroll.noDataThisPeriod")}</p>
        )}
      </div>
    </div>
  );
}
