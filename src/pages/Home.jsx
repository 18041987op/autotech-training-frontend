import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, GraduationCap, Layers, Shield, Sparkles } from "lucide-react";

const Card = ({ icon: Icon, title, blurb }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <h3 className="mt-4 text-base font-extrabold">{title}</h3>
    <p className="mt-2 text-sm text-slate-600">{blurb}</p>
    <button
      type="button"
      className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
    >
      View <ArrowRight className="h-4 w-4" />
    </button>
  </div>
);

export function Home({ user }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("home.title")}</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{t("home.headline")}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Demo view for <span className="font-semibold">{user?.role}</span>. Next we’ll personalize by role + onboarding stage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title={t("home.cards.requiredThisWeek")} blurb={t("home.blurbRequired")} icon={Layers} />
        <Card title={t("home.cards.onboarding")} blurb={t("home.blurbOnboarding")} icon={BookOpen} />
        <Card title={t("home.cards.training")} blurb={t("home.blurbTraining")} icon={GraduationCap} />
        <Card title={t("home.cards.culture")} blurb={t("home.blurbCulture")} icon={Shield} />
        <Card title={t("home.cards.evaluations")} blurb={t("home.blurbEvaluations")} icon={Sparkles} />
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5">
          <p className="text-sm font-extrabold">Next: data wiring</p>
          <p className="mt-2 text-sm text-slate-600">
            When you’re ready, we’ll plug in modules/resources/progress and replace demo content.
          </p>
        </div>
      </div>
    </div>
  );
}
