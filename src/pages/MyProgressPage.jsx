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

  // Simple, deterministic tiers (no backend timestamps yet)
  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function getMomentumCopy(momentum) {
  if (momentum === "fast") {
    return {
      badge: "Fast",
      line: "You’re moving fast. Keep momentum and finish this module.",
      transitionMs: 500,
    };
  }
  if (momentum === "steady") {
    return {
      badge: "Steady",
      line: "Steady progress. One more quiz session will push you forward.",
      transitionMs: 900,
    };
  }
  return {
    badge: "Stalled",
    line: "Looks stalled. Do a quick review + one short assessment attempt today.",
    transitionMs: 1400,
  };
}

function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const { transitionMs } = getMomentumCopy(momentum);

  // Keep the car from going beyond edges visually (simple padding)
  const left = `calc(${pct}% - 10px)`; // 10px ~ half the car bubble

  return (
    <div className="mt-3">
      <div className="relative h-10">
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-100" />

        {/* Completed portion */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-brand-primary"
          style={{
            width: `${pct}%`,
            transition: `width ${transitionMs}ms ease`,
          }}
        />

        {/* Milestones */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-slate-300" />
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-slate-300" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-slate-300" />

        {/* Car */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left,
            transition: `left ${transitionMs}ms ease`,
          }}
        >
          <div
            className={[
              "grid place-items-center h-6 w-6 rounded-full border bg-white shadow-sm",
              momentum === "fast" ? "border-slate-300" : "border-slate-200",
            ].join(" ")}
            title={`${pct}%`}
          >
            <span className="text-xs leading-none">🚗</span>
          </div>
        </div>
      </div>

      {/* 0% and 100% labels */}
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
        <span>0%</span>
        <span>100%</span>
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

                {/* Animated track */}
                <TrackCar percent={r.completion} momentum={r.momentum} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
