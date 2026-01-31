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

  // Simple tiers (no timestamps yet)
  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function getMomentumCopy(momentum) {
  if (momentum === "fast") {
    return {
      badge: "Fast",
      line: "You’re moving fast. Keep momentum and finish this module.",
      roadSpeedSec: 1.4,
      carBounce: 1.2,
    };
  }
  if (momentum === "steady") {
    return {
      badge: "Steady",
      line: "Steady progress. One more quiz session will push you forward.",
      roadSpeedSec: 2.4,
      carBounce: 1.8,
    };
  }
  return {
    badge: "Stalled",
    line: "Looks stalled. Do a quick review + one short assessment attempt today.",
    roadSpeedSec: 4.0,
    carBounce: 2.6,
  };
}

function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const { roadSpeedSec, carBounce } = getMomentumCopy(momentum);

  // Keep car within visual track bounds
  const left = `calc(${pct}% - 18px)`; // 18px ~ half of the larger car container

  return (
    <div className="mt-4">
      {/* Local CSS for road + car animation */}
      <style>{`
        @keyframes roadMove {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -320px 0, -160px 0, -240px 0; }
        }
        @keyframes carBounce {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="relative">
        {/* Road container */}
        <div
          className="relative h-14 rounded-2xl overflow-hidden border border-slate-200"
          style={{
            // Road layers:
            // 1) asphalt texture: repeating diagonal subtle
            // 2) center dashed line
            // 3) edge highlights
            backgroundImage: `
              repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 18px, rgba(255,255,255,0) 18px, rgba(255,255,255,0) 38px),
              linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(0,0,0,0.12))
            `,
            backgroundSize: "160px 100%, 80px 6px, 100% 100%",
            backgroundPosition: "0 0, 0 50%, 0 0",
            backgroundRepeat: "repeat, repeat, no-repeat",
            backgroundColor: "#0f172a", // slate-900-ish
            animation: momentum === "stalled" ? "none" : `roadMove ${roadSpeedSec}s linear infinite`,
          }}
        >
          {/* Progress fill overlay (subtle) */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${pct}%`,
              background: "rgba(255,255,255,0.08)",
              transition: "width 600ms ease",
            }}
          />

          {/* Milestones */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/40" />
          <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-white/40" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/40" />

          {/* Car */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left,
              transition: "left 700ms ease",
            }}
          >
            <div
              className="relative"
              style={{
                animation: `carBounce ${carBounce}s ease-in-out infinite`,
              }}
              title={`${pct}%`}
            >
              {/* Car body (bigger + facing right) */}
              <div
                className="grid place-items-center h-9 w-9 rounded-full bg-white border border-slate-200 shadow"
                style={{
                  transform: "scale(1.15)", // slightly larger
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    lineHeight: "18px",
                    transform: "scaleX(1)", // ensure facing right (no flip)
                  }}
                >
                  🚗
                </span>
              </div>

              {/* Wheels (animated) */}
              <div
                className="absolute -bottom-2 left-1.5 h-3 w-3 rounded-full bg-slate-800 border border-white/30"
                style={{ animation: momentum === "stalled" ? "none" : "wheelSpin 0.7s linear infinite" }}
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-2 right-1.5 h-3 w-3 rounded-full bg-slate-800 border border-white/30"
                style={{ animation: momentum === "stalled" ? "none" : "wheelSpin 0.7s linear infinite" }}
                aria-hidden="true"
              />
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

                {/* Animated road + car */}
                <TrackCar percent={r.completion} momentum={r.momentum} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
