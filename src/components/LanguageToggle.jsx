import React from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const isEs = i18n.language?.startsWith("es");

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem("autotech_lang", lng);
    } catch {}
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
      <Languages className="h-4 w-4 text-slate-500" />
      <button
        className={isEs ? "text-slate-500 hover:text-slate-700" : "text-slate-900"}
        onClick={() => setLang("en")}
        type="button"
      >
        {t("common.english")}
      </button>
      <span className="text-slate-300">|</span>
      <button
        className={isEs ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
        onClick={() => setLang("es")}
        type="button"
      >
        {t("common.spanish")}
      </button>
    </div>
  );
}
