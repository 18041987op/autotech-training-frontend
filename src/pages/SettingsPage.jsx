import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router-dom";
import { Users, FolderKanban, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../lib/api";

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

// ─── Change Password ──────────────────────────────────────────────────────────
function ChangePasswordCard() {
  const { t } = useTranslation();
  const [current, setCurrent]     = useState("");
  const [next, setNext]           = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next.length < 8)         return setError(t("settings.passwordTooShort"));
    if (next !== confirm)        return setError(t("settings.passwordMismatch"));
    if (next === current)        return setError(t("settings.passwordSameAsCurrent"));

    setLoading(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
          <KeyRound className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold leading-tight">{t("settings.changePasswordTitle")}</h2>
          <p className="text-sm text-slate-500">{t("settings.changePasswordSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-w-sm">
        {/* Current password */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {t("settings.currentPassword")}
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-soft transition"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {t("settings.newPassword")}
          </label>
          <div className="relative">
            <input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-soft transition"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength indicator */}
          {next.length > 0 && (
            <div className="mt-1.5 flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < Math.min(Math.floor(next.length / 3), 4)
                      ? next.length >= 12 ? "bg-green-500"
                        : next.length >= 8  ? "bg-yellow-400"
                        : "bg-red-400"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {t("settings.confirmPassword")}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 transition ${
              confirm && confirm !== next
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-brand-primary focus:ring-brand-soft"
            } bg-white`}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            {t("settings.passwordSuccess")}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !current || !next || !confirm}
          className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("settings.changingPassword") : t("settings.changePasswordBtn")}
        </button>
      </form>
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

      {/* Change password */}
      <ChangePasswordCard />

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
          </div>
        </div>
      )}
    </div>
  );
}
