import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #0f3460 0%, #1E6FAE 55%, #2a9fd6 100%)";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  right,
  gradient = DEFAULT_GRADIENT,
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl"
      style={{ background: gradient }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 px-6 pt-6 pb-7 sm:px-8 sm:pt-7 sm:pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 mb-3 backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                  {eyebrow}
                </span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[10px] font-medium italic text-white/55 tracking-wide">
                  {t("appSlogan")}
                </span>
              </div>
            ) : null}

            <h1 className="text-2xl font-extrabold text-white leading-tight sm:text-3xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-white/70">
                {subtitle}
              </p>
            ) : null}

            {actions ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>

          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
    </motion.div>
  );
}
