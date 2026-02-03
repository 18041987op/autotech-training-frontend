import React, { useEffect, useMemo, useRef, useState } from "react";
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

function mondayOfThisWeekISODate() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
}

function AssessmentFooter() {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold text-slate-900">Keep going</div>
        <div className="text-xs text-slate-500">Short sessions build real skill.</div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/3 bg-slate-900 opacity-70" />
      </div>

      <div className="mt-3 text-xs text-slate-600">
        Tip: If you miss a question, it will appear again at the end of this quiz.
      </div>
    </div>
  );
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

  // weekly info (from backend GET /api/assessments/:id)
  const [weekly, setWeekly] = useState(null); // { weekStart, goalCorrect, correct, incorrect, remainingCorrect, inRampUp, sessionCap }

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionNo]: selectedIndex }

  // per-question state
  const [revealed, setRevealed] = useState(false);
  const [pickedIndex, setPickedIndex] = useState(null);

  // retry wrong at end of quiz
  const redoQueueRef = useRef([]); // array of question objects to append
  const redoSetRef = useRef(new Set()); // questionNo set to avoid duplicates
  const [baseTotalCount, setBaseTotalCount] = useState(0); // to detect when we're at end of initial set

  // final result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // session counters (this page load)
  const [sessionAnswered, setSessionAnswered] = useState(0);

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

  const weeklyLabel = useMemo(() => {
    if (!weekly) return null;
    const goal = weekly.goalCorrect ?? null;
    const correct = weekly.correct ?? null;
    const remaining = weekly.remainingCorrect ?? null;
    if (typeof goal !== "number" || typeof correct !== "number" || typeof remaining !== "number") return null;

    return {
      weekStart: weekly.weekStart || mondayOfThisWeekISODate(),
      goal,
      correct,
      remaining,
      inRampUp: !!weekly.inRampUp
    };
  }, [weekly]);

  const capActive = weekly?.sessionCap === 15;

  const shouldStopForCap = useMemo(() => {
    if (!capActive) return false;
    return sessionAnswered >= 15;
  }, [capActive, sessionAnswered]);

  const isCorrect = useMemo(() => {
    if (!current) return null;
    if (pickedIndex == null) return null;
    return Number(current.correctIndex) === Number(pickedIndex);
  }, [current, pickedIndex]);

  const loadAssessment = async () => {
    setErr("");
    setLoading(true);

    try {
      const out = await apiFetch(`/api/assessments/${aid}`);
      setAssessment(out.assessment || null);

      setQuestionLimit(typeof out.questionLimit === "number" ? out.questionLimit : null);
      setWeekly(out.weekly || null);

      const normalized = (out.questions || []).map((q) => ({
        questionNo: q.question_no,
        text: q.question,
        options: normalizeOptions(q.options),
        correctIndex:
          typeof q.correct_index === "number"
            ? q.correct_index
            : Number(q.correct_index),
        explanation: q.explanation || "",
        topic: q.topic || null
      }));

      // reset quiz state
      setQuestions(normalized);
      setBaseTotalCount(normalized.length);
      setIdx(0);
      setAnswers({});
      setRevealed(false);
      setPickedIndex(null);
      setResult(null);

      // reset redo tracking
      redoQueueRef.current = [];
      redoSetRef.current = new Set();

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

  const pick = (optIndex) => {
    if (!current) return;
    if (revealed) return;

    const qNo = current.questionNo ?? idx + 1;

    setAnswers((prev) => ({ ...prev, [qNo]: optIndex }));
    setPickedIndex(optIndex);
    setRevealed(true);

    // If wrong, queue for the end of THIS quiz (one time)
    const correct = Number(current.correctIndex) === Number(optIndex);
    if (!correct) {
      const set = redoSetRef.current;
      if (!set.has(qNo)) {
        set.add(qNo);
        redoQueueRef.current.push(current);
      }
    }
  };

  const appendRedoIfNeeded = () => {
    // If we're at the end of the initial set, and we have redo questions, append them once.
    // This ensures wrong questions appear at the end of the same quiz.
    const atEndOfBase = baseTotalCount > 0 && idx >= baseTotalCount - 1;
    const hasRedo = redoQueueRef.current.length > 0;

    if (atEndOfBase && hasRedo) {
      const redo = redoQueueRef.current;
      redoQueueRef.current = []; // clear so we don't append twice
      setQuestions((prev) => [...prev, ...redo]);
      return true; // appended
    }
    return false;
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

      // Update session counters
      const attemptCorrect = typeof out.correct === "number" ? out.correct : 0;
      const attemptTotal = typeof out.total === "number" ? out.total : total;
      const attemptIncorrect = Math.max(0, attemptTotal - attemptCorrect);

      setSessionAnswered((n) => n + attemptTotal);

      // Update weekly progress client-side (backend is source of truth, but this keeps UI responsive)
      setWeekly((prev) => {
        if (!prev) return prev;
        const nextCorrect = (prev.correct ?? 0) + attemptCorrect;
        const nextIncorrect = (prev.incorrect ?? 0) + attemptIncorrect;
        const goal = prev.goalCorrect ?? 0;
        const remaining = Math.max(0, goal - nextCorrect);
        return { ...prev, correct: nextCorrect, incorrect: nextIncorrect, remainingCorrect: remaining };
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

    // If we're at end, append redo questions (if any) before submitting
    if (idx >= total - 1) {
      const appended = appendRedoIfNeeded();
      if (appended) {
        // move forward to the newly appended question
        setIdx((i) => i + 1);
        setRevealed(false);
        setPickedIndex(null);
        return;
      }

      await submitAttempt();
      return;
    }

    setIdx((i) => i + 1);
    setRevealed(false);
    setPickedIndex(null);
  };

  const backToModule = () => nav(`/modules/${moduleId}`);

  // Start another short quiz (new random set) without losing session counters
  const continueWeekly = async () => {
    if (shouldStopForCap) return;
    await loadAssessment();
  };

  // Try again without full reload of page state (still reloads the quiz content)
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

  // Focus areas (topics) for this attempt: based on final answers vs correctIndex
  const focusAreas = useMemo(() => {
    if (!result) return [];
    if (!questions || questions.length === 0) return [];

    const byTopic = new Map();
    const uniq = new Map(); // questionNo -> question object (avoid duplicates if repeated)
    for (const q of questions) {
      if (!q?.questionNo) continue;
      if (!uniq.has(q.questionNo)) uniq.set(q.questionNo, q);
    }

    for (const [qNo, q] of uniq.entries()) {
      const ans = answers?.[qNo];
      if (typeof ans !== "number") continue;
      const wrong = Number(ans) !== Number(q.correctIndex);
      if (!wrong) continue;

      const topic = (q.topic || "General").trim();
      byTopic.set(topic, (byTopic.get(topic) || 0) + 1);
    }

    return Array.from(byTopic.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, count }));
  }, [result, questions, answers]);

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

    const weeklyDone = (weekly?.remainingCorrect ?? null) === 0;

    return (
      <div className="space-y-4">
        <div className="card p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold">{assessment?.title || "Assessment"}</h1>
            <div className="mt-1 text-sm text-slate-600">
              {t("assessmentRunner.passing")}: {passingScore}%
            </div>

            {weeklyLabel ? (
              <div className="mt-2 text-sm text-slate-700">
                <span className="font-extrabold">Weekly goal:</span>{" "}
                {weeklyLabel.correct}/{weeklyLabel.goal} correct{" "}
                {weeklyLabel.remaining > 0 ? (
                  <span className="text-slate-500">(remaining: {weeklyLabel.remaining})</span>
                ) : null}
                {weeklyLabel.inRampUp ? (
                  <span className="ml-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    Ramp-Up
                  </span>
                ) : null}
              </div>
            ) : null}

            {capActive ? (
              <div className="mt-1 text-xs text-slate-500">
                Session control active due to repeated mistakes. If needed, the system will stop at 15 questions and continue later.
              </div>
            ) : null}
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

          {/* Focus areas */}
          {focusAreas.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-extrabold text-slate-900">Focus areas</div>
              <div className="mt-1 text-sm text-slate-700">
                Review these topics before the next quiz:
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {focusAreas.map((fa) => (
                  <span
                    key={fa.topic}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800"
                  >
                    {fa.topic} ({fa.count})
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Weekly completion message */}
          {weeklyDone ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-extrabold">Week complete — excellent work.</div>
              <div className="mt-1 text-emerald-900/90">
                You met this week’s learning goal. That consistency builds real skill and protects the team.
              </div>
            </div>
          ) : null}

          {/* Session cap message */}
          {shouldStopForCap ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-extrabold">Session limit reached.</div>
              <div className="mt-1 text-amber-900/90">
                You’ve answered 15 questions in this session. Take a break and continue later to lock in the material.
              </div>
            </div>
          ) : null}

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

            {/* Continue weekly quizzes until goal is hit */}
            {!weeklyDone ? (
              <button
                className="btn-primary rounded-2xl px-4 py-2 text-sm font-extrabold disabled:opacity-60"
                onClick={continueWeekly}
                disabled={shouldStopForCap}
                type="button"
              >
                Continue (next quiz)
              </button>
            ) : (
              <button
                className="btn-primary rounded-2xl px-4 py-2 text-sm font-extrabold"
                onClick={continueWeekly}
                type="button"
              >
                Keep learning
              </button>
            )}

            <button
              className="btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold"
              onClick={backToModule}
              type="button"
            >
              {weeklyDone ? "See you next week" : t("assessmentRunner.keepLearning")}
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
  <div className="min-h-[calc(100vh-140px)] flex flex-col">
    {/* MAIN CARD */}
    <div className="card p-6 space-y-4">
      {/* HEADER (more structured + fills empty right area) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight">
              {assessment?.title || "Assessment"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Focus mode
              </span>

              {weeklyLabel?.inRampUp ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  Ramp-Up
                </span>
              ) : null}

              {capActive ? (
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Session control ON
                </span>
              ) : null}
            </div>
          </div>

          <button
            className="btn-outline-sm rounded-2xl px-4 py-2 text-sm font-extrabold"
            onClick={backToModule}
            type="button"
          >
            {t("assessmentRunner.exit")}
          </button>
        </div>

        {/* Compact stats grid (fills the empty right area on mobile) */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Question
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">
              {idx + 1} of {total}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              This attempt
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">
              {typeof questionLimit === "number" ? questionLimit : total}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Week goal
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">
              {weeklyLabel ? `${weeklyLabel.correct}/${weeklyLabel.goal}` : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Remaining
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">
              {weeklyLabel ? weeklyLabel.remaining : "—"}
            </div>
          </div>
        </div>

        {/* short helper line */}
        <div className="mt-3 text-xs text-slate-500">
          Tip: wrong answers repeat at the end of this quiz.
        </div>
      </div>

      {/* Divider — makes a clear separation from the question */}
      <div className="h-px bg-slate-200" />

      {shouldStopForCap ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-extrabold">Session limit reached.</div>
          <div className="mt-1 text-amber-900/90">
            You’ve answered 15 questions in this session. Take a break and continue later.
          </div>
        </div>
      ) : null}

      {/* QUESTION CARD (more separation + “cheerful” feel) */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Question
        </div>

        <div className="mt-2 text-base font-extrabold text-slate-900">
          {current.text || t("assessmentRunner.questionFallback")}
        </div>

        {current.topic ? (
          <div className="mt-3 text-xs text-slate-500">
            Topic:{" "}
            <span className="font-semibold text-slate-700">{current.topic}</span>
          </div>
        ) : null}
      </div>

      {/* ANSWERS GROUP */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 ring-1 ring-slate-100">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Choose one answer
        </div>

        <div className="mt-3 grid gap-2">
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
                disabled={revealed || shouldStopForCap}
                onClick={() => pick(optIndex)}
                type="button"
              >
                <div className="text-sm font-semibold text-slate-900">{opt}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {revealed ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {isCorrect ? (
            <>
              <div className="font-extrabold">{t("assessmentRunner.correctTitle")}</div>
              <div className="mt-1">{current.explanation || t("assessmentRunner.correctBody")}</div>
            </>
          ) : (
            <>
              <div className="font-extrabold">{t("assessmentRunner.wrongTitle")}</div>
              <div className="mt-1">{current.explanation || t("assessmentRunner.wrongBody")}</div>
              {Number.isFinite(Number(current.correctIndex)) ? (
                <div className="mt-2">
                  <span className="font-semibold">{t("assessmentRunner.correctAnswer")}:</span>{" "}
                  {current.options?.[Number(current.correctIndex)] ?? "—"}
                </div>
              ) : null}
              <div className="mt-2 text-xs text-slate-500">
                This question will reappear at the end of this quiz.
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          className="btn-primary rounded-2xl px-4 py-2 text-sm font-extrabold disabled:opacity-60"
          onClick={next}
          disabled={!revealed || submitting || shouldStopForCap}
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

    {/* FOOTER FILLER (occupies the empty space) */}
    <div className="flex-1" />
    <AssessmentFooter />
  </div>
  );
}
