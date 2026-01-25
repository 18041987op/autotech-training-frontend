import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

export function AuthScreen({ onSignedIn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [role, setRole] = useState("technician");
  const [email, setEmail] = useState("demo@autotech.com");
  const [password, setPassword] = useState("");

  const demoUser = useMemo(() => {
    return {
      email,
      name:
        role === "technician"
          ? "Demo Technician"
          : role === "administrative"
          ? "Demo Admin Staff"
          : "Demo Admin",
      role
    };
  }, [role, email]);

  const signIn = (e) => {
    e.preventDefault();
    onSignedIn(demoUser);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">{t("appName")}</p>
              <p className="text-xs text-slate-500">Onboarding • Training • Culture</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{t("auth.welcomeTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("auth.welcomeSubtitle")}</p>

          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div>
              <label className="text-xs font-semibold text-slate-700">{t("auth.role")}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="technician">{t("auth.roleTechnician")}</option>
                <option value="administrative">{t("auth.roleAdministrative")}</option>
                <option value="admin">{t("auth.roleAdmin")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">{t("auth.email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="name@company.com"
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
              />
            </div>

            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800"
              type="submit"
            >
              {t("auth.demoSignIn")}
            </button>

            <p className="text-xs text-slate-500">
              Option A: demo login only. Next we’ll connect real auth.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
