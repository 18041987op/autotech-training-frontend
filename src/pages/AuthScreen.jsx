import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

import { apiFetch, setToken } from "../lib/api";

export function AuthScreen({ onSignedIn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });

      setToken(data.token);
      onSignedIn(data.user);

      navigate("/", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1E6FAE] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">{t("appName")}</p>
              <p className="text-xs text-slate-500">Onboarding • Training • Culture</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{t("auth.welcomeTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("auth.welcomeSubtitle")}</p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div>
              <label className="text-xs font-semibold text-slate-700">{t("auth.email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              className="w-full rounded-2xl bg-[#1E6FAE] hover:bg-[#155A8A] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
