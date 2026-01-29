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
  const [questionLimit, setQuestionLimit] = useState(null);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionNo]: selectedIndex }

  // per-question state
  const [revealed, setRevealed] = useState(false);
  const [pickedIndex, setPickedIndex] = useState(null);

  // final result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // attempts history (module-wide)
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsErr, setAttemptsErr] = useState("");
  const [failedCount7d, setFailedCount7d] = useState(null);
  const [policyQuestionLimit, setPolicyQuestionLimit] = useState(null);

  const total = questions.length;
  const current = questions[idx] || null;

  const passingScore = useMemo(() => {
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

  const loadAssessment = async () => {
    setErr("");
    setLoading(true);

    try {
      const out = await apiFetch(`/api/assessments/${aid}`);
      setAssessment(out.assessment || null);

      setQuestionLimit(
        typeof out.questionLimit === "number" ? out.questionLimit : null
      );

      const normalized = (out.questions || []).map((q) => ({
        questionNo: q.question_no,
        text: q.question,
        options: normalizeOptions(q.options),
        correctIndex:
          typeof q.correct_index === "number"
            ? q.correct_index
            : Number(q.correct_index),
        explanation: q.explanation || ""
      }));

      setQuestions(normalized);
      setIdx(0);
      setAnswers({});
      setRevealed(false);
      setPickedIndex(null);
      setResult(null);

      // reset history state for fresh attempt
      setAttempts([]);
      setAttemptsErr("");
      setFailedCount7d(null);
      setPolicyQuestionLimit(null);
    } catch (e) {
      setErr(e.message || "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessment();
    // eslint-disable-next-line
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

  const next = async () => {
    if (!current) return;
    if (!revealed) return;

    if (idx >= total - 1) {
      await submitAttempt();
      return;
    }

    setIdx((i) => i + 1);
    setRevealed(false);
    setPickedIndex(null);
  };

  const backToModule = () => nav(`/modules/${moduleId}`);

  // Try again without full reload
  const tryAgain = async () => {
    await loadAssessment();
  };

  // Fetch attempts history (module-wide) after result is shown
  useEffect(() => {
    if (!result) return;

    (async () => {
      setAttemptsErr("");
      setAttemptsLoading(true);
      try {
        const out = await apiFetch(`/api/assessments/${aid}/attempts?limit=10`);
        setAttempts(out.attempts || []);
        setFailedCount7d(typeof out.failedCount7d === "number" ? out.failedCount7d : null);
        setPolicyQuestionLimit(typeof out.policyQuestionLimit === "number" ? out.policyQuestionLimit : null);
      } catch (e) {
        setAttemptsErr(e.message || "Failed to load attempts");
        setAttempts([]);
      } finally {
        setAttemptsLoading(false);
      }
    })();
  }, [result, aid]);

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
    const passed =
      typeof result.passed === "boolean" ? result.passed : result.attempt?.passed;

    const correct = result.correct ?? result.attempt?.correct;
    const totalRes = result.total ?? result.attempt?.total ?? total;

    return (
      <div className="space-y-4">
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

        {/* Attempts history */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-extrabold">{t("assessmentRunner.historyTitle")}</div>
              <div className="mt-1 text-sm text-slate-600">
                {t("assessmentRunner.historySubtitle")}
              </div>
              {typeof failedCount7d === "number" && typeof policyQuestionLimit === "number" ? (
                <div className="mt-2 text-xs text-slate-500">
                  {t("assessmentRunner.policyLine", {
                    failedCount: failedCount7d,
                    limit: policyQuestionLimit
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {attemptsErr ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {attemptsErr}
            </div>
          ) : null}

          {attemptsLoading ? (
            <div className="mt-4 text-sm text-slate-600">{t("status.loading")}</div>
          ) : attempts.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">{t("assessmentRunner.historyNone")}</div>
          ) : (
            <div className="mt-4 grid gap-2">
              {attempts.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold">
                        {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                      </span>
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="font-extrabold">{a.score ?? "—"}%</span>
                    </div>

                    {a.passed ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        {t("assessmentRunner.passedTag")}
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {t("assessmentRunner.failedTag")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          {typeof questionLimit === "number" ? (
            <div className="mt-1 text-xs text-slate-500">
              {t("assessmentRunner.questionCountLine", { count: questionLimit })}
            </div>
          ) : null}
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
