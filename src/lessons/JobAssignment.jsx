/**
 * JobAssignment — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. The Priority Queue     — Tech dispatch number cards, click for profile
 *   2. Override Rules         — 7 expandable rules with examples
 *   3. Scenario Practice      — 4 real-world "who do you assign?" challenges
 *   4. Final Quiz             — 3 case-study questions
 *
 * All content strings come from i18n keys under "lessons.jobAssignment.*"
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const B_BLUE   = "#1E6FAE";
const B_ORANGE = "#F7941D";
const B_GREEN  = "#22c55e";
const B_RED    = "#ef4444";
const B_SOFT   = "#E6F1FA";
const B_VIOLET = "#7c3aed";

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionCard({ children, title, subtitle, icon }) {
  return (
    <div className="lesson-section rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoBox({ children, color = "blue" }) {
  const cls = color === "orange"
    ? "bg-orange-50 border-orange-200 text-orange-800"
    : color === "green"
    ? "bg-green-50 border-green-200 text-green-800"
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Priority Queue ────────────────────────────────────────────────

// Current dispatch order — matches payroll portal tech_order field
const TECHS = [
  { key: "romel",    num: 1, color: B_VIOLET },
  { key: "juan",     num: 2, color: B_BLUE   },
  { key: "eluzahin", num: 3, color: B_BLUE   },
  { key: "kevin",    num: 4, color: B_ORANGE },
  { key: "ivan",     num: 5, color: "#64748b" },
];

function QueueSection({ onComplete }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  return (
    <SectionCard
      icon="📋"
      title={t("lessons.jobAssignment.section1Title")}
      subtitle={t("lessons.jobAssignment.section1Subtitle")}
    >
      {/* Queue visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
        {TECHS.map((tech) => {
          const isSelected = selected === tech.key;
          return (
            <button
              key={tech.key}
              onClick={() => setSelected(isSelected ? null : tech.key)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center"
              style={{
                borderColor: isSelected ? tech.color : "#e2e8f0",
                background:  isSelected ? tech.color + "12" : "#f8fafc",
              }}
            >
              {/* Dispatch badge */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-extrabold shadow-sm"
                style={{ background: tech.color }}
              >
                {tech.num}
              </div>
              <p className="text-sm font-extrabold text-slate-800 capitalize leading-tight">
                {t(`lessons.jobAssignment.techs.${tech.key}.name`)}
              </p>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: tech.color + "20", color: tech.color }}
              >
                #{tech.num}
              </span>
            </button>
          );
        })}
      </div>

      {/* Profile panel */}
      {selected && (() => {
        const tech = TECHS.find((t) => t.key === selected);
        return (
          <div
            className="rounded-2xl border-2 p-4 mb-4 transition-all"
            style={{ borderColor: tech.color, background: tech.color + "0C" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-base"
                style={{ background: tech.color }}
              >
                {tech.num}
              </div>
              <div>
                <p className="font-extrabold text-slate-800 capitalize">
                  {t(`lessons.jobAssignment.techs.${tech.key}.name`)} — {t("lessons.jobAssignment.queueLabel")} #{tech.num}
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tech.color }}>
              {t("lessons.jobAssignment.techProfile")}
            </p>
            <p className="text-sm text-slate-700">
              {t(`lessons.jobAssignment.techs.${tech.key}.profile`)}
            </p>
          </div>
        );
      })()}

      <InfoBox>
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t("lessons.jobAssignment.section1Tip")}
      </InfoBox>

      <button
        onClick={onComplete}
        className="mt-4 px-5 py-2 rounded-2xl text-sm font-extrabold text-white"
        style={{ background: B_BLUE }}
      >
        {t("lessons.sectionComplete")} ✓
      </button>
    </SectionCard>
  );
}

// ─── SECTION 2: Override Rules ────────────────────────────────────────────────

const OVERRIDE_RULES = [
  { key: "punctuality",    icon: "🕐", colorClass: "bg-red-50    border-red-200    text-red-800"    },
  { key: "committedTime",  icon: "⏱️", colorClass: "bg-amber-50  border-amber-200  text-amber-800"  },
  { key: "waitingCustomer",icon: "🛋️", colorClass: "bg-blue-50   border-blue-200   text-blue-800"   },
  { key: "abandonedWork",  icon: "🔄", colorClass: "bg-orange-50  border-orange-200 text-orange-800" },
  { key: "skillGap",       icon: "❌", colorClass: "bg-purple-50  border-purple-200 text-purple-800" },
  { key: "rejectionLimit", icon: "✋", colorClass: "bg-slate-50   border-slate-300  text-slate-800"  },
  { key: "returnVehicle",  icon: "🔁", colorClass: "bg-green-50   border-green-200  text-green-800"  },
  { key: "warrantyReturn", icon: "🛡️", colorClass: "bg-teal-50    border-teal-200   text-teal-800"   },
];

function RulesSection({ onComplete }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(null);
  const toggle = (key) => setExpanded(expanded === key ? null : key);

  return (
    <SectionCard
      icon="⚠️"
      title={t("lessons.jobAssignment.section2Title")}
      subtitle={t("lessons.jobAssignment.section2Subtitle")}
    >
      <div className="space-y-2 mb-5">
        {OVERRIDE_RULES.map((rule, idx) => {
          const isOpen = expanded === rule.key;
          return (
            <div
              key={rule.key}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${isOpen ? rule.colorClass : "bg-white border-slate-200"}`}
            >
              <button
                type="button"
                onClick={() => toggle(rule.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-xl w-8 text-center flex-shrink-0">{rule.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-slate-800 text-sm leading-tight">
                    <span className="text-slate-400 font-mono mr-1.5 text-xs">{idx + 1}.</span>
                    {t(`lessons.jobAssignment.rules.${rule.key}.label`)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t(`lessons.jobAssignment.rules.${rule.key}.short`)}
                  </p>
                </div>
                <span className="text-slate-400 text-xs font-bold flex-shrink-0">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-current/20 pt-3">
                    <p className="text-sm">
                      {t(`lessons.jobAssignment.rules.${rule.key}.detail`)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <InfoBox color="orange">
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t("lessons.jobAssignment.section2Tip")}
      </InfoBox>

      <button
        onClick={onComplete}
        className="mt-4 px-5 py-2 rounded-2xl text-sm font-extrabold text-white"
        style={{ background: B_BLUE }}
      >
        {t("lessons.sectionComplete")} ✓
      </button>
    </SectionCard>
  );
}

// ─── SECTION 3: Interactive Dispatch Simulator ───────────────────────────────

// Tech state configs — visual only
const STATE_CFG = {
  free:      { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  busy:      { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  late:      { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
  committed: { bg: "#f0f9ff", border: "#7dd3fc", text: "#0369a1" },
  absent:    { bg: "#f1f5f9", border: "#cbd5e1", text: "#94a3b8" },
};

// 6 job scenarios covering the 6 most common override situations
const SIM_JOBS = [
  {
    key: "sim1",
    ruleKey: "normal",
    correctTech: "romel",
    techStates: { romel:"free", juan:"free", eluzahin:"free", kevin:"free", ivan:"free" },
  },
  {
    key: "sim2",
    ruleKey: "waitingCustomer",
    correctTech: "eluzahin",
    techStates: { romel:"busy", juan:"busy", eluzahin:"free", kevin:"free", ivan:"free" },
  },
  {
    key: "sim3",
    ruleKey: "returnVehicle",
    correctTech: "kevin",
    techStates: { romel:"free", juan:"free", eluzahin:"free", kevin:"free", ivan:"free" },
  },
  {
    key: "sim4",
    ruleKey: "punctuality",
    correctTech: "ivan",
    techStates: { romel:"busy", juan:"busy", eluzahin:"busy", kevin:"late", ivan:"free" },
  },
  {
    key: "sim5",
    ruleKey: "committedTime",
    correctTech: "eluzahin",
    techStates: { romel:"busy", juan:"committed", eluzahin:"free", kevin:"free", ivan:"free" },
  },
  {
    key: "sim6",
    ruleKey: "skillGap",
    correctTech: "romel",
    techStates: { romel:"free", juan:"absent", eluzahin:"free", kevin:"free", ivan:"free" },
  },
];

function SimulatorSection({ onComplete }) {
  const { t } = useTranslation();
  const [jobIdx, setJobIdx] = useState(0);
  const [results, setResults] = useState({});   // { sim1: "correct"|"incorrect" }
  const [chosen, setChosen]   = useState(null); // tech key chosen for this job
  const [allDone, setAllDone] = useState(false);

  const job       = SIM_JOBS[jobIdx];
  const isCorrect = chosen === job.correctTech;
  const correct   = Object.values(results).filter((r) => r === "correct").length;
  const PASS      = 4; // need 4/6 to unlock section complete

  function handleAssign(techKey) {
    if (chosen) return;
    const right = techKey === job.correctTech;
    setChosen(techKey);
    setResults((prev) => ({ ...prev, [job.key]: right ? "correct" : "incorrect" }));
  }

  function handleNext() {
    if (jobIdx < SIM_JOBS.length - 1) {
      setJobIdx((i) => i + 1);
      setChosen(null);
    } else {
      setAllDone(true);
    }
  }

  if (allDone) {
    const finalScore = correct;
    return (
      <SectionCard icon="🎮" title={t("lessons.jobAssignment.section3Title")} subtitle={t("lessons.jobAssignment.section3Subtitle")}>
        <div className="rounded-2xl border-2 p-6 text-center" style={{
          borderColor: finalScore >= PASS ? B_GREEN : finalScore >= 3 ? B_BLUE : B_ORANGE,
          background:  finalScore >= PASS ? "#f0fdf4" : finalScore >= 3 ? B_SOFT : "#fff7ed",
        }}>
          <div className="text-4xl mb-2">{finalScore >= PASS ? "🎉" : finalScore >= 3 ? "👍" : "📚"}</div>
          <p className="text-2xl font-extrabold text-slate-800 mb-1">{finalScore} / {SIM_JOBS.length}</p>
          <p className="text-sm text-slate-600 mb-4">
            {finalScore >= PASS ? t("lessons.scoreExcellent") : finalScore >= 3 ? t("lessons.scoreGood") : t("lessons.scoreReview")}
          </p>
          {finalScore < PASS && (
            <button
              onClick={() => { setJobIdx(0); setChosen(null); setResults({}); setAllDone(false); }}
              className="mr-2 px-5 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_BLUE }}
            >
              {t("lessons.tryAgain")}
            </button>
          )}
          {finalScore >= PASS && (
            <button
              onClick={onComplete}
              className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_GREEN }}
            >
              {t("lessons.sectionComplete")} ✓
            </button>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon="🎮" title={t("lessons.jobAssignment.section3Title")} subtitle={t("lessons.jobAssignment.section3Subtitle")}>

      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-4">
        {SIM_JOBS.map((j, i) => (
          <div key={j.key} className="h-2.5 rounded-full transition-all" style={{
            flex: i === jobIdx ? 2.5 : 1,
            background: results[j.key] === "correct"
              ? B_GREEN
              : results[j.key] === "incorrect"
              ? B_ORANGE
              : i === jobIdx ? B_BLUE : "#e2e8f0",
          }} />
        ))}
        <span className="text-xs text-slate-500 font-bold ml-1 whitespace-nowrap">
          {Object.keys(results).length} / {SIM_JOBS.length}
        </span>
      </div>

      {/* Incoming job card */}
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("lessons.jobAssignment.simulator.jobLabel")} {jobIdx + 1}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
            style={{ background: B_BLUE + "18", color: B_BLUE }}>
            {t(`lessons.jobAssignment.simulator.rules.${job.ruleKey}`)}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
          {t(`lessons.jobAssignment.simulator.${job.key}.situation`)}
        </p>
        {!chosen && (
          <p className="text-xs font-bold mt-2" style={{ color: B_BLUE }}>
            👇 {t("lessons.jobAssignment.simulator.clickToAssign")}
          </p>
        )}
      </div>

      {/* Tech dispatch board — click to assign */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {TECHS.map((tech) => {
          const state     = job.techStates[tech.key] ?? "free";
          const cfg       = STATE_CFG[state];
          const isAbsent  = state === "absent";
          const isChosen  = chosen === tech.key;
          const isCorrectTech = tech.key === job.correctTech;

          // Border/bg after selection
          let borderColor = cfg.border;
          let bgColor     = cfg.bg;
          if (chosen) {
            if (isCorrectTech)       { borderColor = B_GREEN; bgColor = "#f0fdf4"; }
            else if (isChosen)       { borderColor = B_RED;   bgColor = "#fef2f2"; }
            else                     { borderColor = "#e2e8f0"; bgColor = "#f8fafc"; }
          }

          return (
            <button
              key={tech.key}
              onClick={() => !isAbsent && handleAssign(tech.key)}
              disabled={isAbsent || !!chosen}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all text-center disabled:cursor-default"
              style={{ borderColor, background: bgColor }}
            >
              {/* Number badge */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                style={{
                  background: chosen
                    ? (isCorrectTech ? B_GREEN : isChosen ? B_RED : "#94a3b8")
                    : (isAbsent ? "#cbd5e1" : tech.color),
                }}
              >
                {chosen && isCorrectTech ? "✓" : chosen && isChosen && !isCorrect ? "✗" : tech.num}
              </div>

              {/* Name */}
              <p className="text-[10px] font-extrabold text-slate-700 capitalize leading-tight">
                {t(`lessons.jobAssignment.techs.${tech.key}.name`)}
              </p>

              {/* State badge */}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight"
                style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                {t(`lessons.jobAssignment.simulator.states.${state}`)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {chosen && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          isCorrect
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          <strong>
            {isCorrect
              ? `✓ ${t("lessons.jobAssignment.correct")}!`
              : `✗ ${t("lessons.jobAssignment.incorrect")}`}
          </strong>{" "}
          {t(`lessons.jobAssignment.simulator.${job.key}.explanation`)}
        </div>
      )}

      {/* Next / Finish button */}
      {chosen && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white"
            style={{ background: B_BLUE }}
          >
            {jobIdx < SIM_JOBS.length - 1 ? t("lessons.next") : t("lessons.jobAssignment.simulator.seeResults")}
          </button>
        </div>
      )}
    </SectionCard>
  );
}

// ─── SECTION 4: Quiz ─────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    id: 1, qKey: "q1", expKey: "q1exp",
    options: [
      { id: "a", tKey: "q1a", correct: false },
      { id: "b", tKey: "q1b", correct: true  },
      { id: "c", tKey: "q1c", correct: false },
      { id: "d", tKey: "q1d", correct: false },
    ],
  },
  {
    id: 2, qKey: "q2", expKey: "q2exp",
    options: [
      { id: "a", tKey: "q2a", correct: false },
      { id: "b", tKey: "q2b", correct: false },
      { id: "c", tKey: "q2c", correct: true  },
      { id: "d", tKey: "q2d", correct: false },
    ],
  },
  {
    id: 3, qKey: "q3", expKey: "q3exp",
    options: [
      { id: "a", tKey: "q3a", correct: false },
      { id: "b", tKey: "q3b", correct: false },
      { id: "c", tKey: "q3c", correct: true  },
      { id: "d", tKey: "q3d", correct: false },
    ],
  },
];

function QuizSection({ onComplete }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const allDone = Object.keys(answers).length === QUIZ_QUESTIONS.length;
  const score   = QUIZ_QUESTIONS.filter((q) => {
    const sel = answers[q.id];
    return sel && q.options.find((o) => o.id === sel)?.correct;
  }).length;

  return (
    <SectionCard
      icon="📝"
      title={t("lessons.jobAssignment.section4Title")}
      subtitle={t("lessons.jobAssignment.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.jobAssignment.quiz.${q.qKey}`)}
              </div>
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const iChosen = chosen === opt.id;
                  let bg = "bg-white border-slate-200 hover:border-blue-300";
                  let badge = null;
                  if (iChosen) {
                    bg    = opt.correct ? "border-brand-primary bg-blue-50" : "border-brand-accent bg-orange-50";
                    badge = opt.correct
                      ? <span className="ml-2 text-xs font-extrabold text-blue-700">✓ {t("lessons.correct")}</span>
                      : <span className="ml-2 text-xs font-extrabold text-orange-700">✗ {t("lessons.incorrect")}</span>;
                  } else if (chosen && opt.correct) {
                    bg = "border-blue-200 bg-blue-50/60";
                  }
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !chosen && setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                      disabled={!!chosen}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${bg} disabled:cursor-default`}
                    >
                      <span className="mr-2 text-slate-500">{opt.id.toUpperCase()}.</span>
                      {t(`lessons.jobAssignment.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.jobAssignment.quiz.${q.expKey}`)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div
          className="mt-6 rounded-2xl border-2 p-5 text-center"
          style={{
            borderColor: score === 3 ? B_GREEN : score >= 2 ? B_BLUE : B_ORANGE,
            background:  score === 3 ? "#f0fdf4" : score >= 2 ? B_SOFT : "#fff7ed",
          }}
        >
          <div className="text-3xl mb-2">{score === 3 ? "🎉" : score >= 2 ? "👍" : "📚"}</div>
          <div className="text-xl font-extrabold text-slate-800 mb-1">
            {score} {t("lessons.outOf", { total: QUIZ_QUESTIONS.length })}
          </div>
          <div className="text-sm text-slate-600">
            {score === 3 ? t("lessons.scoreExcellent") : score >= 2 ? t("lessons.scoreGood") : t("lessons.scoreReview")}
          </div>
          {score < 3 && (
            <button
              onClick={() => setAnswers({})}
              className="mt-3 px-4 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_BLUE }}
            >
              {t("lessons.tryAgain")}
            </button>
          )}
          {score === 3 && onComplete && (
            <button
              onClick={onComplete}
              className="mt-3 px-4 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_GREEN }}
            >
              {t("lessons.markLessonComplete")}
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export function JobAssignment() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress   = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "queue",     labelKey: "lessons.jobAssignment.navPills.queue"     },
    { id: "rules",     labelKey: "lessons.jobAssignment.navPills.rules"     },
    { id: "scenarios", labelKey: "lessons.jobAssignment.navPills.scenarios" },
    { id: "quiz",      labelKey: "lessons.jobAssignment.navPills.quiz"      },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: B_BLUE }}>
              📖 {t("lessons.interactiveLesson")}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              {t("lessons.jobAssignment.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.jobAssignment.description")}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-slate-500 mb-1">{t("lessons.progressLabel")}</div>
            <div className="w-32 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: B_BLUE }}
              />
            </div>
            <div className="text-xs font-extrabold mt-1" style={{ color: B_BLUE }}>
              {completedSections.size} / 4 {t("lessons.sections")}
            </div>
          </div>
        </div>

        {/* Nav pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {NAV_PILLS.map((s) => (
            <a
              key={s.id}
              href={`#job-lesson-${s.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition-all"
              style={{
                borderColor: completedSections.has(s.id) ? B_GREEN : "#e2e8f0",
                background:  completedSections.has(s.id) ? "#f0fdf4" : "white",
                color:       completedSections.has(s.id) ? B_GREEN : "#64748b",
              }}
            >
              {completedSections.has(s.id) ? "✓ " : ""}{t(s.labelKey)}
            </a>
          ))}
        </div>
      </div>

      {/* ── Completed banner ── */}
      {lessonDone && (
        <div className="rounded-3xl border-2 border-green-300 bg-green-50 p-5 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="font-extrabold text-green-800 text-lg">{t("lessons.lessonComplete")}</p>
          <p className="text-sm text-green-700 mt-1">
            {t("lessons.lessonCompleteBody", { title: t("lessons.jobAssignment.title") })}
          </p>
        </div>
      )}

      {/* ── Section 1: Priority Queue ── */}
      <div id="job-lesson-queue">
        <QueueSection onComplete={() => markSection("queue")} />
      </div>

      {/* ── Section 2: Override Rules ── */}
      <div id="job-lesson-rules">
        <RulesSection onComplete={() => markSection("rules")} />
      </div>

      {/* ── Section 3: Dispatch Simulator ── */}
      <div id="job-lesson-scenarios">
        <SimulatorSection onComplete={() => markSection("scenarios")} />
      </div>

      {/* ── Section 4: Quiz ── */}
      <div id="job-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
