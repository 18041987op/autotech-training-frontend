import React from "react";
import { useTranslation } from "react-i18next";

export function SimplePage({ titleKey }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("common.comingSoon")}</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{t(titleKey)}</h1>
      <p className="mt-3 text-sm text-slate-600">
        Option A: layout + navigation + i18n only. Next step is wiring real data and role rules.
      </p>
    </div>
  );
}
