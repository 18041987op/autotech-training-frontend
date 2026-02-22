import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, GraduationCap, Layers, Shield, Sparkles } from "lucide-react";
import { AnimatedCard } from "../components/AnimatedCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useProgress, useProgressBadges } from "../hooks/useProgress";
import { BADGE_ANIMATIONS, BADGE_DEF, ALL_BADGE_IDS, AnimatedBadge, LockedBadge } from "../components/BadgeSystem";

const cardData = [
  { icon: Layers,        titleKey: "home.cards.requiredThisWeek", blurbKey: "home.blurbRequired",    to: "/assessments" },
  { icon: BookOpen,      titleKey: "home.cards.onboarding",       blurbKey: "home.blurbOnboarding",  to: "/onboarding" },
  { icon: GraduationCap, titleKey: "home.cards.training",         blurbKey: "home.blurbTraining",    to: "/training" },
  { icon: Shield,        titleKey: "home.cards.culture",          blurbKey: "home.blurbCulture",     to: "/culture" },
  { icon: Sparkles,      titleKey: "home.cards.evaluations",      blurbKey: "home.blurbEvaluations", to: "/assessments" },
];

// ── Tiny stat pill ─────────────────────────────────────────────────────────────
function StatPill({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <div
        className="text-lg font-extrabold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

// ── Progress + Badges card ──────────────────────────────────────────────────────
function ProgressBadgeCard({ progressData, badgesData, isLoading, t, navigate }) {
  const badges = badgesData?.badges || [];
  const earnedIds = new Set(badges.map((b) => b.badge_id));
  const lockedIds = ALL_BADGE_IDS.filter((id) => !earnedIds.has(id));

  // Compute quick stats from progress
  const stats = useMemo(() => {
    const rows = progressData?.progress || [];
    const started = rows.length;
    const avgCompletion =
      started === 0
        ? 0
        : Math.round(rows.reduce((s, p) => s + (p.completion_rate || 0), 0) / started);
    const passed = rows.filter((p) => (p.quiz_score || 0) >= 70).length;
    const firstTryRows = rows.filter((p) => typeof p.first_attempt_score === "number");
    const avgFirstTry =
      firstTryRows.length === 0
        ? null
        : Math.round(firstTryRows.reduce((s, p) => s + p.first_attempt_score, 0) / firstTryRows.length);
    return { started, avgCompletion, passed, avgFirstTry };
  }, [progressData]);

  return (
    <AnimatedCard delay={0.1} className="card p-6">
      <style>{BADGE_ANIMATIONS}</style>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">{t("badges.homeTitle")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{t("badges.homeSubtitle")}</p>
        </div>
        <button
          onClick={() => navigate("/progress")}
          className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t("badges.viewAll")}
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton height="h-20" />
      ) : (
        <>
          {/* Mini stats */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill
              label={t("progress.avgCompletion")}
              value={`${stats.avgCompletion}%`}
              accent="#1E6FAE"
            />
            <StatPill
              label={t("progress.passed")}
              value={stats.passed}
              accent="#22C55E"
            />
            <StatPill
              label={t("progress.firstTryAccuracyAvg")}
              value={stats.avgFirstTry !== null ? `${stats.avgFirstTry}%` : "—"}
              accent="#F59E0B"
            />
            <StatPill
              label={t("badges.earnedCount", { count: earnedIds.size, total: ALL_BADGE_IDS.length })}
              value={`${earnedIds.size}/${ALL_BADGE_IDS.length}`}
              accent="#7C3AED"
            />
          </div>

          {/* Earned badges */}
          {badges.length > 0 && (
            <div className="mt-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                {t("badges.earnedSection")} 🎉
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <AnimatedBadge key={b.badge_id} badge={b} isNew={false} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* Locked badges */}
          {lockedIds.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                {t("badges.lockedSection")} 🔒
              </div>
              <div className="flex flex-wrap gap-2">
                {lockedIds.map((id) => (
                  <LockedBadge key={id} badgeId={id} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* No progress yet */}
          {stats.started === 0 && (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              {t("status.noneFound")}
            </div>
          )}
        </>
      )}
    </AnimatedCard>
  );
}

export function Home({ user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: progressData, isLoading: progressLoading } = useProgress();
  const { data: badgesData, isLoading: badgesLoading } = useProgressBadges();

  const isLoading = progressLoading || badgesLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <AnimatedCard className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold">{t("home.headline")}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {user?.role === "technician"
            ? t("home.subtextTechnician")
            : t("home.subtextAdmin")}
        </p>
      </AnimatedCard>

      {/* Progress + Badge card */}
      <ProgressBadgeCard
        progressData={progressData}
        badgesData={badgesData}
        isLoading={isLoading}
        t={t}
        navigate={navigate}
      />

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cardData.map((card, i) => (
          <AnimatedCard key={card.to} delay={0.1 * (i + 2)} className="card-interactive p-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-primary">
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-extrabold">{t(card.titleKey)}</h3>
            <p className="mt-2 text-sm text-slate-600">{t(card.blurbKey)}</p>
            <button
              onClick={() => navigate(card.to)}
              className="mt-4 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              {t("common.view")} →
            </button>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
