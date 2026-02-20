import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

import { apiFetch, setToken } from "../lib/api";
import { AnimatedBackground } from "../components/auth/AnimatedBackground";
import { GlassCard } from "../components/auth/GlassCard";
import { FeatureCarousel } from "../components/auth/FeatureCarousel";
import { StatsCounter } from "../components/auth/StatsCounter";
import { PlatformPreview } from "../components/auth/PlatformPreview";
import { LanguageToggle } from "../components/LanguageToggle";

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* LEFT SIDE: Visual Showcase */}
        <div className="relative lg:w-[60%] flex flex-col justify-center p-8 lg:p-16 overflow-hidden">
          <AnimatedBackground />

          <div className="relative z-10 space-y-12">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
                {t('auth.hero.headline')}
              </h1>
              <p className="text-xl text-white/90 max-w-2xl">
                {t('auth.hero.subheadline')}
              </p>
            </motion.div>

            {/* Feature Carousel */}
            <FeatureCarousel />

            {/* Stats Counter */}
            <StatsCounter />

            {/* Platform Preview */}
            <div className="hidden lg:block">
              <PlatformPreview />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="lg:w-[40%] flex items-center justify-center p-8 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <GlassCard>
              {/* Language Toggle */}
              <div className="flex justify-end mb-6">
                <LanguageToggle />
              </div>

              {/* Brand Identity */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-brand-primary flex items-center justify-center shadow-md overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="AutoRx Center"
                    className="h-full w-full object-contain p-1.5"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.classList.add("fallback-icon");
                    }}
                  />
                </div>
                <h2 className="text-2xl font-extrabold">
                  {t("appName")}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {t("brand.tagline")}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={signIn} className="space-y-5">
                {/* Email Input with Icon */}
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

                {/* Password Input with Icon */}
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

                {/* Error Message */}
                {err && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {err}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3 text-base font-bold shadow-lg
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all"
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

              {/* Security Badge */}
              <div className="mt-6 text-center text-xs text-slate-500">
                🔒 {t("auth.secureLogin")}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
