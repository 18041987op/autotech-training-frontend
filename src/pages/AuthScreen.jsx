import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

import { apiFetch, setToken } from "../lib/api";
import { AnimatedBackground } from "../components/auth/AnimatedBackground";
import { FeatureCarousel } from "../components/auth/FeatureCarousel";
import { GlassCard } from "../components/auth/GlassCard";
import { LanguageToggle } from "../components/LanguageToggle";

export function AuthScreen({ onSignedIn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  const signIn = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
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
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-10">

      {/* Full-screen animated gradient — covers everything */}
      <AnimatedBackground />

      {/* Soft radial vignette so edges feel depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      {/* ── All content floats above the background ── */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-7">

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white drop-shadow-sm">
            {t("auth.hero.headline")}
          </h1>
          <p className="mt-2 text-base text-white/85 max-w-xs mx-auto leading-snug">
            {t("auth.hero.subheadline")}
          </p>
        </motion.div>

        {/* Feature carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.55 }}
          className="w-full"
        >
          <FeatureCarousel />
        </motion.div>

        {/* ── Login card — glass effect floating over gradient ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="w-full"
        >
          <GlassCard>
            {/* Language Toggle */}
            <div className="flex justify-end mb-5">
              <LanguageToggle />
            </div>

            {/* Logo */}
            <div className="text-center mb-7">
              <div className="flex justify-center mb-3">
                <img
                  src="/logo.png"
                  alt="AutoRx Center"
                  className="h-14 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const div = document.createElement("div");
                    div.className =
                      "h-14 w-14 mx-auto rounded-2xl bg-brand-primary flex items-center justify-center";
                    div.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
                    e.currentTarget.parentElement.appendChild(div);
                  }}
                />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {t("appName")}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{t("brand.tagline")}</p>
            </div>

            {/* Form */}
            <form onSubmit={signIn} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200
                      focus:border-brand-primary focus:ring-4 focus:ring-brand-soft
                      transition-all outline-none"
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200
                      focus:border-brand-primary focus:ring-4 focus:ring-brand-soft
                      transition-all outline-none"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {err}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary py-3 text-base font-bold shadow-lg
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    {t("auth.signingIn")}
                  </span>
                ) : (
                  t("auth.signIn")
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              🔒 {t("auth.secureLogin")}
            </div>
          </GlassCard>
        </motion.div>

        {/* Honest value-prop pills — no fake numbers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.55 }}
          className="flex flex-wrap justify-center gap-3 pb-2"
        >
          {[
            { icon: "🎯", text: t("auth.value.focused") },
            { icon: "🤖", text: t("auth.value.aiAssisted") },
            { icon: "🌐", text: t("auth.value.bilingual") },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/90"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
            >
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
