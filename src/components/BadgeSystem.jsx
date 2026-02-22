/**
 * Shared badge system — animations, definitions, and components
 * Used by both MyProgressPage and Home
 */
import React, { useState } from "react";

export const BADGE_ANIMATIONS = `
@keyframes badgeEntrance {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes electricPulse {
  0%, 100% { box-shadow: 0 0 6px 2px #F59E0B44; }
  50%       { box-shadow: 0 0 18px 6px #F59E0BAA, 0 0 30px 10px #FDE04733; }
}
@keyframes sparkSpin {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(-8deg) scale(1.2); }
  50%  { transform: rotate(5deg) scale(0.95); }
  75%  { transform: rotate(-3deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
}
@keyframes flameFlicker {
  0%, 100% { box-shadow: 0 0 8px 3px #EF444444; transform: scaleY(1); }
  33%       { box-shadow: 0 0 14px 5px #F9731688; transform: scaleY(1.04); }
  66%       { box-shadow: 0 0 10px 3px #EF444466; transform: scaleY(0.97); }
}
@keyframes iconFlicker {
  0%, 100% { transform: scale(1) rotate(0deg); }
  30%       { transform: scale(1.15) rotate(-3deg); }
  70%       { transform: scale(0.95) rotate(2deg); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes trophyBob {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-3px) rotate(2deg); }
}
@keyframes bookPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.08); }
}
@keyframes confettiFall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(20px) rotate(360deg); opacity: 0; }
}
@keyframes rocketThrust {
  0%, 100% { transform: translateY(0px) rotate(-5deg); }
  50%       { transform: translateY(-5px) rotate(-8deg); }
}
@keyframes thrusterGlow {
  0%, 100% { box-shadow: 0 0 8px 2px #7C3AED44; }
  50%       { box-shadow: 0 0 20px 8px #7C3AEDAA, 0 2px 12px 4px #A78BFA66; }
}
@keyframes lockedPulse {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 0.6; }
}
`;

export const BADGE_DEF = {
  perfect_first_try: {
    icon: "⚡",
    color: "#F59E0B",
    containerAnim: "electricPulse 2s ease-in-out infinite",
    iconAnim: "sparkSpin 3s ease-in-out infinite",
  },
  hot_streak_3: {
    icon: "🔥",
    color: "#EF4444",
    containerAnim: "flameFlicker 1.5s ease-in-out infinite",
    iconAnim: "iconFlicker 1.5s ease-in-out infinite",
  },
  module_master: {
    icon: "🏆",
    color: "#1E6FAE",
    shimmer: true,
    iconAnim: "trophyBob 2s ease-in-out infinite",
  },
  week_warrior: {
    icon: "📚",
    color: "#22C55E",
    confetti: true,
    iconAnim: "bookPulse 2s ease-in-out infinite",
  },
  fast_learner: {
    icon: "🚀",
    color: "#7C3AED",
    containerAnim: "thrusterGlow 2s ease-in-out infinite",
    iconAnim: "rocketThrust 1.8s ease-in-out infinite",
  },
};

// Ordered list of all badge IDs (for locked preview)
export const ALL_BADGE_IDS = [
  "perfect_first_try",
  "hot_streak_3",
  "module_master",
  "week_warrior",
  "fast_learner",
];

export function AnimatedBadge({ badge, isNew, t }) {
  const def = BADGE_DEF[badge.badge_id] || { icon: "🎖️", color: "#64748b" };
  const [showTooltip, setShowTooltip] = useState(false);

  const labelKey = `badges.${badge.badge_id}.label`;
  const descKey = `badges.${badge.badge_id}.desc`;
  const label = t(labelKey, { defaultValue: badge.badge_id });
  const desc = t(descKey, { defaultValue: "" });

  const containerAnims = [
    isNew ? "badgeEntrance 0.6s cubic-bezier(0.34,1.56,0.64,1) both" : "",
    def.containerAnim || "",
    def.shimmer ? "shimmer 3s linear infinite" : "",
  ].filter(Boolean).join(", ");

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold cursor-default select-none"
        style={{
          borderColor: def.color,
          background: def.shimmer
            ? `linear-gradient(105deg, ${def.color}15 0%, ${def.color}40 40%, ${def.color}15 60%, ${def.color}30 100%)`
            : def.color + "15",
          backgroundSize: def.shimmer ? "200% auto" : undefined,
          color: def.color,
          animation: containerAnims || undefined,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Confetti dots for Week Warrior */}
        {def.confetti && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
              borderRadius: "inherit",
            }}
          >
            {["#F59E0B", "#EF4444", "#22C55E", "#7C3AED"].map((c, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: c,
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 25}%`,
                  animation: `confettiFall ${1.2 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        )}
        <span
          style={{
            display: "inline-block",
            animation: def.iconAnim,
            fontSize: "1.25rem",
            lineHeight: 1,
          }}
        >
          {def.icon}
        </span>
        {label}
      </div>

      {/* Tooltip */}
      {showTooltip && desc && (
        <div
          className="absolute bottom-full left-1/2 mb-2 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-medium z-10 shadow-lg"
          style={{ transform: "translateX(-50%)", whiteSpace: "nowrap" }}
        >
          {desc}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: 4,
              borderStyle: "solid",
              borderColor: "transparent",
              borderTopColor: "#1e293b",
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Locked badge — greyed out with a lock icon and "how to earn" hint */
export function LockedBadge({ badgeId, t }) {
  const def = BADGE_DEF[badgeId] || { icon: "🎖️", color: "#94a3b8" };
  const [showTooltip, setShowTooltip] = useState(false);

  const label = t(`badges.${badgeId}.label`, { defaultValue: badgeId });
  const desc = t(`badges.${badgeId}.desc`, { defaultValue: "" });

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold cursor-default select-none"
        style={{
          borderColor: "#cbd5e1",
          background: "#f8fafc",
          color: "#94a3b8",
          animation: "lockedPulse 3s ease-in-out infinite",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Lock overlay */}
        <div
          style={{
            position: "absolute",
            top: 3,
            right: 5,
            fontSize: "0.55rem",
            lineHeight: 1,
            opacity: 0.5,
          }}
        >
          🔒
        </div>
        <span style={{ display: "inline-block", fontSize: "1.25rem", lineHeight: 1, opacity: 0.4 }}>
          {def.icon}
        </span>
        <span style={{ opacity: 0.55 }}>{label}</span>
      </div>

      {/* Tooltip — how to earn */}
      {showTooltip && desc && (
        <div
          className="absolute bottom-full left-1/2 mb-2 px-3 py-2 rounded-xl bg-slate-700 text-white text-xs font-medium z-10 shadow-lg"
          style={{ transform: "translateX(-50%)", whiteSpace: "nowrap", maxWidth: 220, textAlign: "center" }}
        >
          <div className="text-slate-300 text-[10px] font-semibold uppercase tracking-wide mb-0.5">
            {t("badges.howToEarn", { defaultValue: "How to earn" })}
          </div>
          {desc}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: 4,
              borderStyle: "solid",
              borderColor: "transparent",
              borderTopColor: "#334155",
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Full shelf: earned badges + locked badges (greyed) */
export function BadgeShelf({ badges, newBadgeIds, t, showLocked = false }) {
  const earnedIds = new Set((badges || []).map((b) => b.badge_id));

  if (!earnedIds.size && !showLocked) {
    return (
      <p className="text-xs text-slate-500 italic mt-2">
        {t("badges.none")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {/* Earned — animated */}
      {(badges || []).map((b) => (
        <AnimatedBadge
          key={b.badge_id}
          badge={b}
          isNew={(newBadgeIds || []).includes(b.badge_id)}
          t={t}
        />
      ))}
      {/* Locked — show badges not yet earned */}
      {showLocked &&
        ALL_BADGE_IDS.filter((id) => !earnedIds.has(id)).map((id) => (
          <LockedBadge key={id} badgeId={id} t={t} />
        ))}
    </div>
  );
}
