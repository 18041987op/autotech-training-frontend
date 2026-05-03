/**
 * MyScorecardPage — combines My Progress + My Production into one motivating view.
 *
 * Sections:
 *  1. PlayerHero   – tier ring, name, rank, streak, trend, next-tier progress bar
 *  2. Split panel  – Training (left) + Production (right) side-by-side on desktop
 *  3. Compensation – actual $ vs benchmark $ vs shop goal $ (new)
 *  4. Badges row
 *  5. Leaderboard  – collapsible
 *  6. Period history list
 */

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Award, Flame,
  ChevronDown, ChevronUp, Trophy, Star, DollarSign,
  Zap, Target, BookOpen,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot,
} from "recharts";

import { apiFetch } from "../lib/api";
import { BADGE_ANIMATIONS, BadgeShelf } from "../components/BadgeSystem";
import { PageHero } from "../components/PageHero";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { WeeklyCheckInModal } from "../components/WeeklyCheckInModal";
import { usePayrollMetrics, usePayrollHistory, useCheckinPending } from "../hooks/usePayrollMetrics";
import { normalizeAllCaps } from "../lib/text";

// ── Tier colours ──────────────────────────────────────────────────────────────
const TIER_RING = {
  Expert:     "#7c3aed",
  Proficient: "#10b981",
  Developing: "#3b82f6",
  Entry:      "#f59e0b",
};
const TIER_PILL = {
  Expert:     "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",
  Proficient: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  Developing: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  Entry:      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
};

// Next tier labels for the progress bar hint
const NEXT_TIER = {
  Entry:      "Developing",
  Developing: "Proficient",
  Proficient: "Expert",
  Expert:     null,
};

// ── Small helpers ─────────────────────────────────────────────────────────────
function medal(pos) {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return `#${pos}`;
}

function fmt$(n) {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString();
}

function fmtHrs(n) {
  if (n == null) return "—";
  return Number(n).toFixed(1) + " hrs";
}

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

function clampPct(n) {
  const v = Number(n || 0);
  return Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
}

// ── Tier ring SVG ─────────────────────────────────────────────────────────────
function TierRing({ tier, size = 100 }) {
  const color  = TIER_RING[tier] ?? TIER_RING.Entry;
  const r      = (size - 10) / 2;
  const circum = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0"
          strokeWidth={5} className="dark:[stroke:#334155]" />
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

// ── Compact progress bar toward next tier ────────────────────────────────────
function NextTierBar({ isTech, currentMetrics, benchmarks }) {
  const tier = currentMetrics?.tier;
  const next = NEXT_TIER[tier];
  if (!next || !tier) return null;

  let pct = 0;
  let label = "";
  let gapLabel = "";

  if (isTech) {
    const hours   = currentMetrics?.billed_hours ?? 0;
    const targets = { Developing: benchmarks?.developing, Proficient: benchmarks?.proficient, Expert: benchmarks?.expert };
    const prev    = { Developing: benchmarks?.entry ?? 0, Proficient: benchmarks?.developing, Expert: benchmarks?.proficient };
    const target  = targets[next] ?? 0;
    const from    = prev[next] ?? 0;
    pct = target > from ? Math.min(100, ((hours - from) / (target - from)) * 100) : 0;
    const gap = Math.max(0, target - hours);
    label = `${next} (${target} hrs)`;
    gapLabel = gap > 0 ? `${gap.toFixed(1)} more hrs to ${next}` : `You're at ${next}!`;
  } else {
    const cr   = currentMetrics?.close_ratio ?? 0;
    const targets = { Developing: 35, Proficient: 55, Expert: 70 };
    const prev    = { Developing: 0,  Proficient: 35, Expert: 55 };
    const target  = targets[next] ?? 0;
    const from    = prev[next]   ?? 0;
    pct = target > from ? Math.min(100, ((cr - from) / (target - from)) * 100) : 0;
    const gap = Math.max(0, target - cr);
    label = `${next} (${target}% CR)`;
    gapLabel = gap > 0 ? `${gap.toFixed(1)}% close ratio to ${next}` : `You're at ${next}!`;
  }

  const color = TIER_RING[next] ?? TIER_RING.Entry;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Next: {label}
        </p>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {Math.round(Math.max(0, pct))}%
        </p>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, pct)}%` }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.5 }}
        />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{gapLabel}</p>
    </div>
  );
}

// ── Compensation panel ────────────────────────────────────────────────────────
function CompensationPanel({ isTech, compensation, t }) {
  if (!compensation) return null;
  const hasData = isTech
    ? compensation.gross_pay != null
    : compensation.base_salary != null;
  if (!hasData) return null;

  if (isTech) {
    const { base_rate, base_pay, commission, gross_pay,
            at_developing_pay, at_proficient_pay, at_expert_pay, at_shop_goal_pay,
            shop_goal_hours, billed_hours } = compensation;

    const projections = [
      { label: "Developing",  hours: 32,              pay: at_developing_pay,  color: TIER_RING.Developing },
      { label: "Proficient",  hours: 42,              pay: at_proficient_pay,  color: TIER_RING.Proficient },
      { label: "Expert",      hours: 52,              pay: at_expert_pay,      color: TIER_RING.Expert },
      { label: "Shop Goal",   hours: shop_goal_hours, pay: at_shop_goal_pay,   color: "#1E6FAE" },
    ].filter((p) => p.pay != null);

    const maxPay = Math.max(gross_pay ?? 0, ...projections.map((p) => p.pay ?? 0));

    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("scorecard.compensation")}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t("scorecard.compensationSubtitle")}
            </p>
          </div>
        </div>

        {/* Current earnings */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
              {t("scorecard.basePay")}
            </p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{fmt$(base_pay)}</p>
            {base_rate && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                {fmtHrs(billed_hours)} × ${base_rate}/hr
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
              {t("scorecard.commission")}
            </p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{fmt$(commission)}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">{t("scorecard.thisperiod")}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-0.5">
              {t("scorecard.grossPay")}
            </p>
            <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{fmt$(gross_pay)}</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">{t("scorecard.total")}</p>
          </div>
        </div>

        {/* What you'd earn at each tier */}
        {projections.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
              {t("scorecard.earnAtTier")}
            </p>
            <div className="space-y-2">
              {projections.map((p) => {
                const barPct = maxPay > 0 ? (p.pay / maxPay) * 100 : 0;
                const isShopGoal = p.label === "Shop Goal";
                return (
                  <div key={p.label} className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold w-20 shrink-0 ${
                      isShopGoal ? "text-[#1E6FAE]" : ""
                    }`} style={!isShopGoal ? { color: p.color } : {}}>
                      {isShopGoal ? `🎯 ${p.label}` : p.label}
                      {p.hours != null && (
                        <span className="block font-normal text-slate-400 dark:text-slate-500">
                          {p.hours} hrs
                        </span>
                      )}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 w-16 text-right">
                      {fmt$(p.pay)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2">
              {t("scorecard.projectionNote")}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── SA / Admin / Coordinator compensation ────────────────────────────────
  const {
    base_salary, base_rate, hours_worked, work_days, hours_per_day,
    commission: saCommission, gross_pay: saGrossPay,
    total_sold, car_count, actual_aro,
    at_proficient_sold, at_expert_sold, at_shop_goal_sold,
    shop_aro_target, shop_close_ratio_target,
  } = compensation;

  const soldProjections = [
    { label: "Proficient",    sold: at_proficient_sold,  aro: 320,            color: TIER_RING.Proficient },
    { label: "Expert",        sold: at_expert_sold,      aro: 520,            color: TIER_RING.Expert },
    { label: "Shop Goal ARO", sold: at_shop_goal_sold,   aro: shop_aro_target, color: "#1E6FAE" },
  ].filter((p) => p.sold != null);

  const maxSold = Math.max(total_sold ?? 0, ...soldProjections.map((p) => p.sold ?? 0));

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {t("scorecard.compensation")}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {t("scorecard.saCompSubtitle")}
          </p>
        </div>
      </div>

      {/* Current pay breakdown: base salary + commission + gross */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
            {t("scorecard.baseSalary")}
          </p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{fmt$(base_salary)}</p>
          {base_rate != null && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500">
              {hours_worked != null
                ? `$${base_rate}/hr × ${hours_worked}h`
                : `$${base_rate}/hr × ${hours_per_day ?? 8}h × ${work_days}d`}
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
            {t("scorecard.commission")}
          </p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{fmt$(saCommission)}</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500">{t("scorecard.thisperiod")}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-0.5">
            {t("scorecard.grossPay")}
          </p>
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{fmt$(saGrossPay)}</p>
          <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">{t("scorecard.total")}</p>
        </div>
      </div>

      {/* Production stats */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
          {t("scorecard.totalSold")}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{fmt$(total_sold)}</p>
          {car_count != null && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {car_count} cars · ${actual_aro ?? 0} ARO
            </p>
          )}
        </div>
      </div>

      {/* Shop targets row */}
      {(shop_aro_target != null || shop_close_ratio_target != null) && (
        <div className="flex flex-wrap gap-2">
          {shop_aro_target != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#1E6FAE]/30 bg-[#1E6FAE]/5 dark:bg-[#1E6FAE]/10 px-2.5 py-1 text-[10px] font-semibold text-[#1E6FAE]">
              <Target className="h-3 w-3" />
              Target ARO: ${shop_aro_target}
            </span>
          )}
          {shop_close_ratio_target != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Target CR: {shop_close_ratio_target}%
            </span>
          )}
        </div>
      )}

      {/* Sold projections — same car count, different ARO */}
      {soldProjections.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
            {t("scorecard.soldAtTier")} ({car_count} cars)
          </p>
          <div className="space-y-2">
            {soldProjections.map((p) => {
              const barPct = maxSold > 0 ? (p.sold / maxSold) * 100 : 0;
              const isShop = p.label === "Shop Goal ARO";
              return (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-24 shrink-0"
                    style={{ color: p.color }}>
                    {isShop ? "🎯 " : ""}{p.label}
                    {p.aro != null && (
                      <span className="block font-normal text-slate-400 dark:text-slate-500">
                        ${p.aro} ARO
                      </span>
                    )}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: p.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 w-16 text-right">
                    {fmt$(p.sold)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2">
            {t("scorecard.soldProjectionNote")}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard (collapsible) ─────────────────────────────────────────────────
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
                  : "bg-slate-50 dark:bg-slate-800/50"}`}
            >
              <div
                className="absolute inset-0 opacity-10 dark:opacity-20 rounded-2xl"
                style={{
                  width: `${pct}%`,
                  background: entry.isYou ? "#1E6FAE" : entry.position <= 3 ? "#f59e0b" : "#94a3b8",
                }}
              />
              <span className="relative text-sm font-extrabold w-7 text-center shrink-0 text-slate-700 dark:text-slate-200">
                {medal(entry.position)}
              </span>
              <span className={`relative text-xs font-semibold flex-1 truncate ${
                entry.isYou ? "text-[#1E6FAE] dark:text-blue-300" : "text-slate-600 dark:text-slate-300"}`}>
                {entry.isYou ? `⭐ ${t("history.you")}` : `${t("history.teammate")} ${entry.position}`}
              </span>
              <span className={`relative text-xs font-extrabold shrink-0 ${
                entry.isYou ? "text-[#1E6FAE] dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>
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
  const secondary = isTech
    ? item.compensation?.gross_pay
    : item.metrics?.aro;
  const rankStr   = item.ranking?.rank
    ? `${medal(item.ranking.rank)} ${item.ranking.rank}/${item.ranking.total_peers}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 flex items-center gap-4 ${item.above_benchmark ? "" : "opacity-80"}`}
    >
      <div className="shrink-0 w-20 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">
          {shortPeriod(item.period?.start_date, item.period?.end_date).split(" ")[0]}
        </p>
        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
          {shortPeriod(item.period?.start_date, item.period?.end_date).replace(/^\w+\s/, "")}
        </p>
      </div>

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
        {secondary != null && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isTech ? `💵 ${fmt$(secondary)} gross` : `ARO $${Math.round(secondary)}`}
          </p>
        )}
      </div>

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

// ── Chart tooltip ─────────────────────────────────────────────────────────────
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

// ── MiniBar ───────────────────────────────────────────────────────────────────
function MiniBar({ pct }) {
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
      <div className="h-full bg-slate-900 dark:bg-slate-300" style={{ width: `${clampPct(pct)}%`, transition: "width 400ms ease" }} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function MyScorecardPage() {
  const { t }                         = useTranslation();
  const { data: metricsData }         = usePayrollMetrics();
  const { data: historyData, isLoading: histLoading } = usePayrollHistory();
  const { data: checkinData }         = useCheckinPending();

  const [progress, setProgress]       = useState([]);
  const [modulesWithAssess, setModulesWithAssess] = useState([]);
  const [badges, setBadges]           = useState([]);
  const [trainLoading, setTrainLoading] = useState(true);
  const [trainErr, setTrainErr]       = useState("");
  const [showCheckin, setShowCheckin] = useState(false);

  const isTech = metricsData?.employee?.is_tech ?? true;
  const linked = metricsData?.linked ?? false;

  // Check-in modal
  useEffect(() => {
    if (checkinData?.pending && metricsData?.linked) setShowCheckin(true);
  }, [checkinData, metricsData]);

  // Training data
  useEffect(() => {
    (async () => {
      try {
        setTrainErr("");
        setTrainLoading(true);
        const [p, a, b] = await Promise.all([
          apiFetch("/api/progress"),
          apiFetch("/api/assessments/user"),
          apiFetch("/api/progress/badges").catch(() => ({ badges: [] })),
        ]);
        setProgress(p.progress || []);
        setModulesWithAssess(a.modules || []);
        setBadges(b.badges || []);
      } catch (e) {
        setTrainErr(e.message || "Failed to load training data");
      } finally {
        setTrainLoading(false);
      }
    })();
  }, []);

  // ── Training summary ──────────────────────────────────────────────────────
  const eligibleModuleIds = useMemo(() => {
    const ids = new Set();
    for (const m of modulesWithAssess || []) {
      if ((m.assessments || []).length > 0) ids.add(m.id);
    }
    return ids;
  }, [modulesWithAssess]);

  const eligibleProgress = useMemo(() => {
    return (progress || []).filter((p) => {
      const mid = p.modules?.id || p.module_id || p.modules?.module_id;
      return mid && eligibleModuleIds.has(mid);
    });
  }, [progress, eligibleModuleIds]);

  const trainSummary = useMemo(() => {
    const assigned = (modulesWithAssess || []).filter((m) => (m.assessments || []).length > 0).length;
    const started  = eligibleProgress.length;
    const avgCompletion = started === 0
      ? 0
      : Math.round(eligibleProgress.reduce((s, p) => s + (p.completion_rate || 0), 0) / started);
    const passed = eligibleProgress.filter((p) => (p.quiz_score || 0) >= 70).length;
    const avgScore = started === 0
      ? null
      : Math.round(
          eligibleProgress
            .map((p) => typeof p.quiz_score === "number" ? p.quiz_score : null)
            .filter((v) => typeof v === "number")
            .reduce((s, v, _, a) => s + v / a.length, 0)
        );
    return { assigned, started, avgCompletion, passed, avgScore };
  }, [eligibleProgress, modulesWithAssess]);

  // ── History / production ──────────────────────────────────────────────────
  const history     = useMemo(() => historyData?.history ?? [], [historyData]);
  const streak      = historyData?.streak ?? 0;
  const trend       = historyData?.trend ?? null;
  const latestItem  = history[0];
  // LIVE current-week wins. History is only used as fallback if live data is
  // missing (e.g. brand-new employee with no production yet this week).
  const latestTier  = metricsData?.metrics?.tier ?? latestItem?.metrics?.tier ?? null;
  const latestRank  = metricsData?.ranking?.rank ?? latestItem?.ranking?.rank ?? null;
  const latestPeers = metricsData?.ranking?.total_peers ?? latestItem?.ranking?.total_peers ?? null;
  const leaderboard = latestItem?.ranking?.leaderboard ?? [];

  const chartData = useMemo(() => {
    return [...history].reverse().map((item) => ({
      label: shortPeriod(item.period?.start_date, item.period?.end_date),
      value: isTech
        ? item.metrics?.billed_hours
        : item.metrics?.close_ratio != null ? Math.round(item.metrics.close_ratio) : null,
    }));
  }, [history, isTech]);

  const refLines = useMemo(() => {
    const bm = historyData?.benchmarks ?? metricsData?.benchmarks ?? {};
    if (isTech) return Object.entries(bm).map(([label, v]) => ({ label, v }));
    return Object.entries(bm.close_ratio ?? {}).map(([label, v]) => ({ label, v }));
  }, [historyData, metricsData, isTech]);

  // Current period metrics for the next-tier bar
  const currentMetrics = metricsData?.metrics ?? null;
  const benchmarks     = metricsData?.benchmarks ?? {};
  const compensation   = metricsData?.compensation ?? null;

  if (histLoading && trainLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton /><LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-x-hidden">
      <style>{BADGE_ANIMATIONS}</style>

      {showCheckin && (
        <WeeklyCheckInModal
          isTech={isTech}
          onClose={() => setShowCheckin(false)}
        />
      )}

      <PageHero
        eyebrow="AutoRx Training"
        title={t("scorecard.title")}
        subtitle={t("scorecard.subtitle")}
      />

      {/* ── Section 1: PlayerHero ─────────────────────────────────────────── */}
      {linked && (latestTier || currentMetrics) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center gap-5">
            <TierRing tier={latestTier} size={88} />

            <div className="flex-1 space-y-2 min-w-0">
              {/* Rank */}
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

              {/* Trend + Streak */}
              <div className="flex items-center gap-2 flex-wrap">
                {trend && (
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-bold
                    ${trend.direction === "up"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                      : trend.direction === "down"
                      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}
                  >
                    {trend.direction === "up"   && <TrendingUp  className="h-3.5 w-3.5" />}
                    {trend.direction === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                    {trend.direction === "flat" && <Minus        className="h-3.5 w-3.5" />}
                    {trend.direction === "up"   ? t("history.trendUp",   { pct: trend.pct }) : null}
                    {trend.direction === "down" ? t("history.trendDown", { pct: trend.pct }) : null}
                    {trend.direction === "flat" ? t("history.trendFlat") : null}
                  </div>
                )}
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1 border
                    bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700
                    text-orange-700 dark:text-orange-300 text-xs font-bold">
                    <Flame className="h-3.5 w-3.5" />
                    {streak === 1 ? t("history.streak1") : t("history.streakN", { n: streak })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next-tier progress bar */}
          <NextTierBar isTech={isTech} currentMetrics={currentMetrics} benchmarks={benchmarks} />
        </motion.div>
      )}

      {/* ── Section 2: Training + Production split ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Training panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("scorecard.trainingPanel")}
            </p>
          </div>

          {trainLoading ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">{t("status.loading")}</div>
          ) : trainErr ? (
            <div className="text-xs text-red-500">{trainErr}</div>
          ) : trainSummary.assigned === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">{t("status.noneFound")}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: t("progress.summary.assignedModules"), val: trainSummary.assigned },
                  { label: t("progress.avgCompletion"),           val: `${trainSummary.avgCompletion}%` },
                  { label: t("progress.passed"),                  val: trainSummary.passed },
                  { label: t("payroll.tier"),                     val: trainSummary.avgScore != null ? `${trainSummary.avgScore}%` : "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{val}</p>
                  </div>
                ))}
              </div>

              {/* Overall completion bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {t("progress.avgCompletion")}
                  </p>
                  <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                    {trainSummary.avgCompletion}%
                  </p>
                </div>
                <MiniBar pct={trainSummary.avgCompletion} />
              </div>

              {/* Top 3 modules */}
              {eligibleProgress.slice(0, 3).map((p) => {
                const title = normalizeAllCaps(p.modules?.title || "Module");
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">{title}</p>
                      <MiniBar pct={p.completion_rate || 0} />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
                      {Math.round(p.completion_rate || 0)}%
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </motion.div>

        {/* Production panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="card p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("scorecard.productionPanel")}
            </p>
          </div>

          {!linked ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t("payroll.notLinked")}
            </div>
          ) : !currentMetrics ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t("payroll.noDataThisPeriod")}
            </div>
          ) : (
            <>
              {isTech ? (
                <div className="grid grid-cols-2 gap-2">
                  {/* Billed Hours */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{t("payroll.billedHours")}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {currentMetrics.billed_hours != null ? `${currentMetrics.billed_hours} hrs` : "—"}
                    </p>
                  </div>
                  {/* Labor Sales */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{t("payroll.laborSales")}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{fmt$(currentMetrics.labor_sales)}</p>
                  </div>
                  {/* Tier — colored by tier level */}
                  <div className={`rounded-2xl p-2.5 text-center border ${
                    currentMetrics.tier === "Expert"     ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700" :
                    currentMetrics.tier === "Proficient" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700" :
                    currentMetrics.tier === "Developing" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" :
                    "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
                  }`}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{
                      color: TIER_RING[currentMetrics.tier] ?? TIER_RING.Entry,
                      opacity: 0.7,
                    }}>{t("payroll.tier")}</p>
                    <p className="text-base font-extrabold" style={{ color: TIER_RING[currentMetrics.tier] ?? TIER_RING.Entry }}>
                      {currentMetrics.tier ?? "—"}
                    </p>
                  </div>
                  {/* Rank */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{t("payroll.rank")}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{latestRank ? `#${latestRank}` : "—"}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Close Ratio */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{t("payroll.closeRatio")}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {currentMetrics.close_ratio != null ? `${Math.round(currentMetrics.close_ratio)}%` : "—"}
                    </p>
                  </div>
                  {/* ARO */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{t("payroll.aro")}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {currentMetrics.aro != null ? `$${Math.round(currentMetrics.aro)}` : "—"}
                    </p>
                  </div>
                  {/* Tier — colored */}
                  <div className={`rounded-2xl p-2.5 text-center border ${
                    currentMetrics.tier === "Expert"     ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700" :
                    currentMetrics.tier === "Proficient" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700" :
                    currentMetrics.tier === "Developing" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" :
                    "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
                  }`}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{
                      color: TIER_RING[currentMetrics.tier] ?? TIER_RING.Entry,
                      opacity: 0.7,
                    }}>{t("payroll.tier")}</p>
                    <p className="text-base font-extrabold" style={{ color: TIER_RING[currentMetrics.tier] ?? TIER_RING.Entry }}>
                      {currentMetrics.tier ?? "—"}
                    </p>
                  </div>
                  {/* Cars */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{t("payroll.carCount")}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{currentMetrics.car_count ?? "—"}</p>
                  </div>
                </div>
              )}

              {/* Motivation message — colored red/orange when below benchmark */}
              {currentMetrics.motivation && (
                <p className={`text-xs italic pl-3 border-l-2 ${
                  currentMetrics.tier === "Entry"
                    ? "text-amber-700 dark:text-amber-400 border-amber-400"
                    : "text-slate-600 dark:text-slate-400 border-[#1E6FAE]"
                }`}>
                  {currentMetrics.motivation}
                </p>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* ── Section 3: Compensation ───────────────────────────────────────── */}
      {linked && compensation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <CompensationPanel isTech={isTech} compensation={compensation} t={t} />
        </motion.div>
      )}

      {/* ── Section 4: Trend Chart ────────────────────────────────────────── */}
      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-7 w-7 place-items-center rounded-xl" style={{ background: "#1E6FAE18" }}>
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
              {refLines.map(({ label, v }) => (
                <ReferenceLine key={label} y={v} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1}
                  label={{ value: label, position: "insideTopRight", fontSize: 8, fill: "#94a3b8", fontFamily: "inherit" }} />
              ))}
              <Line type="monotone" dataKey="value" stroke="#1E6FAE" strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.value == null) return null;
                  return <Dot key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#1E6FAE" stroke="#ffffff" strokeWidth={2} />;
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

      {/* ── Section 5: Badges ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="card p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-lg font-extrabold">{t("badges.title")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("badges.subtitle")}</p>
          </div>
          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {badges.length} / 5
          </span>
        </div>
        <BadgeShelf badges={badges} newBadgeIds={[]} t={t} showLocked={true} />
      </motion.div>

      {/* ── Section 6: Leaderboard ────────────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Leaderboard leaderboard={leaderboard} isTech={isTech} t={t} />
        </motion.div>
      )}

      {/* ── Section 7: Period history ─────────────────────────────────────── */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
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
              transition={{ delay: 0.24 + i * 0.04 }}
            >
              <PeriodCard item={item} isTech={isTech} t={t} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
