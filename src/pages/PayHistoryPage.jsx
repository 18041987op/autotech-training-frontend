import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Award, Flame,
  ChevronDown, ChevronUp, Trophy, Star,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot,
} from "recharts";
import { PageHero } from "../components/PageHero";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { usePayrollHistory } from "../hooks/usePayrollMetrics";

// ── Tier colours ──────────────────────────────────────────────────────────────
const TIER_PILL = {
  Expert:     "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",
  Proficient: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  Developing: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  Entry:      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
};
const TIER_RING = {
  Expert:     "#7c3aed",
  Proficient: "#10b981",
  Developing: "#3b82f6",
  Entry:      "#f59e0b",
};

// ── Medal helper ──────────────────────────────────────────────────────────────
function medal(pos) {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return `#${pos}`;
}

// ── Format a period label short: "Mar 1–7" ───────────────────────────────────
function shortPeriod(start, end) {
  if (!start) return "—";
  const s = new Date(start + "T12:00:00");
  const e = new Date(end   + "T12:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sm = months[s.getMonth()];
  const em = months[e.getMonth()];
  if (sm === em) return `${sm} ${s.getDate()}–${e.getDate()}`;
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}`;
}

// ── Trend ring SVG around current tier ───────────────────────────────────────
function TierRing({ tier, size = 100 }) {
  const color  = TIER_RING[tier] ?? TIER_RING.Entry;
  const r      = (size - 10) / 2;
  const circum = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5}
          className="dark:[stroke:#334155]" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={circum}
          initial={{ strokeDashoffset: circum }}
          animate={{ strokeDashoffset: circum * 0.15 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <Star className="h-5 w-5" style={{ color }} />
        <span className="text-[11px] font-extrabold" style={{ color }}>{tier ?? "—"}</span>
      </div>
    </div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isTech }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-0.5">{label}</p>
      <p className="text-[#1E6FAE] font-extrabold">
        {isTech ? `${v} hrs` : `${v}%`}
      </p>
    </div>
  );
}

// ── Anonymous leaderboard ─────────────────────────────────────────────────────
function Leaderboard({ leaderboard, isTech, t }) {
  const [expanded, setExpanded] = useState(false);
  if (!leaderboard?.length) return null;
  const visible = expanded ? leaderboard : leaderboard.slice(0, 5);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {t("history.leaderboard")}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("history.latestPeriod")}
        </span>
      </div>

      <div className="space-y-1.5">
        {visible.map((entry) => {
          const pct = Math.min(100, ((entry.value ?? 0) / (leaderboard[0]?.value || 1)) * 100);
          return (
            <motion.div
              key={entry.position}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: entry.position * 0.05 }}
              className={`relative flex items-center gap-3 rounded-2xl px-3 py-2 overflow-hidden
                ${entry.isYou
                  ? "bg-[#1E6FAE]/10 dark:bg-[#1E6FAE]/20 ring-1 ring-[#1E6FAE]/30"
                  : "bg-slate-50 dark:bg-slate-800/50"
                }`}
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 opacity-10 dark:opacity-20 rounded-2xl"
                style={{
                  width: `${pct}%`,
                  background: entry.isYou
                    ? "#1E6FAE"
                    : entry.position <= 3 ? "#f59e0b" : "#94a3b8",
                }}
              />

              {/* Rank */}
              <span className="relative text-sm font-extrabold w-7 text-center shrink-0
                text-slate-700 dark:text-slate-200">
                {medal(entry.position)}
              </span>

              {/* Name */}
              <span className={`relative text-xs font-semibold flex-1 truncate
                ${entry.isYou
                  ? "text-[#1E6FAE] dark:text-blue-300"
                  : "text-slate-600 dark:text-slate-300"
                }`}>
                {entry.isYou ? `⭐ ${t("history.you")}` : `${t("history.teammate")} ${entry.position}`}
              </span>

              {/* Value */}
              <span className={`relative text-xs font-extrabold shrink-0
                ${entry.isYou
                  ? "text-[#1E6FAE] dark:text-blue-300"
                  : "text-slate-700 dark:text-slate-200"
                }`}>
                {entry.value != null
                  ? isTech ? `${entry.value?.toFixed(1)} hrs` : `${Math.round(entry.value ?? 0)}%`
                  : "—"}
              </span>
            </motion.div>
          );
        })}
      </div>

      {leaderboard.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mx-auto"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? t("history.showLess") : t("history.showAll", { count: leaderboard.length })}
        </button>
      )}
    </div>
  );
}

// ── Period history card ───────────────────────────────────────────────────────
function PeriodCard({ item, isTech, t }) {
  const tier      = item.metrics?.tier;
  const tierCls   = TIER_PILL[tier] ?? TIER_PILL.Entry;
  const tierKey   = tier ? `payroll.${tier.toLowerCase()}` : null;
  const primary   = isTech ? item.metrics?.billed_hours : item.metrics?.close_ratio;
  const secondary = isTech ? null : item.metrics?.aro;
  const rankStr   = item.ranking?.rank
    ? `${medal(item.ranking.rank)} ${item.ranking.rank}/${item.ranking.total_peers}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 flex items-center gap-4 ${item.above_benchmark ? "" : "opacity-80"}`}
    >
      {/* Period label */}
      <div className="shrink-0 w-20 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">
          {shortPeriod(item.period?.start_date, item.period?.end_date).split(" ")[0]}
        </p>
        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
          {shortPeriod(item.period?.start_date, item.period?.end_date).replace(/^\w+\s/, "")}
        </p>
      </div>

      {/* Primary value */}
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {isTech ? t("payroll.billedHours") : t("payroll.closeRatio")}
        </p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
            {primary != null
              ? isTech ? primary : `${Math.round(primary)}%`
              : "—"}
          </span>
          {isTech && primary != null && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">hrs</span>
          )}
        </div>
        {!isTech && secondary != null && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            ARO ${Math.round(secondary)}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {tier && tierKey && (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${tierCls}`}>
            {t(tierKey)}
          </span>
        )}
        {rankStr && (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {rankStr}
          </span>
        )}
        {item.above_benchmark && (
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">✓ on track</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PayHistoryPage() {
  const { t }                    = useTranslation();
  const { data, isLoading }      = usePayrollHistory();

  const isTech       = data?.employee?.is_tech ?? true;
  const history      = useMemo(() => data?.history ?? [], [data]);
  const streak       = data?.streak ?? 0;
  const trend        = data?.trend ?? null;
  const latestItem   = history[0];
  const latestTier   = latestItem?.metrics?.tier ?? null;
  const latestRank   = latestItem?.ranking?.rank ?? null;
  const latestPeers  = latestItem?.ranking?.total_peers ?? null;
  const leaderboard  = latestItem?.ranking?.leaderboard ?? [];

  // Build chart data — reverse so oldest is left
  const chartData = useMemo(() => {
    return [...history].reverse().map((item) => ({
      label: shortPeriod(item.period?.start_date, item.period?.end_date),
      value: isTech
        ? item.metrics?.billed_hours
        : item.metrics?.close_ratio != null ? Math.round(item.metrics.close_ratio) : null,
    }));
  }, [history, isTech]);

  // Benchmark reference lines for chart
  const refLines = useMemo(() => {
    const benchmarks = data?.benchmarks ?? {};
    if (isTech) {
      return Object.entries(benchmarks).map(([label, v]) => ({ label, v }));
    }
    return Object.entries(benchmarks.close_ratio ?? {}).map(([label, v]) => ({ label, v }));
  }, [data, isTech]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data?.linked) {
    return (
      <div className="card p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("payroll.notLinked")}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("payroll.notLinkedHint")}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("payroll.noDataThisPeriod")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-x-hidden">

      {/* ── Page hero ──────────────────────────────────────────────────────── */}
      <PageHero
        eyebrow="AutoRx Training"
        title={t("history.title")}
        subtitle={t("history.subtitle")}
      />

      {/* ── Spotlight: Tier + Rank + Streak ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card p-5"
      >
        <div className="flex items-center gap-5">
          {/* Tier ring */}
          <TierRing tier={latestTier} size={88} />

          <div className="flex-1 space-y-3">
            {/* Rank callout */}
            {latestRank && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("history.teamPosition")}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
                  {medal(latestRank)}{" "}
                  <span className="text-[#1E6FAE]">#{latestRank}</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">
                    {t("history.outOf", { total: latestPeers })}
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isTech ? t("history.roleLabel.tech") : t("history.roleLabel.sa")}
                </p>
              </div>
            )}

            {/* Trend + Streak row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Trend */}
              {trend && (
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-bold
                  ${trend.direction === "up"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                    : trend.direction === "down"
                    ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {trend.direction === "up"   && <TrendingUp  className="h-3.5 w-3.5" />}
                  {trend.direction === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                  {trend.direction === "flat" && <Minus        className="h-3.5 w-3.5" />}
                  {trend.direction === "up"   ? t("history.trendUp",   { pct: trend.pct }) : null}
                  {trend.direction === "down" ? t("history.trendDown", { pct: trend.pct }) : null}
                  {trend.direction === "flat" ? t("history.trendFlat") : null}
                </div>
              )}

              {/* Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1 border
                  bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700
                  text-orange-700 dark:text-orange-300 text-xs font-bold">
                  <Flame className="h-3.5 w-3.5" />
                  {streak === 1
                    ? t("history.streak1")
                    : t("history.streakN", { n: streak })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Trend Chart ────────────────────────────────────────────────────── */}
      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-7 w-7 place-items-center rounded-xl"
              style={{ background: "#1E6FAE18" }}>
              <TrendingUp className="h-3.5 w-3.5 text-[#1E6FAE]" />
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("history.trendChart")}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: "inherit" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: "inherit" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip isTech={isTech} />} />

              {/* Benchmark reference lines */}
              {refLines.map(({ label, v }) => (
                <ReferenceLine
                  key={label}
                  y={v}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: label,
                    position: "insideTopRight",
                    fontSize: 8,
                    fill: "#94a3b8",
                    fontFamily: "inherit",
                  }}
                />
              ))}

              <Line
                type="monotone"
                dataKey="value"
                stroke="#1E6FAE"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.value == null) return null;
                  return (
                    <Dot
                      key={`dot-${cx}-${cy}`}
                      cx={cx} cy={cy} r={4}
                      fill="#1E6FAE" stroke="#ffffff" strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: "#1E6FAE", stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-1">
            {t("history.chartCaption", {
              metric: isTech ? t("payroll.billedHours") : t("payroll.closeRatio"),
            })}
          </p>
        </motion.div>
      )}

      {/* ── Leaderboard ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Leaderboard leaderboard={leaderboard} isTech={isTech} t={t} />
      </motion.div>

      {/* ── Period history list ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 px-1">
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Award className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {t("history.periodHistory")}
          </p>
        </div>

        {history.map((item, i) => (
          <motion.div
            key={item.period?.id ?? i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 + i * 0.04 }}
          >
            <PeriodCard item={item} isTech={isTech} t={t} />
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}
