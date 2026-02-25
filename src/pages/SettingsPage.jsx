import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router-dom";

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", label: "English",  sublabel: "English" },
  { code: "es", flag: "🇲🇽", label: "Español",  sublabel: "Spanish" },
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "es" : "en";

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem("autotech_lang", lng); } catch {}
  };

  return (
    <div className="flex gap-3 mt-5">
      {LANGUAGES.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLang(lang.code)}
            className="flex-1 flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 transition-all"
            style={{
              borderColor:    active ? "#1E6FAE" : "#e2e8f0",
              background:     active ? "#eef6ff" : "#fff",
              boxShadow:      active ? "0 0 0 3px rgba(30,111,174,0.12)" : "none",
            }}
          >
            <span className="text-4xl leading-none">{lang.flag}</span>
            <div className="text-center">
              <div
                className="text-sm font-extrabold"
                style={{ color: active ? "#1E6FAE" : "#475569" }}
              >
                {lang.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{lang.sublabel}</div>
            </div>
            {active && (
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                style={{ background: "#1E6FAE", color: "#fff" }}
              >
                ✓ Active
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("pages.settingsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("settings.languageHelp")}</p>
        <LanguageSelector />
      </div>

      {/* Admin tools */}
      {isAdmin ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">{t("settings.adminToolsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("settings.adminToolsSubtitle")}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Link
              to="/admin/users"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
            >
              <div className="text-sm font-extrabold">{t("settings.manageUsers")}</div>
              <div className="mt-1 text-sm text-slate-500">{t("settings.manageUsersHelp")}</div>
            </Link>

            <Link
              to="/admin/modules"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
            >
              <div className="text-sm font-extrabold">{t("settings.manageModules")}</div>
              <div className="mt-1 text-sm text-slate-500">{t("settings.manageModulesHelp")}</div>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
