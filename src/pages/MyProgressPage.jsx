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
    return { badge: "Fast", line: "You’re moving fast. Keep momentum and finish this module.", roadSec: 1.1, wheelSec: 0.35, bounceSec: 0.9 };
  }
  if (momentum === "steady") {
    return { badge: "Steady", line: "Steady progress. One more quiz session will push you forward.", roadSec: 1.8, wheelSec: 0.55, bounceSec: 1.3 };
  }
  return { badge: "Stalled", line: "Looks stalled. Do a quick review + one short assessment attempt today.", roadSec: 3.0, wheelSec: 0.9, bounceSec: 2.0 };
}

function CarIcon({ wheelSec }) {
  // Big, obvious, colored car facing RIGHT
  return (
    <svg width="86" height="44" viewBox="0 0 86 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <filter id="carShadow" x="-20%" y="-40%" width="140%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      {/* Shadow */}
      <ellipse cx="40" cy="38" rx="30" ry="4" fill="rgba(0,0,0,0.25)" />

      <g filter="url(#carShadow)">
        {/* Body */}
        <path
          d="M12 26h56c5 0 9-4 9-9v-3c0-3-2-6-5-7l-10-4c-2-1-4-1-6-1H31c-3 0-5 1-7 3l-8 8c-2 2-4 5-4 8v5z"
          fill="url(#carBody)"
          stroke="#0B1220"
          strokeOpacity="0.25"
        />

        {/* Window */}
        <path
          d="M34 6h18c2 0 4 1 6 2l7 5H38c-3 0-5-1-6-3l-1-1c-1-2 1-3 3-3z"
          fill="#E0F2FE"
          stroke="#0B1220"
          strokeOpacity="0.18"
        />

        {/* Front light */}
        <circle cx="78" cy="18" r="2.2" fill="#FBBF24" />
      </g>

      {/* Wheels */}
      <g style={{ transformOrigin: "26px 30px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="26" cy="30" r="7" fill="#0B1220" />
        <circle cx="26" cy="30" r="3" fill="#94A3B8" />
      </g>

      <g style={{ transformOrigin: "60px 30px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="60" cy="30" r="7" fill="#0B1220" />
        <circle cx="60" cy="30" r="3" fill="#94A3B8" />
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
          0% { background-position: 0 0, 0 0; }
          100% { background-position: -480px 0, -240px 0; }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes carBounce {
          0%,100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-3px); }
        }
      `}</style>

      <div className="relative">
        {/* ROAD */}
        <div
          className="relative h-20 rounded-2xl overflow-hidden border border-slate-200"
          style={{
            backgroundColor: "#0B1220",
            // 1) asphalt subtle speckle
            // 2) dashed center line
            backgroundImage: `
              radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 22px, rgba(255,255,255,0) 22px, rgba(255,255,255,0) 46px)
            `,
            backgroundSize: "18px 18px, 140px 6px",
            backgroundPosition: "0 0, 0 50%",
            backgroundRepeat: "repeat, repeat",
            animation: `roadScroll ${roadSec}s linear infinite`,
          }}
        >
          {/* lane edges */}
          <div className="absolute left-0 right-0 top-3 h-[2px] bg-white/10" />
          <div className="absolute left-0 right-0 bottom-3 h-[2px] bg-white/10" />

          {/* Progress overlay (subtle) */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${pct}%`,
              background: "rgba(56,189,248,0.10)",
              transition: "width 650ms ease",
            }}
          />

          {/* CAR */}
          <div
            className="absolute top-1/2"
            style={{
              left: `${carPct}%`,
              animation: `carBounce ${bounceSec}s ease-in-out infinite`,
            }}
          >
            <div style={{ transform: "translate(-50%, -50%)" }}>
              <CarIcon wheelSec={wheelSec} />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>0%</span>
          <span className="font-semibold text-slate-700">{pct}%</span>
          <span>100%</span>
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
