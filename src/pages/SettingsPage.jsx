import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router-dom";
import { Users, FolderKanban, BarChart2 } from "lucide-react";

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "es" : "en";

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem("autotech_lang", lng); } catch {}
  };

  return (
    <div className="flex gap-2 mt-4">
      {LANGUAGES.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLang(lang.code)}
            className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all
              ${active
                ? "border-brand-primary bg-brand-soft text-brand-primary"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:text-brand-primary"
              }`}
          >
            <span className="text-xl leading-none">{lang.flag}</span>
            <span>{lang.label}</span>
            {active && (
              <span className="ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-primary text-white">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useOutletContext();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-5">
      {/* Language */}
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("pages.settingsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("settings.languageHelp")}</p>
        <LanguageSelector />
      </div>

      {/* Admin tools */}
      {isAdmin && (
        <div className="card p-6">
          <h2 className="text-lg font-extrabold">{t("settings.adminToolsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("settings.adminToolsSubtitle")}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Link
              to="/admin/users"
              className="card p-4 flex items-start gap-3 transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
            >
              <div className="shrink-0 h-9 w-9 rounded-xl bg-brand-soft flex items-center justify-center">
                <Users className="h-4 w-4 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{t("settings.manageUsers")}</div>
                <div className="mt-0.5 text-xs text-slate-500">{t("settings.manageUsersHelp")}</div>
              </div>
            </Link>

            <Link
              to="/admin/modules"
              className="card p-4 flex items-start gap-3 transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
            >
              <div className="shrink-0 h-9 w-9 rounded-xl bg-brand-soft flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{t("settings.manageModules")}</div>
                <div className="mt-0.5 text-xs text-slate-500">{t("settings.manageModulesHelp")}</div>
              </div>
            </Link>

            <Link
              to="/admin/progress"
              className="card p-4 flex items-start gap-3 transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
            >
              <div className="shrink-0 h-9 w-9 rounded-xl bg-brand-soft flex items-center justify-center">
                <BarChart2 className="h-4 w-4 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{t("settings.trainingProgress")}</div>
                <div className="mt-0.5 text-xs text-slate-500">{t("settings.trainingProgressHelp")}</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
