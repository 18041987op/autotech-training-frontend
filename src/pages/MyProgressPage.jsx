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
  return Math.min(96, Math.max(4, p));
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
    return { badge: "Fast", line: "You're moving fast. Keep momentum and finish this module.", roadSec: 1.5, wheelSec: 0.4, bounceSec: 1.2 };
  }
  if (momentum === "steady") {
    return { badge: "Steady", line: "Steady progress. One more quiz session will push you forward.", roadSec: 2.5, wheelSec: 0.7, bounceSec: 1.8 };
  }
  return { badge: "Stalled", line: "Looks stalled. Do a quick review + one short assessment attempt today.", roadSec: 4.5, wheelSec: 1.2, bounceSec: 2.5 };
}

function CarIcon({ wheelSec }) {
  return (
    <svg width="110" height="56" viewBox="0 0 110 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="carWindow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="wheelGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="70%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
        <filter id="carShadow" x="-50%" y="-50%" width="200%" height="250%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Ground Shadow */}
      <ellipse cx="55" cy="50" rx="38" ry="5" fill="rgba(0,0,0,0.2)" />

      <g filter="url(#carShadow)">
        {/* Car Body - Main */}
        <path
          d="M20 32 L20 28 Q20 26 22 26 L40 26 L48 18 Q50 16 53 16 L70 16 Q73 16 75 18 L85 26 L95 26 Q97 26 97 28 L97 35 Q97 37 95 37 L22 37 Q20 37 20 35 Z"
          fill="url(#carBody)"
          stroke="#1E40AF"
          strokeWidth="1.5"
        />
        
        {/* Car Roof */}
        <path
          d="M45 16 L52 9 Q54 7 57 7 L68 7 Q71 7 73 9 L78 16 Z"
          fill="url(#carBody)"
          stroke="#1E40AF"
          strokeWidth="1.5"
        />

        {/* Windows */}
        <path
          d="M48 17 L53 10 Q54 9 56 9 L65 9 Q67 9 68 10 L73 17 Z"
          fill="url(#carWindow)"
          stroke="#1E40AF"
          strokeWidth="1"
          opacity="0.9"
        />
        
        {/* Side Window */}
        <rect x="78" y="20" width="14" height="10" rx="2" fill="url(#carWindow)" stroke="#1E40AF" strokeWidth="1" opacity="0.8"/>

        {/* Front Grille Details */}
        <rect x="88" y="28" width="7" height="6" rx="1" fill="#1E293B" opacity="0.6"/>
        <line x1="91" y1="28" x2="91" y2="34" stroke="#374151" strokeWidth="0.5"/>
        <line x1="93" y1="28" x2="93" y2="34" stroke="#374151" strokeWidth="0.5"/>

        {/* Headlights */}
        <circle cx="92" cy="25" r="2.5" fill="#FDE047" stroke="#F59E0B" strokeWidth="1"/>
        <circle cx="92" cy="25" r="1.2" fill="#FEF08A" opacity="0.9"/>
        
        {/* Rear Light */}
        <circle cx="23" cy="25" r="1.8" fill="#DC2626" stroke="#991B1B" strokeWidth="0.8"/>
        
        {/* Door Line */}
        <line x1="62" y1="26" x2="62" y2="36" stroke="#1E40AF" strokeWidth="1.2" opacity="0.6"/>
        
        {/* Side Mirror */}
        <ellipse cx="82" cy="22" rx="3" ry="2" fill="#1E40AF" stroke="#1E293B" strokeWidth="0.8"/>
        
        {/* Bottom Skirt */}
        <rect x="24" y="36" width="68" height="2" rx="1" fill="#1E293B" opacity="0.5"/>
      </g>

      {/* Front Wheel */}
      <g style={{ transformOrigin: "75px 40px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="75" cy="40" r="8" fill="url(#wheelGradient)" stroke="#0F172A" strokeWidth="1.5"/>
        <circle cx="75" cy="40" r="4" fill="#94A3B8" stroke="#64748B" strokeWidth="1"/>
        <circle cx="75" cy="40" r="1.5" fill="#E2E8F0"/>
        {/* Spokes */}
        <line x1="75" y1="32" x2="75" y2="48" stroke="#64748B" strokeWidth="1" opacity="0.6"/>
        <line x1="67" y1="40" x2="83" y2="40" stroke="#64748B" strokeWidth="1" opacity="0.6"/>
        <line x1="69" y1="34" x2="81" y2="46" stroke="#64748B" strokeWidth="0.8" opacity="0.4"/>
        <line x1="69" y1="46" x2="81" y2="34" stroke="#64748B" strokeWidth="0.8" opacity="0.4"/>
      </g>

      {/* Rear Wheel */}
      <g style={{ transformOrigin: "34px 40px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="34" cy="40" r="8" fill="url(#wheelGradient)" stroke="#0F172A" strokeWidth="1.5"/>
        <circle cx="34" cy="40" r="4" fill="#94A3B8" stroke="#64748B" strokeWidth="1"/>
        <circle cx="34" cy="40" r="1.5" fill="#E2E8F0"/>
        {/* Spokes */}
        <line x1="34" y1="32" x2="34" y2="48" stroke="#64748B" strokeWidth="1" opacity="0.6"/>
        <line x1="26" y1="40" x2="42" y2="40" stroke="#64748B" strokeWidth="1" opacity="0.6"/>
        <line x1="28" y1="34" x2="40" y2="46" stroke="#64748B" strokeWidth="0.8" opacity="0.4"/>
        <line x1="28" y1="46" x2="40" y2="34" stroke="#64748B" strokeWidth="0.8" opacity="0.4"/>
      </g>

      {/* Speed Lines (motion effect) */}
      <g opacity="0.3">
        <line x1="10" y1="28" x2="18" y2="28" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="33" x2="16" y2="33" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="38" x2="18" y2="38" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const carPct = safeCarPct(pct);
  const { roadSec, wheelSec, bounceSec } = getMomentumCopy(momentum);

  return (
    <div className="mt-4">
      <style>{`
        @keyframes roadScroll {
          0% { background-position: 0 0, 0 center, 0 0; }
          100% { background-position: -600px 0, -300px center, -40px 0; }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes carBounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          25% { transform: translate(-50%, -50%) translateY(-2px) rotate(-0.5deg); }
          50% { transform: translate(-50%, -50%) translateY(-4px) rotate(0deg); }
          75% { transform: translate(-50%, -50%) translateY(-2px) rotate(0.5deg); }
        }
        @keyframes cloudFloat {
          0% { transform: translateX(0); opacity: 0.6; }
          100% { transform: translateX(-100%); opacity: 0.3; }
        }
      `}</style>

      <div className="relative">
        {/* SKY/BACKGROUND */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(to bottom, #BAE6FD 0%, #7DD3FC 100%)",
        }}>
          {/* Clouds */}
          <div style={{
            position: "absolute",
            top: "10%",
            left: "100%",
            width: "200%",
            height: "30px",
            animation: `cloudFloat ${roadSec * 3}s linear infinite`,
          }}>
            <div style={{
              position: "absolute",
              left: "10%",
              width: "80px",
              height: "30px",
              background: "white",
              borderRadius: "50px",
              opacity: 0.7,
              boxShadow: "40px 0 0 -10px white, 20px 0 0 -5px white"
            }}/>
          </div>
          <div style={{
            position: "absolute",
            top: "25%",
            left: "100%",
            width: "200%",
            height: "25px",
            animation: `cloudFloat ${roadSec * 4}s linear infinite`,
          }}>
            <div style={{
              position: "absolute",
              left: "40%",
              width: "70px",
              height: "25px",
              background: "white",
              borderRadius: "40px",
              opacity: 0.6,
              boxShadow: "35px 0 0 -8px white, 18px 0 0 -4px white"
            }}/>
          </div>
        </div>

        {/* ROAD */}
        <div
          className="relative h-24 rounded-2xl overflow-hidden border-2 border-slate-300"
          style={{
            marginTop: "40px",
            background: "linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.3) 20%, #1E293B 40%, #0F172A 100%)",
            boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          {/* Road Texture & Lane Markings */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(71,85,105,0.4) 1px, transparent 1px),
              radial-gradient(circle at 80% 30%, rgba(71,85,105,0.3) 1px, transparent 1px),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 30px,
                rgba(255,255,255,0.9) 30px,
                rgba(255,255,255,0.9) 50px,
                transparent 50px,
                transparent 90px
              )
            `,
            backgroundSize: "20px 20px, 25px 25px, 400px 4px",
            backgroundPosition: "0 0, 10px 10px, 0 50%",
            backgroundRepeat: "repeat, repeat, repeat-x",
            animation: `roadScroll ${roadSec}s linear infinite`,
          }}/>

          {/* Side Lines */}
          <div className="absolute left-0 right-0 h-[3px] bg-yellow-400/80" style={{ top: "20%" }}/>
          <div className="absolute left-0 right-0 h-[3px] bg-yellow-400/80" style={{ bottom: "20%" }}/>

          {/* Progress Overlay */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)",
              transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "inset -2px 0 8px rgba(34,197,94,0.3)"
            }}
          />

          {/* CAR */}
          <div
            className="absolute"
            style={{
              left: `${carPct}%`,
              top: "50%",
              animation: `carBounce ${bounceSec}s ease-in-out infinite`,
              zIndex: 10,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
            }}
          >
            <CarIcon wheelSec={wheelSec} />
          </div>

          {/* Horizon Line Effect */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "30%",
            background: "linear-gradient(to bottom, rgba(186,230,253,0.3), transparent)",
            pointerEvents: "none"
          }}/>
        </div>

        {/* Labels */}
        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">0%</span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {pct}%
          </span>
          <span className="text-slate-500">100%</span>
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
                      {t("modules.completion")}:{" "}
                      <span className="font-semibold">{r.completion}%</span>
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