import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "../components/LanguageToggle";

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("pages.settingsTitle")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("settings.languageHelp")}</p>
      <div className="mt-4">
        <LanguageToggle />
      </div>
    </div>
  );
}
