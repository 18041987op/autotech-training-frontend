import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

function clampPct(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

// Keep car in safe bounds
function safeCarPct(pct) {
  const p = clampPct(pct);
  return Math.min(92, Math.max(8, p));
}

function getMomentum({ completionRate, quizScore }) {
  const c = clampPct(completionRate);
  const s = typeof quizScore === "number" ? quizScore : null;

  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function getMomentumCopy(momentum) {
  // always animate — stalled just slower
  if (momentum === "fast") {
    return {
      badge: "Fast",
      line: "You're moving fast. Keep momentum and finish this module.",
      wheelSec: 0.28,
      bounceSec: 0.9,
      bgSec: 6,
    };
  }
  if (momentum === "steady") {
    return {
      badge: "Steady",
      line: "Steady progress. One more quiz session will push you forward.",
      wheelSec: 0.55,
      bounceSec: 1.4,
      bgSec: 10,
    };
  }
  return {
    badge: "Stalled",
    line: "Looks stalled. Do a quick review + one short assessment attempt today.",
    wheelSec: 0.95,
    bounceSec: 2.0,
    bgSec: 16,
  };
}

// ✅ Your car icon (kept as-is, just pasted here)
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
        <g opacity="0.45">
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
 * ✅ Scenic road like your reference image:
 * - Sky + clouds
 * - Mountains
 * - Green hills
 * - Road with perspective + lane lines
 * - Road posts moving
 */
function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const carPct = safeCarPct(pct);
  const { wheelSec, bounceSec, bgSec } = getMomentumCopy(momentum);

  // Car position along the curve (keep on the left side for 0%, move right gradually)
  const carX = 10 + (carPct * 0.78); // 10%..~82%

  return (
    <div className="mt-5">
      <style>{`
        @keyframes wheelSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes carBounce {
          0%,100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-5px) rotate(-0.6deg); }
        }
        @keyframes driftClouds { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes movePosts { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-lg" style={{ height: 220 }}>
        {/* SKY */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, #60A5FA 0%, #93C5FD 45%, #E0F2FE 100%)",
          }}
        />

        {/* Clouds (subtle, not cheesy) */}
        <div
          className="absolute top-6 left-0 w-[200%] h-12 opacity-80"
          style={{ animation: `driftClouds ${bgSec * 2.2}s linear infinite` }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${i * 18}%`,
                top: `${(i % 3) * 6}px`,
                width: 120,
                height: 36,
                borderRadius: 999,
                background: "rgba(255,255,255,0.9)",
                boxShadow:
                  "34px 8px 0 -8px rgba(255,255,255,0.9), 64px 10px 0 -16px rgba(255,255,255,0.9)",
              }}
            />
          ))}
        </div>

        {/* Mountains + hills drawn with SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 440" preserveAspectRatio="none">
          {/* distant mountains */}
          <path d="M0 260 L160 180 L260 220 L420 140 L560 220 L740 150 L920 230 L1040 190 L1200 250 L1200 440 L0 440 Z"
            fill="#94A3B8" opacity="0.65" />
          {/* near mountains */}
          <path d="M0 300 L180 230 L340 280 L520 210 L700 290 L860 240 L1040 300 L1200 270 L1200 440 L0 440 Z"
            fill="#64748B" opacity="0.65" />

          {/* green hills */}
          <path d="M0 340 C120 300, 260 320, 360 300 C520 270, 620 330, 760 310 C920 290, 1060 330, 1200 310 L1200 440 L0 440 Z"
            fill="#22C55E" opacity="0.95" />
          <path d="M0 360 C140 330, 260 360, 420 330 C560 305, 740 360, 880 340 C1040 320, 1120 360, 1200 350 L1200 440 L0 440 Z"
            fill="#16A34A" opacity="0.95" />
        </svg>

        {/* Road (perspective) */}
        <svg className="absolute bottom-0 left-0 w-full" style={{ height: "44%" }} viewBox="0 0 1200 220" preserveAspectRatio="none">
          {/* road asphalt */}
          <path d="M0 220 L260 120 C460 60, 760 60, 1200 140 L1200 220 Z" fill="#111827" />
          {/* road shoulder */}
          <path d="M0 220 L260 120 C460 60, 760 60, 1200 140" fill="none" stroke="#E5E7EB" strokeWidth="8" />
          {/* lane line */}
          <path d="M210 150 C430 85, 760 90, 1040 150" fill="none" stroke="#FDE047" strokeWidth="6" strokeDasharray="18 18" opacity="0.95" />
          {/* subtle highlight */}
          <path d="M0 220 L260 120 C460 60, 760 60, 1200 140" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="20" />
        </svg>

        {/* Road posts moving (like your reference) */}
        <div
          className="absolute bottom-[22%] left-0 w-[200%] h-24"
          style={{ animation: `movePosts ${bgSec}s linear infinite` }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${i * 8.5}%`,
                bottom: `${i % 2 === 0 ? 0 : 10}px`,
              }}
            >
              <div className="w-3 h-14 rounded-sm bg-white shadow-sm" />
              <div className="w-3 h-3 bg-slate-800" />
              <div className="w-3 h-3 bg-white" />
              <div className="w-3 h-3 bg-slate-800" />
            </div>
          ))}
        </div>

        {/* The car (on road) */}
        <div
          className="absolute"
          style={{
            left: `${carX}%`,
            bottom: "12%",
            transform: "translate(-50%, -50%)",
            animation: `carBounce ${bounceSec}s ease-in-out infinite`,
            filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))",
          }}
        >
          <CarIcon wheelSec={wheelSec} momentum={momentum} />
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-bold">
          <span className="px-2 py-1 bg-white/90 rounded-lg shadow text-slate-700">0%</span>
          <span className="px-4 py-1 bg-blue-600 text-white rounded-lg shadow-lg">{pct}%</span>
          <span className="px-2 py-1 bg-white/90 rounded-lg shadow text-slate-700">100%</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

export function MyProgressPage() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await apiFetch("/api/progress");
        setProgress(data.progress || []);
      } catch (e) {
        setErr(e.message || "Failed to load progress");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const started = progress.length;
    const avg =
      started === 0
        ? 0
        : Math.round(progress.reduce((sum, p) => sum + (p.completion_rate || 0), 0) / started);
    const passed = progress.filter((p) => (p.quiz_score || 0) >= 70).length;
    return { started, avg, passed };
  }, [progress]);

  const rows = useMemo(() => {
    return (progress || []).map((p) => {
      const completion = clampPct(p.completion_rate || 0);
      const score = typeof p.quiz_score === "number" ? p.quiz_score : null;
      const momentum = getMomentum({ completionRate: completion, quizScore: score });
      const copy = getMomentumCopy(momentum);

      return {
        id: p.id,
        title: p.modules?.title || "Module",
        category: p.modules?.category || "",
        completion,
        score,
        momentum,
        momentumBadge: copy.badge,
        momentumLine: copy.line,
      };
    });
  }, [progress]);

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
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{t("progress.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("progress.subtitle")}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <StatCard label={t("progress.modulesStarted")} value={stats.started} />
          <StatCard label={t("progress.avgCompletion")} value={`${stats.avg}%`} />
          <StatCard label={t("progress.passed")} value={stats.passed} />
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">{t("progress.detail")}</h2>

        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">{t("status.noneFound")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-extrabold truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.category}</p>

                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {r.momentumBadge}
                      </span>
                      <p className="mt-2 text-xs text-slate-600">{r.momentumLine}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-600">
                    <div>
                      {t("modules.completion")}: <span className="font-semibold">{r.completion}%</span>
                    </div>
                    <div>
                      Score: <span className="font-semibold">{r.score ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <TrackCar percent={r.completion} momentum={r.momentum} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
