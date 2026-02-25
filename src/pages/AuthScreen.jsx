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

// Each pill floats at a different speed/amplitude so they feel alive
const PILL_FLOATS = [
  { duration: 3.2, y: 7,  delay: 0    },
  { duration: 4.0, y: 10, delay: 0.8  },
  { duration: 3.6, y: 6,  delay: 1.5  },
];

function FloatingPill({ icon, text, float }) {
  return (
    <motion.div
      animate={{ y: [0, -float.y, 0] }}
      transition={{
        duration: float.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: float.delay,
      }}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/90 select-none"
      style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
               border: "1px solid rgba(255,255,255,0.25)" }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </motion.div>
  );
}

export function AuthScreen({ onSignedIn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

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

  const pills = [
    { icon: "🎯", text: t("auth.value.focused") },
    { icon: "🤖", text: t("auth.value.aiAssisted") },
    { icon: "🌐", text: t("auth.value.bilingual") },
  ];

  return (
    /* h-screen + overflow-hidden = never scrolls */
    <div className="h-screen overflow-hidden relative flex flex-col items-center justify-center px-4">

      {/* Full-screen animated gradient */}
      <AnimatedBackground />

      {/* Radial vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.22) 100%)" }}
      />

      {/* ── Centered column — everything visible without scrolling ── */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4">

        {/* Headline — compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow">
            {t("auth.hero.headline")}
          </h1>
          <p className="mt-1 text-sm text-white/80 max-w-[260px] mx-auto leading-snug">
            {t("auth.hero.subheadline")}
          </p>
        </motion.div>

        {/* Compact feature carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="w-full"
        >
          <FeatureCarousel />
        </motion.div>

        {/* ── 3D Glass login card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <GlassCard>
            {/* Top row: logo left, language toggle right */}
            <div className="flex items-center justify-between mb-4">
              <img
                src="/logo.png"
                alt="AutoRx Center"
                className="h-9 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <LanguageToggle />
            </div>

            {/* Form */}
            <form onSubmit={signIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm
                      focus:border-brand-primary focus:ring-4 focus:ring-brand-soft
                      transition-all outline-none bg-white/70"
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm
                      focus:border-brand-primary focus:ring-4 focus:ring-brand-soft
                      transition-all outline-none bg-white/70"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {err}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full btn-primary py-2.5 text-sm font-bold shadow-md
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {t("auth.signingIn")}
                  </span>
                ) : (
                  t("auth.signIn")
                )}
              </motion.button>
            </form>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              🔒 {t("auth.secureLogin")}
            </p>
          </GlassCard>
        </motion.div>

        {/* Floating animated pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {pills.map((pill, i) => (
            <FloatingPill
              key={pill.text}
              icon={pill.icon}
              text={pill.text}
              float={PILL_FLOATS[i]}
            />
          ))}
        </motion.div>

      </div>
    </div>
  );
}
