import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

// ─── Badge system ─────────────────────────────────────────────────────────────

const BADGE_ANIMATIONS = `
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
`;

const BADGE_DEF = {
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

function AnimatedBadge({ badge, isNew, t }) {
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

function BadgeShelf({ badges, newBadgeIds, t }) {
  if (!badges?.length) {
    return (
      <p className="text-xs text-slate-500 italic mt-2">
        {t("badges.none")}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {badges.map((b) => (
        <AnimatedBadge
          key={b.badge_id}
          badge={b}
          isNew={(newBadgeIds || []).includes(b.badge_id)}
          t={t}
        />
      ))}
    </div>
  );
}

function clampPct(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

// Prevent clipping at 0% / 100% by keeping the car within safe bounds.
function safeCarPct(pct) {
  const p = clampPct(pct);
  return Math.min(85, Math.max(10, p));
}

function getMomentum({ completionRate, quizScore }) {
  const c = clampPct(completionRate);
  const s = typeof quizScore === "number" ? quizScore : null;

  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function getMomentumCopy(momentum) {
  if (momentum === "fast") {
    return {
      badge: "Fast",
      line: "You're moving fast. Keep momentum and finish your assigned checks.",
      roadSec: 1.2,
      wheelSec: 0.3,
      bounceSec: 0.8,
      cloudSec: 8,
    };
  }
  if (momentum === "steady") {
    return {
      badge: "Steady",
      line: "Steady progress. A short quiz session will push you forward.",
      roadSec: 2.0,
      wheelSec: 0.6,
      bounceSec: 1.4,
      cloudSec: 15,
    };
  }
  return {
    badge: "Stalled",
    line: "Looks stalled. Do a quick review + one short assessment attempt today.",
    roadSec: 3.5,
    wheelSec: 1.0,
    bounceSec: 2.2,
    cloudSec: 25,
  };
}

/**
 * ✅ Keep your car exactly as-is (copied from your existing file)
 */
function CarIcon({ wheelSec, momentum }) {
  const speedLines = momentum === "fast" ? 5 : momentum === "steady" ? 3 : 1;

  return (
    <svg width="120" height="60" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <linearGradient id="carRoof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="windowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="tire">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="60%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="60" cy="54" rx="45" ry="4" fill="rgba(0,0,0,0.15)" />

      <g opacity={momentum === "fast" ? "0.6" : momentum === "steady" ? "0.4" : "0.2"}>
        {[...Array(speedLines)].map((_, i) => (
          <line
            key={i}
            x1={8 - i * 4}
            y1={28 + i * 5}
            x2={18 - i * 4}
            y2={28 + i * 5}
            stroke="#EF4444"
            strokeWidth={3 - i * 0.5}
            strokeLinecap="round"
            opacity={1 - i * 0.2}
          />
        ))}
      </g>

      <g filter="url(#glow)">
        <path
          d="M25 35 L25 32 Q25 28 29 28 L45 28 L52 20 Q54 17 58 17 L75 17 Q78 17 81 19 L90 28 L102 28 Q106 28 106 32 L106 38 Q106 40 104 40 L28 40 Q25 40 25 38 Z"
          fill="url(#carBodyGrad)"
          stroke="#991B1B"
          strokeWidth="2"
        />

        <rect x="22" y="30" width="8" height="3" rx="1" fill="#6D28D9" stroke="#5B21B6" strokeWidth="1" />

        <path
          d="M50 17 L56 11 Q58 9 62 9 L72 9 Q76 9 78 11 L82 17 Z"
          fill="url(#carRoof)"
          stroke="#5B21B6"
          strokeWidth="1.5"
        />

        <path
          d="M52 18 L57 12 Q58 11 61 11 L71 11 Q74 11 75 12 L80 18 Z"
          fill="url(#windowGrad)"
          stroke="#1E40AF"
          strokeWidth="1.2"
        />

        <polygon points="84,23 96,23 96,30 86,30" fill="url(#windowGrad)" stroke="#1E40AF" strokeWidth="1" />

        <rect x="55" y="17" width="3" height="23" fill="#FBBF24" opacity="0.8" />
        <rect x="70" y="17" width="3" height="23" fill="#FBBF24" opacity="0.8" />

        <rect x="98" y="31" width="8" height="6" rx="1" fill="#1F2937" opacity="0.7" />
        <line x1="100" y1="32" x2="100" y2="36" stroke="#4B5563" strokeWidth="0.8" />
        <line x1="102" y1="32" x2="102" y2="36" stroke="#4B5563" strokeWidth="0.8" />
        <line x1="104" y1="32" x2="104" y2="36" stroke="#4B5563" strokeWidth="0.8" />

        <ellipse cx="102" cy="27" rx="3" ry="2.5" fill="#FEF08A" filter="url(#glow)" />
        <ellipse cx="102" cy="27" rx="1.5" ry="1.2" fill="#FFFFFF" />
        <circle cx="102" cy="24" r="1.5" fill="#FDE047" opacity="0.9" />

        <ellipse cx="27" cy="27" rx="2" ry="2.5" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1" />
        <ellipse cx="27" cy="27" rx="0.8" ry="1" fill="#FEE2E2" />

        <path d="M86 24 L90 22 L91 25 L87 26 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />

        <line x1="68" y1="28" x2="68" y2="39" stroke="#991B1B" strokeWidth="1.5" opacity="0.6" />

        <ellipse cx="28" cy="39" rx="2" ry="1.5" fill="#374151" stroke="#1F2937" strokeWidth="1" />

        <path d="M30 40 L100 40 L98 42 L32 42 Z" fill="#1F2937" opacity="0.6" />
      </g>

      <g style={{ transformOrigin: "85px 43px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="85" cy="43" r="9" fill="url(#tire)" stroke="#0F172A" strokeWidth="2" />
        <circle cx="85" cy="43" r="5" fill="#52525B" stroke="#3F3F46" strokeWidth="1.5" />
        <circle cx="85" cy="43" r="2" fill="#A1A1AA" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={angle}
            x1="85"
            y1="43"
            x2={85 + Math.cos((angle * Math.PI) / 180) * 4}
            y2={43 + Math.sin((angle * Math.PI) / 180) * 4}
            stroke="#71717A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
      </g>

      <g style={{ transformOrigin: "38px 43px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="38" cy="43" r="9" fill="url(#tire)" stroke="#0F172A" strokeWidth="2" />
        <circle cx="38" cy="43" r="5" fill="#52525B" stroke="#3F3F46" strokeWidth="1.5" />
        <circle cx="38" cy="43" r="2" fill="#A1A1AA" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={angle}
            x1="38"
            y1="43"
            x2={38 + Math.cos((angle * Math.PI) / 180) * 4}
            y2={43 + Math.sin((angle * Math.PI) / 180) * 4}
            stroke="#71717A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
      </g>

      {momentum !== "stalled" && (
        <g opacity="0.4">
          <circle cx="24" cy="39" r="3" fill="#9CA3AF">
            <animate attributeName="r" values="2;4;1" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.2;0" dur="0.6s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

/**
 * ✅ Same animation, just used ONCE for overall progress
 */
function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const carPct = safeCarPct(pct);
  const { roadSec, wheelSec, bounceSec, cloudSec } = getMomentumCopy(momentum);

  return (
    <div className="mt-4">
      <style>{`
        @keyframes roadScroll { 0% { background-position: 0 center; } 100% { background-position: -800px center; } }
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes carBounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          25% { transform: translate(-50%, -50%) translateY(-3px) rotate(-0.8deg); }
          50% { transform: translate(-50%, -50%) translateY(-5px) rotate(0deg); }
          75% { transform: translate(-50%, -50%) translateY(-3px) rotate(0.8deg); }
        }
        @keyframes grassPass { 0% { transform: translateX(0) scaleY(1); opacity: 1; } 50% { transform: translateX(-50%) scaleY(1.1); opacity: 0.9; } 100% { transform: translateX(-100%) scaleY(0.95); opacity: 0.7; } }
        @keyframes cloudDrift { 0% { transform: translateX(0); opacity: 0.85; } 100% { transform: translateX(-100%); opacity: 0.6; } }
      `}</style>

      <div className="relative rounded-3xl overflow-hidden shadow-lg" style={{ height: "160px", isolation: "isolate" }}>
        {/* Sky */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, #7DD3FC 0%, #BAE6FD 50%, #E0F2FE 100%)" }}
        >
          <div
            className="absolute top-4 right-10 w-12 h-12 rounded-full bg-yellow-200 shadow-lg"
            style={{ boxShadow: "0 0 30px rgba(253, 224, 71, 0.5)" }}
          />

          <div
            style={{
              position: "absolute",
              top: "8%",
              left: "0",
              width: "200%",
              animation: `cloudDrift ${cloudSec}s linear infinite`,
            }}
          >
            {[5, 35, 70].map((offset) => (
              <div key={offset} style={{ position: "absolute", left: `${offset}%` }}>
                <div style={{ position: "relative", width: "120px", height: "45px" }}>
                  <div style={{ position: "absolute", left: "10px", top: "20px", width: "50px", height: "30px", background: "white", borderRadius: "50%", opacity: 0.9, filter: "blur(1px)" }} />
                  <div style={{ position: "absolute", left: "35px", top: "10px", width: "45px", height: "35px", background: "white", borderRadius: "50%", opacity: 0.95, filter: "blur(1px)" }} />
                  <div style={{ position: "absolute", left: "55px", top: "18px", width: "40px", height: "28px", background: "white", borderRadius: "50%", opacity: 0.88, filter: "blur(1px)" }} />
                  <div style={{ position: "absolute", left: "75px", top: "23px", width: "35px", height: "25px", background: "white", borderRadius: "50%", opacity: 0.85, filter: "blur(1px)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Landscape */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "42%" }}>
          <div style={{ height: "100%", background: "linear-gradient(to bottom, #22C55E 0%, #16A34A 60%, #15803D 100%)" }} />
        </div>

        {/* Road */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "22%",
            background: "linear-gradient(to bottom, #71717A 0%, #52525B 100%)",
            borderTop: "2px solid #3F3F46",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "4px",
              transform: "translateY(-50%)",
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 35px,
                  #FDE047 35px,
                  #FDE047 100px,
                  transparent 100px,
                  transparent 140px
                )
              `,
              animation: `roadScroll ${roadSec}s linear infinite`,
            }}
          />

          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.08) 100%)",
              transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
              borderRight: "2px solid #22C55E",
              boxShadow: "inset -4px 0 12px rgba(34,197,94,0.35)",
            }}
          />

          {/* Car */}
          <div
            className="absolute z-20"
            style={{
              left: `${carPct}%`,
              bottom: "30%",
              animation: `carBounce ${bounceSec}s ease-in-out infinite`,
              filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.35))",
            }}
          >
            <CarIcon wheelSec={wheelSec} momentum={momentum} />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-1 left-3 right-3 flex items-center justify-between text-xs font-bold">
          <span className="px-2 py-0.5 bg-white/90 rounded-lg shadow text-slate-700">0%</span>
          <span className="px-3 py-0.5 bg-blue-600 text-white rounded-lg shadow-lg">{pct}%</span>
          <span className="px-2 py-0.5 bg-white/90 rounded-lg shadow text-slate-700">100%</span>
        </div>
      </div>
    </div>
  );
}

function TinyStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function MiniBar({ pct }) {
  const p = clampPct(pct);
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full bg-slate-900" style={{ width: `${p}%`, transition: "width 400ms ease" }} />
    </div>
  );
}

export function MyProgressPage() {
  const { t } = useTranslation();

  const [progress, setProgress] = useState([]);
  const [modulesWithAssess, setModulesWithAssess] = useState([]); // from /api/assessments/user
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const [p, a, b] = await Promise.all([
          apiFetch("/api/progress"),
          apiFetch("/api/assessments/user"),
          apiFetch("/api/progress/badges").catch(() => ({ badges: [] })),
        ]);

        setProgress(p.progress || []);
        setModulesWithAssess(a.modules || []);
        setBadges(b.badges || []);
      } catch (e) {
        setErr(e.message || "Failed to load progress");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Eligible modules = assigned modules that have at least 1 assessment
  const eligibleModuleIds = useMemo(() => {
    const ids = new Set();
    for (const m of modulesWithAssess || []) {
      if ((m.assessments || []).length > 0) ids.add(m.id);
    }
    return ids;
  }, [modulesWithAssess]);

  const eligibleProgress = useMemo(() => {
    // progress rows only exist if user_progress exists; we only count those that match eligible modules
    return (progress || []).filter((p) => {
      const mid = p.modules?.id || p.module_id || p.modules?.module_id;
      return mid && eligibleModuleIds.has(mid);
    });
  }, [progress, eligibleModuleIds]);

  // Summary stats based on eligible modules
  const summary = useMemo(() => {
    const assigned = (modulesWithAssess || []).filter((m) => (m.assessments || []).length > 0).length;

    const started = eligibleProgress.length;

    const avgCompletion =
      started === 0 ? 0 : Math.round(eligibleProgress.reduce((sum, p) => sum + (p.completion_rate || 0), 0) / started);

    const passed = eligibleProgress.filter((p) => (p.quiz_score || 0) >= 70).length;

    // Overall score (best effort)
    const avgScore =
      started === 0
        ? null
        : Math.round(
            eligibleProgress
              .map((p) => (typeof p.quiz_score === "number" ? p.quiz_score : null))
              .filter((v) => typeof v === "number")
              .reduce((sum, v, _, arr) => sum + v / arr.length, 0)
          );

    // Average first-try accuracy (only for rows that have it)
    const firstTryRows = eligibleProgress.filter((p) => typeof p.first_attempt_score === "number");
    const avgFirstTry =
      firstTryRows.length === 0
        ? null
        : Math.round(firstTryRows.reduce((sum, p) => sum + p.first_attempt_score, 0) / firstTryRows.length);

    return { assigned, started, avgCompletion, passed, avgScore, avgFirstTry };
  }, [eligibleProgress, modulesWithAssess]);

  const overallMomentum = useMemo(() => {
    return getMomentum({ completionRate: summary.avgCompletion, quizScore: summary.avgScore });
  }, [summary.avgCompletion, summary.avgScore]);

  const overallCopy = useMemo(() => getMomentumCopy(overallMomentum), [overallMomentum]);

  const detailRows = useMemo(() => {
    return (eligibleProgress || []).map((p) => {
      const completion = clampPct(p.completion_rate || 0);
      const score = typeof p.quiz_score === "number" ? p.quiz_score : null;
      const firstAttemptScore = typeof p.first_attempt_score === "number" ? p.first_attempt_score : null;
      return {
        id: p.id,
        title: p.modules?.title || "Module",
        category: p.modules?.category || "",
        completion,
        score,
        firstAttemptScore,
      };
    });
  }, [eligibleProgress]);

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
        {t("status.loading")}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-x-hidden">
      <style>{BADGE_ANIMATIONS}</style>

      {/* Summary (compact on mobile) */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{t("progress.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("progress.subtitle")}</p>

        {/* Compact stats row */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TinyStat label={t("progress.summary.assignedModules")} value={summary.assigned} />
          <TinyStat label={t("progress.avgCompletion")} value={`${summary.avgCompletion}%`} />
          <TinyStat label={t("progress.passed")} value={summary.passed} />
          <TinyStat
            label={t("progress.firstTryAccuracyAvg")}
            value={summary.avgFirstTry !== null ? `${summary.avgFirstTry}%` : "—"}
          />
        </div>

        {/* Single overall car */}
        {summary.assigned === 0 ? (
          <div className="mt-4 text-sm text-slate-600">{t("status.noneFound")}</div>
        ) : (
          <>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {overallCopy.badge}
              </span>
              <p className="mt-2 text-xs text-slate-600">{overallCopy.line}</p>
            </div>
            <TrackCar percent={summary.avgCompletion} momentum={overallMomentum} />
          </>
        )}
      </div>

      {/* Achievements / Badge shelf */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">{t("badges.title")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("badges.subtitle")}</p>
        <BadgeShelf badges={badges} newBadgeIds={[]} t={t} />
      </div>

      {/* Detail (no per-module car) */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">{t("progress.detail")}</h2>

        {detailRows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">{t("status.noneFound")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {detailRows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.category}</p>
                    <MiniBar pct={r.completion} />
                    <p className="mt-2 text-xs text-slate-600">
                      {t("modules.completion")}: <span className="font-semibold">{r.completion}%</span>
                      <span className="mx-2 text-slate-300">•</span>
                      Score: <span className="font-semibold">{r.score ?? "—"}</span>
                    </p>
                    {r.firstAttemptScore !== null && (
                      <p className="mt-1 text-xs">
                        <span className="text-slate-500">{t("progress.firstTryAccuracy")}:</span>{" "}
                        <span
                          className="font-semibold"
                          style={{ color: r.firstAttemptScore === 100 ? "#F59E0B" : "#64748b" }}
                        >
                          {r.firstAttemptScore}%
                          {r.firstAttemptScore === 100 ? " ⚡" : ""}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-slate-600 shrink-0">
                    <div className="font-semibold">{r.completion}%</div>
                    <div className="text-slate-400">Overall</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
