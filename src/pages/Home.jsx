import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, GraduationCap, Layers, Shield, Sparkles } from "lucide-react";

function Card({ icon: Icon, title, blurb, to }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{blurb}</p>
      <button
        onClick={() => navigate(to)}
        className="mt-4 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
      >
        {t("common.view")} →
      </button>
    </div>
  );
}

export function Home({ user }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold">{t("home.headline")}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {user?.role === "technician"
            ? t("home.subtextTechnician")
            : t("home.subtextAdmin")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          icon={Layers}
          title={t("home.cards.requiredThisWeek")}
          blurb={t("home.blurbRequired")}
          to="/assessments"
        />
        <Card
          icon={BookOpen}
          title={t("home.cards.onboarding")}
          blurb={t("home.blurbOnboarding")}
          to="/onboarding"
        />
        <Card
          icon={GraduationCap}
          title={t("home.cards.training")}
          blurb={t("home.blurbTraining")}
          to="/training"
        />
        <Card
          icon={Shield}
          title={t("home.cards.culture")}
          blurb={t("home.blurbCulture")}
          to="/culture"
        />
        <Card
          icon={Sparkles}
          title={t("home.cards.evaluations")}
          blurb={t("home.blurbEvaluations")}
          to="/assessments"
        />
      </div>
    </div>
  );
}
