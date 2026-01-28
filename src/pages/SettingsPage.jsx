import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useOutletContext();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-5">
      {/* Language */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("pages.settingsTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("settings.languageHelp")}</p>
        <div className="mt-4">
          <LanguageToggle />
        </div>
      </div>

      {/* Admin tools */}
      {isAdmin ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">{t("settings.adminToolsTitle")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("settings.adminToolsSubtitle")}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Link
              to="/admin/users"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100"
            >
              <div className="text-sm font-extrabold">{t("settings.manageUsers")}</div>
              <div className="mt-1 text-sm text-slate-600">{t("settings.manageUsersHelp")}</div>
            </Link>

            <Link
              to="/admin/modules"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100"
            >
              <div className="text-sm font-extrabold">{t("settings.manageModules")}</div>
              <div className="mt-1 text-sm text-slate-600">{t("settings.manageModulesHelp")}</div>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
