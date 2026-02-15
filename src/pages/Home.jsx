import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, GraduationCap, Layers, Shield, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnimatedCard } from "../components/AnimatedCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useProgress } from '../hooks/useProgress';

const cardData = [
  { icon: Layers, titleKey: "home.cards.requiredThisWeek", blurbKey: "home.blurbRequired", to: "/assessments" },
  { icon: BookOpen, titleKey: "home.cards.onboarding", blurbKey: "home.blurbOnboarding", to: "/onboarding" },
  { icon: GraduationCap, titleKey: "home.cards.training", blurbKey: "home.blurbTraining", to: "/training" },
  { icon: Shield, titleKey: "home.cards.culture", blurbKey: "home.blurbCulture", to: "/culture" },
  { icon: Sparkles, titleKey: "home.cards.evaluations", blurbKey: "home.blurbEvaluations", to: "/assessments" },
];

export function Home({ user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: progressData, isLoading } = useProgress();

  const chartData = useMemo(() => {
    if (!progressData?.progress) return [];
    return progressData.progress.map(p => ({
      name: p.modules?.title?.slice(0, 20) || 'Unknown',
      completion: p.completion_rate || 0,
      score: p.quiz_score || 0,
    })).slice(0, 6); // Limit to 6 modules for readability
  }, [progressData]);

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

      {/* Progress Chart */}
      {progressData?.progress && progressData.progress.length > 0 && (
        <AnimatedCard delay={0.1} className="card p-6">
          <h3 className="text-lg font-bold mb-4">📊 Your Progress</h3>
          {isLoading ? (
            <LoadingSkeleton height="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion" fill="#1E6FAE" name="Completion %" radius={[8, 8, 0, 0]} />
                <Bar dataKey="score" fill="#F7941D" name="Quiz Score" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnimatedCard>
      )}

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
