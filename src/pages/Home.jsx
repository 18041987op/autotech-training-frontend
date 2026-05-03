import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Shield,
  TrendingUp,
  CheckCircle2,
  Target,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useProgress, useProgressBadges } from "../hooks/useProgress";
import {
  BADGE_ANIMATIONS,
  ALL_BADGE_IDS,
  AnimatedBadge,
} from "../components/BadgeSystem";
import { PayrollMetricsCard } from "../components/PayrollMetricsCard";
import { usePayrollMetrics } from "../hooks/usePayrollMetrics";
import { useAuthStore } from "../stores/authStore";

// Persist show/hide preference in localStorage
const METRICS_PREF_KEY = "home_show_payroll_metrics";

// ── Helpers ────────────────────────────────────────────────────────────────────
function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "home.greeting";
  if (h < 17) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

function getFirstName(name) {
  if (!name) return "";
  return name.split(" ")[0];
}

// ── Card data (4 action cards) ────────────────────────────────────────────────
const CARD_DATA = [
  {
    icon: GraduationCap,
    titleKey: "home.cards.training",
    blurbKey: "home.blurbTraining",
    to: "/training",
    iconBg: "#EFF6FF",
    iconColor: "#1E6FAE",
    borderAccent: "#1E6FAE",
  },
  {
    icon: Layers,
    titleKey: "home.cards.requiredThisWeek",
    blurbKey: "home.blurbRequired",
    to: "/assessments",
    iconBg: "#FFFBEB",
    iconColor: "#F7941D",
    borderAccent: "#F7941D",
  },
  {
    icon: BookOpen,
    titleKey: "home.cards.onboarding",
    blurbKey: "home.blurbOnboarding",
    to: "/onboarding",
    iconBg: "#F0FDF4",
    iconColor: "#22C55E",
    borderAccent: "#22C55E",
  },
  {
    icon: Shield,
    titleKey: "home.cards.culture",
    blurbKey: "home.blurbCulture",
    to: "/culture",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    borderAccent: "#7C3AED",
  },
];

// ── Stat data builder ─────────────────────────────────────────────────────────
function buildStats(progressData, badgesData, t) {
  const rows = progressData?.progress || [];
  const started = rows.length;
  const avgCompletion =
    started === 0
      ? 0
      : Math.round(
          rows.reduce((s, p) => s + (p.completion_rate || 0), 0) / started
        );
  const passed = rows.filter((p) => (p.quiz_score || 0) >= 70).length;
  const firstTryRows = rows.filter(
    (p) => typeof p.first_attempt_score === "number"
  );
  const avgFirstTry =
    firstTryRows.length === 0
      ? null
      : Math.round(
          firstTryRows.reduce((s, p) => s + p.first_attempt_score, 0) /
            firstTryRows.length
        );
  const badges = badgesData?.badges || [];
  const earnedCount = badges.length;

  return [
    {
      icon: TrendingUp,
      value: `${avgCompletion}%`,
      label: t("home.statsCompletion"),
      iconBg: "#EFF6FF",
      iconColor: "#1E6FAE",
      numberColor: "#1E6FAE",
    },
    {
      icon: CheckCircle2,
      value: passed,
      label: t("home.statsPassed"),
      iconBg: "#F0FDF4",
      iconColor: "#22C55E",
      numberColor: "#22C55E",
    },
    {
      icon: Target,
      value: avgFirstTry !== null ? `${avgFirstTry}%` : "\u2014",
      label: t("home.statsFirstTry"),
      iconBg: "#FFFBEB",
      iconColor: "#F59E0B",
      numberColor: "#F59E0B",
    },
    {
      icon: Award,
      value: `${earnedCount}/${ALL_BADGE_IDS.length}`,
      label: t("home.statsBadges"),
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
      numberColor: "#7C3AED",
    },
  ];
}

// ── Framer-motion variants for staggered stats ────────────────────────────────
const statsContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const statsItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ── HeroBanner ────────────────────────────────────────────────────────────────
function HeroBanner({ user, t, navigate }) {
  const firstName = getFirstName(user?.name);
  const greetingKey = getGreetingKey();
  const isAdmin = user?.role === "admin";
  const isAdministrative = user?.role?.toLowerCase() === "administrative";
  const isSA =
    user?.role === "serviceadvisor" || user?.role === "serviceAdvisor";

  const roleSubtitleKey = isAdmin
    ? "home.roleSubtitleAdmin"
    : isAdministrative
    ? "home.roleSubtitleAdministrative"
    : isSA
    ? "home.roleSubtitleSA"
    : "home.roleSubtitleTech";

  const initials = firstName
    ? firstName[0].toUpperCase()
    : (user?.name || "U")[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl"
      style={{
        background:
          "linear-gradient(135deg, #0f3460 0%, #1E6FAE 55%, #2a9fd6 100%)",
      }}
    >
      {/* Dot-grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 pt-7 pb-14 sm:px-8 sm:pt-8 sm:pb-16">
        <div className="flex items-start justify-between gap-4">
          {/* Left: brand pill + greeting + CTA */}
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 mb-3 backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                AutoRx Training
              </span>
              <span className="text-white/30 text-[10px]">·</span>
              <span className="text-[10px] font-medium italic text-white/55 tracking-wide">
                {t("appSlogan")}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white leading-tight sm:text-3xl">
              {firstName
                ? t(greetingKey, { firstName })
                : t("home.greetingAdmin", {
                    firstName: user?.name || "there",
                  })}
            </h1>

            <p className="mt-1 text-sm font-medium text-white/70">
              {t(roleSubtitleKey)}
            </p>

            <button
              onClick={() => navigate("/training")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5
                         text-sm font-bold text-white shadow-md
                         transition-all duration-200 active:scale-95"
              style={{ background: "#F7941D" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#e07d0e")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#F7941D")
              }
            >
              {t("home.continueLearning")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right: avatar initials */}
          <div
            className="shrink-0 h-14 w-14 rounded-full flex items-center justify-center
                       text-xl font-black text-white shadow-lg select-none"
            style={{ background: "rgba(247,148,29,0.85)" }}
            aria-label={user?.name}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Wave — fill uses CSS var so it matches the page surface in light + dark */}
      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg
          viewBox="0 0 1200 48"
          preserveAspectRatio="none"
          className="w-full h-8"
          aria-hidden="true"
        >
          <path
            d="M0,24 C150,48 350,0 600,24 C850,48 1050,0 1200,24 L1200,48 L0,48 Z"
            style={{ fill: "var(--surface, #ffffff)" }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

// ── StatsGrid ─────────────────────────────────────────────────────────────────
function StatsGrid({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} height="h-24" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={statsContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={statsItem}
          className="card flex flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <div
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: s.iconBg }}
          >
            <s.icon className="h-5 w-5" style={{ color: s.iconColor }} />
          </div>

          <div
            className="text-2xl font-extrabold leading-none"
            style={{ color: s.numberColor }}
          >
            {s.value}
          </div>

          <div
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted, #94a3b8)" }}
          >
            {s.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── QuickActionCards ──────────────────────────────────────────────────────────
function QuickActionCards({ t, navigate }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARD_DATA.map((card, i) => (
        <motion.div
          key={card.to}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 * (i + 1) }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={() => navigate(card.to)}
          className="card cursor-pointer p-5 group"
          style={{ borderTop: `3px solid ${card.borderAccent}` }}
        >
          <div className="flex items-center justify-between">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl"
              style={{ background: card.iconBg }}
            >
              <card.icon
                className="h-5 w-5"
                style={{ color: card.iconColor }}
              />
            </div>
            <ArrowRight
              className="h-4 w-4 opacity-30 group-hover:opacity-80 transition-all duration-200 group-hover:translate-x-1"
              style={{ color: card.borderAccent }}
            />
          </div>

          <h3
            className="mt-4 font-extrabold text-sm"
            style={{ color: "var(--text-primary, #0f172a)" }}
          >
            {t(card.titleKey)}
          </h3>

          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{
              color: "var(--text-secondary, #475569)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {t(card.blurbKey)}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ── EarnedBadgesRow ───────────────────────────────────────────────────────────
function EarnedBadgesRow({ badgesData, isLoading, t, navigate }) {
  const badges = badgesData?.badges || [];

  if (isLoading) return <LoadingSkeleton height="h-16" />;
  if (badges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="card p-4"
    >
      <style>{BADGE_ANIMATIONS}</style>

      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted, #94a3b8)" }}
        >
          {t("badges.earnedSection")} 🎉
        </div>
        <button
          onClick={() => navigate("/progress")}
          className="text-xs font-semibold hover:underline transition-colors"
          style={{ color: "var(--text-secondary, #475569)" }}
        >
          {t("home.viewAllProgress")}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {badges.map((b) => (
          <AnimatedBadge key={b.badge_id} badge={b} isNew={false} t={t} />
        ))}
      </div>
    </motion.div>
  );
}

// ── PayrollMetricsWidget ──────────────────────────────────────────────────────
// Collapsible widget on the Home page. Toggle persisted in localStorage.
// Hidden entirely for the owner/super-admin (Osman) — production metrics
// don't apply to him; everyone else (including administrative) sees it.
function PayrollMetricsWidget({ t }) {
  const userRole = useAuthStore((s) => s.user?.role);
  const isOwner = (userRole || "").toLowerCase() === "admin";
  const { data: metricsData, isLoading } = usePayrollMetrics();

  const [show, setShow] = useState(() => {
    try {
      const stored = localStorage.getItem(METRICS_PREF_KEY);
      // Default to shown (true) unless explicitly set to "false"
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggle = () => {
    const next = !show;
    setShow(next);
    try { localStorage.setItem(METRICS_PREF_KEY, String(next)); } catch {}
  };

  // Owner/super-admin (Osman) — production metrics don't apply, hide widget.
  if (isOwner) return null;

  // Don't render anything while loading (avoids flash of "not linked")
  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      {/* Toggle row */}
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors mb-2 select-none"
      >
        {show ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {show ? t("payroll.hideMetrics") : t("payroll.showMetrics")}
      </button>

      {/* Card (compact mode on home) */}
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <PayrollMetricsCard metricsData={metricsData} compact />
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function Home({ user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: progressData, isLoading: progressLoading } = useProgress();
  const { data: badgesData, isLoading: badgesLoading } = useProgressBadges();

  const isLoading = progressLoading || badgesLoading;

  const stats = useMemo(
    () => buildStats(progressData, badgesData, t),
    [progressData, badgesData, t]
  );

  return (
    <div className="space-y-5">
      {/* 1 — Hero banner */}
      <HeroBanner user={user} t={t} navigate={navigate} />

      {/* 2 — Production metrics widget (collapsible, localStorage persisted) */}
      <PayrollMetricsWidget t={t} />

      {/* 3 — Stats grid */}
      <StatsGrid stats={stats} isLoading={isLoading} />

      {/* 4 — Quick action cards */}
      <QuickActionCards t={t} navigate={navigate} />

      {/* 5 — Earned badges (hidden when none) */}
      <EarnedBadgesRow
        badgesData={badgesData}
        isLoading={badgesLoading}
        t={t}
        navigate={navigate}
      />
    </div>
  );
}
