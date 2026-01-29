import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

function normalizeOptions(options) {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function AssessmentRunnerPage() {
  const { id: moduleId, aid } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionNo]: selectedIndex }

  // per-question state
  const [revealed, setRevealed] = useState(false);
  const [pickedIndex, setPickedIndex] = useState(null);

  // final result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const total = questions.length;
  const current = questions[idx] || null;

  const passingScore = useMemo(() => {
    // backend may send passing_score; fallback 70
    const p =
      assessment?.passing_score ??
      assessment?.passingScore ??
      assessment?.passing_score_percent ??
      70;
    const n = Number(p);
    return Number.isFinite(n) ? n : 70;
  }, [assessment]);

  const progressLabel = useMemo(() => {
    if (!total) return "";
    return t("assessmentRunner.progress", { current: idx + 1, total });
  }, [idx, total, t]);

  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const out = await apiFetch(`/api/assessments/${aid}`);

        // expected: { assessment, questions }
        setAssessment(out.assessment || null);

        const normalized = (out.questions || []).map((q) => ({
          questionNo: q.question_no,
          text: q.question,
          options: normalizeOptions(q.options),
          correctIndex:
            typeof q.correct_index === "number" ? q.correct_index : Number(q.correct_index),
          explanation: q.explanation || ""
        }));

        setQuestions(normalized);
        setIdx(0);
        setAnswers({});
        setRevealed(false);
        setPickedIndex(null);
        setResult(null);
      } catch (e) {
        setErr(e.message || "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    })();
  }, [aid]);

  const isCorrect = useMemo(() => {
    if (!current) return null;
    if (pickedIndex == null) return null;
    return Number(current.correctIndex) === Number(pickedIndex);
  }, [current, pickedIndex]);

  const pick = (optIndex) => {
    if (!current) return;
    if (revealed) return;

    const qNo = current.questionNo ?? idx + 1;

    setAnswers((prev) => ({ ...prev, [qNo]: optIndex }));
    setPickedIndex(optIndex);
    setRevealed(true);
  };

  const next = async () => {
    if (!current) return;
    if (!revealed) return;

    // last question -> auto submit
    if (idx >= total - 1) {
      await submitAttempt();
      return;
    }

    setIdx((i) => i + 1);
    setRevealed(false);
    setPickedIndex(null);
  };

  const submitAttempt = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErr("");

    try {
      const out = await apiFetch(`/api/assessments/${aid}/attempt`, {
        method: "POST",
        body: { answers }
      });

      setResult(out);
    } catch (e) {
      setErr(e.message || "Failed to submit attempt");
    } finally {
      setSubmitting(false);
    }
  };

  const backToModule = () => nav(`/modules/${moduleId}`);

  const tryAgain = () => {
    nav(0);
  };

  if (loading) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        {t("status.loading")}
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
          {err}
        </div>

        <button
          className="btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold"
          onClick={backToModule}
          type="button"
        >
          {t("assessmentRunner.backToModule")}
        </button>
      </div>
    );
  }

  // Final screen
  if (result) {
    const score = typeof result.score === "number" ? result.score : result.attempt?.score;
    const passed = typeof result.passed === "boolean" ? result.passed : result.attempt?.passed;

    const correct = result.correct ?? result.attempt?.correct;
    const totalRes = result.total ?? result.attempt?.total ?? total;

    return (
      <div className="card p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">{assessment?.title || "Assessment"}</h1>
          <div className="mt-1 text-sm text-slate-600">
            {t("assessmentRunner.passing")}: {passingScore}%
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-sm text-slate-700">
            <span className="font-extrabold">{t("assessmentRunner.score")}:</span>{" "}
            {score ?? "—"}%{" "}
            {typeof correct === "number" && typeof totalRes === "number"
              ? `(${correct}/${totalRes})`
              : ""}
          </div>

          {passed ? (
            <div className="mt-2 text-sm text-slate-700">
              <div className="font-extrabold">{t("assessmentRunner.passedTitle")}</div>
              <div className="mt-1">{t("assessmentRunner.passedBody")}</div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-700">
              <div className="font-extrabold">{t("assessmentRunner.failedTitle")}</div>
              <div className="mt-1">
                {t("assessmentRunner.failedBody", { passing: passingScore })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!passed ? (
            <button
              className="btn-primary rounded-2xl px-4 py-2 text-sm font-extrabold"
              onClick={tryAgain}
              type="button"
            >
              {t("assessmentRunner.tryAgain")}
            </button>
          ) : null}

          <button
            className="btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold"
            onClick={backToModule}
            type="button"
          >
            {t("assessmentRunner.keepLearning")}
          </button>
        </div>
      </div>
    );
  }

  // No questions
  if (!current) {
    return (
      <div className="card p-6 space-y-3">
        <h1 className="text-2xl font-extrabold">{t("assessmentRunner.noQuestionsTitle")}</h1>
        <div className="text-sm text-slate-600">{t("assessmentRunner.noQuestionsBody")}</div>
        <button
          className="btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold"
          onClick={backToModule}
          type="button"
        >
          {t("assessmentRunner.backToModule")}
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold">{assessment?.title || "Assessment"}</h1>
          <div className="mt-1 text-sm text-slate-600">{progressLabel}</div>
        </div>

        <button
          className="btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold"
          onClick={backToModule}
          type="button"
        >
          {t("assessmentRunner.exit")}
        </button>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="text-sm font-extrabold text-slate-900">
          {current.text || t("assessmentRunner.questionFallback")}
        </div>
      </div>

      <div className="grid gap-2">
        {current.options.map((opt, optIndex) => {
          const chosen = pickedIndex === optIndex;
          const correct = Number(current.correctIndex) === Number(optIndex);

          const border =
            revealed && chosen && correct
              ? "border-slate-900"
              : revealed && chosen && !correct
              ? "border-red-300"
              : revealed && correct
              ? "border-slate-300"
              : "border-slate-200";

          const bg =
            revealed && chosen && correct
              ? "bg-white"
              : revealed && chosen && !correct
              ? "bg-red-50"
              : "bg-white";

          return (
            <button
              key={optIndex}
              className={`text-left rounded-2xl border ${border} ${bg} px-4 py-3 hover:bg-brand-soft disabled:opacity-70`}
              disabled={revealed}
              onClick={() => pick(optIndex)}
              type="button"
            >
              <div className="text-sm font-semibold text-slate-900">{opt}</div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {revealed ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {isCorrect ? (
            <>
              <div className="font-extrabold">{t("assessmentRunner.correctTitle")}</div>
              <div className="mt-1">
                {current.explanation || t("assessmentRunner.correctBody")}
              </div>
            </>
          ) : (
            <>
              <div className="font-extrabold">{t("assessmentRunner.wrongTitle")}</div>
              <div className="mt-1">
                {current.explanation || t("assessmentRunner.wrongBody")}
              </div>
              {Number.isFinite(Number(current.correctIndex)) ? (
                <div className="mt-2">
                  <span className="font-semibold">{t("assessmentRunner.correctAnswer")}:</span>{" "}
                  {current.options?.[Number(current.correctIndex)] ?? "—"}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          className="btn-primary rounded-2xl px-4 py-2 text-sm font-extrabold disabled:opacity-60"
          onClick={next}
          disabled={!revealed || submitting}
          type="button"
        >
          {idx >= total - 1
            ? submitting
              ? t("assessmentRunner.finishing")
              : t("assessmentRunner.finish")
            : t("assessmentRunner.next")}
        </button>
      </div>
    </div>
  );
}
