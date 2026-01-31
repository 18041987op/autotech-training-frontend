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

  // MVP tiers (no timestamps yet)
  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function getMomentumCopy(momentum) {
  if (momentum === "fast") {
    return {
      badge: "Fast",
      line: "You’re moving fast. Keep momentum and finish this module.",
      roadSpeedSec: 1.2,
      wheelSpinSec: 0.45,
      bounceSec: 1.0,
    };
  }
  if (momentum === "steady") {
    return {
      badge: "Steady",
      line: "Steady progress. One more quiz session will push you forward.",
      roadSpeedSec: 2.0,
      wheelSpinSec: 0.65,
      bounceSec: 1.5,
    };
  }
  return {
    badge: "Stalled",
    line: "Looks stalled. Do a quick review + one short assessment attempt today.",
    roadSpeedSec: 3.2,
    wheelSpinSec: 0.85,
    bounceSec: 2.2,
  };
}

function CarIcon({ wheelSpinSec, stalled }) {
  // Simple “car” SVG facing RIGHT
  return (
    <svg
      width="54"
      height="28"
      viewBox="0 0 54 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/* Body */}
      <path
        d="M12 18.5h33.5c2.2 0 4-1.8 4-4v-2.2c0-1.3-.7-2.6-1.9-3.2l-6.9-3.4c-1-.5-2.1-.7-3.2-.7H21c-1.3 0-2.6.5-3.5 1.4l-4.8 4.8c-.8.8-1.2 1.8-1.2 2.9V18.5Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
      />
      {/* Window */}
      <path
        d="M22 6.8h12.6c.9 0 1.8.3 2.5.8l4.9 3.4H24.2c-1.1 0-2.2-.4-3-1.2l-.7-.7c-.6-.6-.2-2.3 1.5-2.3Z"
        fill="#E2E8F0"
        stroke="#CBD5E1"
      />

      {/* Wheels */}
      <g
        style={{
          transformOrigin: "18px 20.5px",
          animation: stalled ? "none" : `wheelSpin ${wheelSpinSec}s linear infinite`,
        }}
      >
        <circle cx="18" cy="20.5" r="4.6" fill="#0F172A" />
        <circle cx="18" cy="20.5" r="2.0" fill="#94A3B8" />
      </g>
      <g
        style={{
          transformOrigin: "40px 20.5px",
          animation: stalled ? "none" : `wheelSpin ${wheelSpinSec}s linear infinite`,
        }}
      >
        <circle cx="40" cy="20.5" r="4.6" fill="#0F172A" />
        <circle cx="40" cy="20.5" r="2.0" fill="#94A3B8" />
      </g>

      {/* Front light */}
      <circle cx="49" cy="13.2" r="1.2" fill="#FBBF24" />
    </svg>
  );
}

function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const { roadSpeedSec, wheelSpinSec, bounceSec } = getMomentumCopy(momentum);
  const stalled = momentum === "stalled";

  return (
    <div className="mt-4">
      <style>{`
        @keyframes roadDrift {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -420px 0, -260px 0, 0 0; }
        }
        @keyframes carBounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-2px); }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="relative">
        {/* ROAD */}
        <div
          className="relative h-16 rounded-2xl overflow-hidden border border-slate-200"
          style={{
            // Asphalt base + subtle texture + center dashed line
            backgroundColor: "#0B1220",
            backgroundImage: `
              repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 8px, rgba(0,0,0,0.08) 8px, rgba(0,0,0,0.08) 16px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 26px, rgba(255,255,255,0) 26px, rgba(255,255,255,0) 54px),
              linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(0,0,0,0.20))
            `,
            backgroundSize: "160px 100%, 110px 6px, 100% 100%",
            backgroundPosition: "0 0, 0 50%, 0 0",
            backgroundRepeat: "repeat, repeat, no-repeat",
            animation: stalled ? "none" : `roadDrift ${roadSpeedSec}s linear infinite`,
          }}
        >
          {/* Progress tint (keeps it subtle, not overpowering) */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${pct}%`,
              background: "rgba(56,189,248,0.10)", // subtle highlight
              transition: "width 650ms ease",
            }}
          />

          {/* Guard rails */}
          <div className="absolute left-0 right-0 top-2 h-[2px] bg-white/10" />
          <div className="absolute left-0 right-0 bottom-2 h-[2px] bg-white/10" />

          {/* CAR (moves left->right based on pct) */}
          <div
            className="absolute top-1/2"
            style={{
              left: `${pct}%`,
              // keep inside road edges
              paddingLeft: "18px",
              paddingRight: "18px",
              animation: stalled ? "none" : `carBounce ${bounceSec}s ease-in-out infinite`,
            }}
          >
            <div
              style={{
                position: "relative",
                transform: "translate(-50%, -50%)",
                filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
              }}
            >
              <CarIcon wheelSpinSec={wheelSpinSec} stalled={stalled} />
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

                {/* Road + animated car */}
                <TrackCar percent={r.completion} momentum={r.momentum} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
