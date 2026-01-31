import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

function clampPct(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

// Prevent clipping at 0% / 100% by keeping the car within safe bounds.
function safeCarPct(pct) {
  const p = clampPct(pct);
  // Car SVG is ~120px wide. On mobile with overflow-hidden, 96% still clips.
  // This range keeps the car fully visible across typical phone widths.
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
  // IMPORTANT: even "stalled" still animates, just slower.
  if (momentum === "fast") {
    return {
      badge: "Fast",
      line: "You're moving fast. Keep momentum and finish this module.",
      roadSec: 1.2,
      wheelSec: 0.3,
      bounceSec: 0.8,
      cloudSec: 8,
    };
  }
  if (momentum === "steady") {
    return {
      badge: "Steady",
      line: "Steady progress. One more quiz session will push you forward.",
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
 * ✅ Keep your car exactly as-is
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

      {/* Ground Shadow */}
      <ellipse cx="60" cy="54" rx="45" ry="4" fill="rgba(0,0,0,0.15)" />

      {/* Speed Lines - Behind Car */}
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
        {/* Main Body - Sporty Shape */}
        <path
          d="M25 35 L25 32 Q25 28 29 28 L45 28 L52 20 Q54 17 58 17 L75 17 Q78 17 81 19 L90 28 L102 28 Q106 28 106 32 L106 38 Q106 40 104 40 L28 40 Q25 40 25 38 Z"
          fill="url(#carBodyGrad)"
          stroke="#991B1B"
          strokeWidth="2"
        />

        {/* Spoiler */}
        <rect x="22" y="30" width="8" height="3" rx="1" fill="#6D28D9" stroke="#5B21B6" strokeWidth="1" />

        {/* Hood Scoop / Roof */}
        <path
          d="M50 17 L56 11 Q58 9 62 9 L72 9 Q76 9 78 11 L82 17 Z"
          fill="url(#carRoof)"
          stroke="#5B21B6"
          strokeWidth="1.5"
        />

        {/* Windshield */}
        <path
          d="M52 18 L57 12 Q58 11 61 11 L71 11 Q74 11 75 12 L80 18 Z"
          fill="url(#windowGrad)"
          stroke="#1E40AF"
          strokeWidth="1.2"
        />

        {/* Side Windows */}
        <polygon points="84,23 96,23 96,30 86,30" fill="url(#windowGrad)" stroke="#1E40AF" strokeWidth="1" />

        {/* Racing Stripe */}
        <rect x="55" y="17" width="3" height="23" fill="#FBBF24" opacity="0.8" />
        <rect x="70" y="17" width="3" height="23" fill="#FBBF24" opacity="0.8" />

        {/* Front Bumper Details */}
        <rect x="98" y="31" width="8" height="6" rx="1" fill="#1F2937" opacity="0.7" />
        <line x1="100" y1="32" x2="100" y2="36" stroke="#4B5563" strokeWidth="0.8" />
        <line x1="102" y1="32" x2="102" y2="36" stroke="#4B5563" strokeWidth="0.8" />
        <line x1="104" y1="32" x2="104" y2="36" stroke="#4B5563" strokeWidth="0.8" />

        {/* Headlights */}
        <ellipse cx="102" cy="27" rx="3" ry="2.5" fill="#FEF08A" filter="url(#glow)" />
        <ellipse cx="102" cy="27" rx="1.5" ry="1.2" fill="#FFFFFF" />
        <circle cx="102" cy="24" r="1.5" fill="#FDE047" opacity="0.9" />

        {/* Tail Lights */}
        <ellipse cx="27" cy="27" rx="2" ry="2.5" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1" />
        <ellipse cx="27" cy="27" rx="0.8" ry="1" fill="#FEE2E2" />

        {/* Side Mirror */}
        <path d="M86 24 L90 22 L91 25 L87 26 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />

        {/* Door Lines */}
        <line x1="68" y1="28" x2="68" y2="39" stroke="#991B1B" strokeWidth="1.5" opacity="0.6" />

        {/* Exhaust Pipe */}
        <ellipse cx="28" cy="39" rx="2" ry="1.5" fill="#374151" stroke="#1F2937" strokeWidth="1" />

        {/* Bottom Diffuser */}
        <path d="M30 40 L100 40 L98 42 L32 42 Z" fill="#1F2937" opacity="0.6" />
      </g>

      {/* Front Wheel */}
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

      {/* Rear Wheel */}
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

      {/* Exhaust Smoke (when moving) */}
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
 * ✅ Keep your animation exactly as you pasted it.
 * Only light formatting; no behavior changes.
 */
function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const carPct = safeCarPct(pct);
  const { roadSec, wheelSec, bounceSec, cloudSec } = getMomentumCopy(momentum);

  return (
    <div className="mt-5">
      <style>{`
        @keyframes roadScroll {
          0% { background-position: 0 center; }
          100% { background-position: -800px center; }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes carBounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          25% { transform: translate(-50%, -50%) translateY(-3px) rotate(-0.8deg); }
          50% { transform: translate(-50%, -50%) translateY(-5px) rotate(0deg); }
          75% { transform: translate(-50%, -50%) translateY(-3px) rotate(0.8deg); }
        }
        @keyframes grassPass {
          0% { transform: translateX(0) scaleY(1); opacity: 1; }
          50% { transform: translateX(-50%) scaleY(1.1); opacity: 0.9; }
          100% { transform: translateX(-100%) scaleY(0.95); opacity: 0.7; }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(0); opacity: 0.85; }
          100% { transform: translateX(-100%); opacity: 0.6; }
        }
      `}</style>

      <div className="relative rounded-3xl overflow-hidden shadow-lg" style={{ height: "160px", isolation: "isolate" }}>
        {/* SKY - Softer Blue */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, #7DD3FC 0%, #BAE6FD 50%, #E0F2FE 100%)",
          }}
        >
          {/* Sun */}
          <div
            className="absolute top-4 right-10 w-12 h-12 rounded-full bg-yellow-200 shadow-lg"
            style={{ boxShadow: "0 0 30px rgba(253, 224, 71, 0.5)" }}
          />

          {/* Realistic Clouds */}
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
                  <div
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "20px",
                      width: "50px",
                      height: "30px",
                      background: "white",
                      borderRadius: "50%",
                      opacity: 0.9,
                      filter: "blur(1px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "35px",
                      top: "10px",
                      width: "45px",
                      height: "35px",
                      background: "white",
                      borderRadius: "50%",
                      opacity: 0.95,
                      filter: "blur(1px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "55px",
                      top: "18px",
                      width: "40px",
                      height: "28px",
                      background: "white",
                      borderRadius: "50%",
                      opacity: 0.88,
                      filter: "blur(1px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "75px",
                      top: "23px",
                      width: "35px",
                      height: "25px",
                      background: "white",
                      borderRadius: "50%",
                      opacity: 0.85,
                      filter: "blur(1px)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MOUNTAINS */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "28%" }}>
          <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,200 L0,120 L200,60 L400,100 L600,40 L800,90 L1000,70 L1200,110 L1200,200 Z"
              fill="#9CA3AF"
              opacity="0.35"
            />
            <path
              d="M0,200 L0,140 L150,100 L350,130 L550,80 L750,120 L950,100 L1200,140 L1200,200 Z"
              fill="#D1D5DB"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* GREEN LANDSCAPE */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "42%" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(to bottom, #22C55E 0%, #16A34A 60%, #15803D 100%)",
            }}
          />
        </div>

        {/* ROAD */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "22%",
            background: "linear-gradient(to bottom, #71717A 0%, #52525B 100%)",
            borderTop: "2px solid #3F3F46",
          }}
        >
          {/* Road Subtle Texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 25% 75%, rgba(212,212,216,0.2) 1px, transparent 1px),
                radial-gradient(circle at 75% 25%, rgba(212,212,216,0.15) 1px, transparent 1px)
              `,
              backgroundSize: "25px 25px, 30px 30px",
              backgroundPosition: "0 0, 12px 12px",
            }}
          />

          {/* CENTER LINE */}
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

          {/* Road Edge Lines */}
          <div className="absolute left-0 right-0 bg-white" style={{ top: "20%", height: "2px" }} />
          <div className="absolute left-0 right-0 bg-white" style={{ bottom: "20%", height: "2px" }} />

          {/* Grass Tufts - top */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              left: "100%",
              width: "200%",
              height: "15px",
              animation: `grassPass ${roadSec * 0.8}s linear infinite`,
            }}
          >
            {[0, 12, 25, 38, 52, 65, 80, 95].map((pos, idx) => (
              <div
                key={`left-${idx}-${pos}`}
                style={{
                  position: "absolute",
                  left: `${pos}%`,
                  bottom: 0,
                  width: "3px",
                  height: `${8 + ((idx % 5) * 2)}px`,
                  background: "linear-gradient(to top, #15803D, #22C55E)",
                  transformOrigin: "bottom center",
                  transform: `rotate(${(-15 + (idx % 7) * 5)}deg)`,
                }}
              />
            ))}
          </div>

          {/* Grass Tufts - bottom */}
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "100%",
              width: "200%",
              height: "15px",
              animation: `grassPass ${roadSec * 0.8}s linear infinite`,
            }}
          >
            {[3, 18, 31, 45, 58, 72, 87].map((pos, idx) => (
              <div
                key={`right-${idx}-${pos}`}
                style={{
                  position: "absolute",
                  left: `${pos}%`,
                  top: 0,
                  width: "3px",
                  height: `${8 + ((idx % 5) * 2)}px`,
                  background: "linear-gradient(to top, #15803D, #22C55E)",
                  transformOrigin: "top center",
                  transform: `rotate(${(-15 + (idx % 7) * 5)}deg)`,
                }}
              />
            ))}
          </div>

          {/* Progress Indicator */}
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

          {/* THE CAR */}
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

        {/* Progress Labels */}
        <div className="absolute bottom-1 left-3 right-3 flex items-center justify-between text-xs font-bold">
          <span className="px-2 py-0.5 bg-white/90 rounded-lg shadow text-slate-700">0%</span>
          <span className="px-3 py-0.5 bg-blue-600 text-white rounded-lg shadow-lg">{pct}%</span>
          <span className="px-2 py-0.5 bg-white/90 rounded-lg shadow text-slate-700">100%</span>
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
    <div className="space-y-5 overflow-x-hidden">
      {/* Summary */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{t("progress.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("progress.subtitle")}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <StatCard label={t("progress.modulesStarted")} value={stats.started} />
          <StatCard label={t("progress.avgCompletion")} value={`${stats.avg}%`} />
          <StatCard label={t("progress.passed")} value={stats.passed} />
        </div>
      </div>

      {/* Detail */}
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
