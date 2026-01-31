import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

function clampPct(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

function getMomentum({ completionRate, quizScore }) {
  const c = clampPct(completionRate);
  const s = typeof quizScore === "number" ? quizScore : null;

  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function momentumTuning(momentum) {
  // even stalled animates; it’s just slower
  if (momentum === "fast") return { sky: 18, hills: 10, trees: 6, road: 1.0, wheel: 0.35, bob: 1.2 };
  if (momentum === "steady") return { sky: 28, hills: 16, trees: 9, road: 1.8, wheel: 0.55, bob: 1.6 };
  return { sky: 40, hills: 24, trees: 14, road: 2.6, wheel: 0.85, bob: 2.0 };
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function CarSvg({ wheelSec }) {
  return (
    <svg width="120" height="56" viewBox="0 0 120 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="carPaint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22C55E" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
        <filter id="shadow" x="-40%" y="-60%" width="180%" height="220%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="60" cy="48" rx="42" ry="6" fill="rgba(0,0,0,0.25)" />

      <g filter="url(#shadow)">
        {/* body */}
        <path
          d="M16 33h78c7 0 13-6 13-13v-4c0-4-3-8-7-10l-14-6c-3-1-6-2-9-2H51c-4 0-8 2-11 4l-14 14c-3 3-5 7-5 11v6z"
          fill="url(#carPaint)"
          stroke="rgba(2,6,23,0.20)"
        />
        {/* window */}
        <path
          d="M56 8h24c3 0 6 1 8 3l10 8H62c-4 0-7-2-9-4l-2-2c-2-2 1-5 5-5z"
          fill="#DCFCE7"
          stroke="rgba(2,6,23,0.15)"
        />
        {/* light */}
        <circle cx="110" cy="22" r="3" fill="#FBBF24" />
      </g>

      {/* wheels */}
      <g style={{ transformOrigin: "40px 39px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="40" cy="39" r="9" fill="#0B1220" />
        <circle cx="40" cy="39" r="4" fill="#94A3B8" />
      </g>
      <g style={{ transformOrigin: "86px 39px", animation: `wheelSpin ${wheelSec}s linear infinite` }}>
        <circle cx="86" cy="39" r="9" fill="#0B1220" />
        <circle cx="86" cy="39" r="4" fill="#94A3B8" />
      </g>
    </svg>
  );
}

function DrivingScene({ percent, momentum }) {
  const pct = clampPct(percent);
  const tune = momentumTuning(momentum);

  // Car position across the scene should reflect progress, but keep it believable.
  // This keeps the car in the “drive lane” region while still moving right as progress grows.
  const carLeftPct = 30 + (pct * 0.55); // 30%..85%
  const flagLeftPct = Math.min(92, Math.max(8, carLeftPct + 10)); // a bit ahead of the car

  return (
    <div className="mt-4">
      <style>{`
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes carBob { 0%,100% { transform: translate(-50%,-50%) translateY(0px); } 50% { transform: translate(-50%,-50%) translateY(-2px); } }
        @keyframes carCreep { 0%,100% { margin-left: 0px; } 50% { margin-left: 6px; } }

        @keyframes scrollSky { 0% { background-position: 0 0; } 100% { background-position: -900px 0; } }
        @keyframes scrollHills { 0% { background-position: 0 0; } 100% { background-position: -900px 0; } }
        @keyframes scrollTrees { 0% { background-position: 0 0; } 100% { background-position: -900px 0; } }
        @keyframes scrollRoad { 0% { background-position: 0 0, 0 0; } 100% { background-position: -700px 0, -350px 0; } }
      `}</style>

      <div className="relative rounded-3xl border border-slate-200 overflow-hidden">
        {/* SKY */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(#93C5FD, #E0F2FE 55%, #FFFFFF)",
            animation: `scrollSky ${tune.sky}s linear infinite`,
          }}
        />

        {/* HILLS / MOUNTAINS (parallax layer) */}
        <div
          className="absolute inset-x-0 top-10 bottom-16"
          style={{
            backgroundImage: `
              radial-gradient(closest-side at 10% 90%, rgba(34,197,94,0.55), transparent 70%),
              radial-gradient(closest-side at 35% 95%, rgba(34,197,94,0.45), transparent 68%),
              radial-gradient(closest-side at 65% 92%, rgba(34,197,94,0.50), transparent 70%),
              radial-gradient(closest-side at 90% 96%, rgba(34,197,94,0.40), transparent 70%)
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "520px 100%",
            backgroundPosition: "0 100%",
            animation: `scrollHills ${tune.hills}s linear infinite`,
            opacity: 0.95,
          }}
        />

        {/* TREES (closer parallax layer) */}
        <div
          className="absolute inset-x-0 top-24 bottom-16"
          style={{
            backgroundImage: `
              radial-gradient(circle at 8% 90%, rgba(15,118,110,0.9) 0 18px, transparent 19px),
              radial-gradient(circle at 16% 90%, rgba(5,150,105,0.9) 0 14px, transparent 15px),
              radial-gradient(circle at 26% 92%, rgba(20,83,45,0.9) 0 16px, transparent 17px),
              radial-gradient(circle at 38% 90%, rgba(5,150,105,0.9) 0 14px, transparent 15px),
              radial-gradient(circle at 52% 92%, rgba(15,118,110,0.9) 0 18px, transparent 19px),
              radial-gradient(circle at 66% 90%, rgba(5,150,105,0.9) 0 14px, transparent 15px),
              radial-gradient(circle at 78% 92%, rgba(20,83,45,0.9) 0 16px, transparent 17px),
              radial-gradient(circle at 90% 90%, rgba(5,150,105,0.9) 0 14px, transparent 15px)
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "420px 100%",
            backgroundPosition: "0 100%",
            animation: `scrollTrees ${tune.trees}s linear infinite`,
            opacity: 0.85,
          }}
        />

        {/* ROAD */}
        <div
          className="relative h-40"
          style={{
            // Scene height
          }}
        >
          <div
            className="absolute left-0 right-0 bottom-0 h-16"
            style={{
              backgroundColor: "#0B1220",
              backgroundImage: `
                repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 26px, rgba(255,255,255,0) 26px, rgba(255,255,255,0) 58px),
                radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)
              `,
              backgroundSize: "150px 6px, 18px 18px",
              backgroundPosition: "0 50%, 0 0",
              backgroundRepeat: "repeat, repeat",
              animation: `scrollRoad ${tune.road}s linear infinite`,
            }}
          />

          {/* road edges */}
          <div className="absolute left-0 right-0 bottom-[56px] h-[2px] bg-white/10" />
          <div className="absolute left-0 right-0 bottom-[10px] h-[2px] bg-white/10" />

          {/* PROGRESS FLAG (shows where you are going) */}
          <div
            className="absolute bottom-[54px]"
            style={{
              left: `${flagLeftPct}%`,
              transform: "translateX(-50%)",
            }}
            title={`Target: ${pct}%`}
          >
            <div className="h-12 w-[2px] bg-slate-900/40" />
            <div className="absolute top-0 left-0 -translate-x-[2px] -translate-y-[2px] text-lg">
              🏁
            </div>
          </div>

          {/* CAR (always “driving”) */}
          <div
            className="absolute bottom-[30px]"
            style={{
              left: `${carLeftPct}%`,
              animation: `carCreep ${Math.max(1.2, tune.road)}s ease-in-out infinite`,
            }}
          >
            <div style={{ animation: `carBob ${tune.bob}s ease-in-out infinite` }}>
              <CarSvg wheelSec={tune.wheel} />
            </div>
          </div>
        </div>

        {/* UI labels */}
        <div className="absolute left-4 bottom-2 text-[11px] text-white/70">
          Distance: <span className="font-semibold text-white/90">{pct}%</span>
        </div>
      </div>
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

      const copy =
        momentum === "fast"
          ? { badge: "Fast", line: "You’re moving fast. Keep momentum and finish this module." }
          : momentum === "steady"
          ? { badge: "Steady", line: "Steady progress. One more quiz session will push you forward." }
          : { badge: "Stalled", line: "Looks stalled. Do a quick review + one short assessment attempt today." };

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

                {/* Scenic driving visualization */}
                <DrivingScene percent={r.completion} momentum={r.momentum} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
