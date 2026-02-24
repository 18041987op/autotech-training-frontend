/**
 * VehicleSafety — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Lift Types — interactive lift type selector with SVG
 *   2. Safe Lift Procedure — step-by-step animated steps
 *   3. PPE & Safety Rules — interactive checklist
 *   4. Mini-Quiz — 3 safety questions
 *
 * All content strings come from i18n keys under "lessons.vehicleSafety.*"
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const B_BLUE   = "#1E6FAE";
const B_ORANGE = "#F7941D";
const B_SOFT   = "#E6F1FA";
const B_GREEN  = "#22c55e";
const B_RED    = "#ef4444";
const B_YELLOW = "#eab308";

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
    : color === "red"
    ? "bg-red-50 border-red-200 text-red-800"
    : color === "green"
    ? "bg-green-50 border-green-200 text-green-800"
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Lift Types ────────────────────────────────────────────────────
const LIFT_TYPES = ["twoPost", "fourPost", "scissor", "floor"];

function LiftTypesSection() {
  const { t } = useTranslation();
  const [liftType, setLiftType] = useState("twoPost");

  const LIFT_COLORS = {
    twoPost:  B_BLUE,
    fourPost: B_ORANGE,
    scissor:  B_GREEN,
    floor:    "#8b5cf6",
  };

  const color = LIFT_COLORS[liftType];

  return (
    <SectionCard
      icon="🏗️"
      title={t("lessons.vehicleSafety.section1Title")}
      subtitle={t("lessons.vehicleSafety.section1Subtitle")}
    >
      {/* Lift type buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        {LIFT_TYPES.map((id) => (
          <button key={id} onClick={() => setLiftType(id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all"
            style={{
              borderColor: liftType === id ? LIFT_COLORS[id] : "#e2e8f0",
              background:  liftType === id ? LIFT_COLORS[id] + "18" : "white",
              color:       liftType === id ? LIFT_COLORS[id] : "#64748b",
            }}>
            {t(`lessons.vehicleSafety.lifts.${id}.label`)}
          </button>
        ))}
      </div>

      {/* Lift diagram SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 380 200" className="w-full max-w-md" style={{ fontFamily: "sans-serif" }}>

          {/* Floor line */}
          <line x1="20" y1="180" x2="360" y2="180" stroke="#94a3b8" strokeWidth="3" />

          {/* Car body */}
          <rect x="100" y="90" width="180" height="55" rx="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect x="130" y="75" width="120" height="20" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="190" y="122" textAnchor="middle" fontSize="11" fill="#475569">🚗</text>

          {/* 2-Post lift */}
          {liftType === "twoPost" && (
            <>
              <rect x="80" y="80" width="14" height="100" rx="4" fill={color} />
              <rect x="306" y="80" width="14" height="100" rx="4" fill={color} />
              <rect x="70" y="140" width="34" height="8" rx="3" fill={color} opacity="0.7" />
              <rect x="296" y="140" width="34" height="8" rx="3" fill={color} opacity="0.7" />
              <text x="55" y="170" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">POST</text>
              <text x="325" y="170" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">POST</text>
            </>
          )}

          {/* 4-Post lift */}
          {liftType === "fourPost" && (
            <>
              {[70, 170, 270].map((x) => (
                <rect key={x} x={x} y="75" width="10" height="105" rx="3" fill={color} />
              ))}
              <rect x="70" y="75" width="210" height="10" rx="3" fill={color} opacity="0.6" />
              <rect x="70" y="170" width="210" height="10" rx="3" fill={color} opacity="0.6" />
              <text x="190" y="195" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">4-POST RUNWAY LIFT</text>
            </>
          )}

          {/* Scissor lift */}
          {liftType === "scissor" && (
            <>
              <line x1="110" y1="145" x2="210" y2="180" stroke={color} strokeWidth="6" strokeLinecap="round" />
              <line x1="210" y1="145" x2="110" y2="180" stroke={color} strokeWidth="6" strokeLinecap="round" />
              <rect x="100" y="140" width="120" height="8" rx="3" fill={color} />
              <text x="160" y="195" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">SCISSOR LIFT</text>
            </>
          )}

          {/* Floor jack */}
          {liftType === "floor" && (
            <>
              <rect x="130" y="148" width="120" height="8" rx="4" fill={color} />
              <circle cx="150" cy="165" r="10" fill={color} />
              <circle cx="260" cy="165" r="10" fill={color} />
              <line x1="190" y1="148" x2="190" y2="165" stroke={color} strokeWidth="6" strokeLinecap="round" />
              <text x="190" y="195" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">FLOOR JACK</text>
            </>
          )}
        </svg>
      </div>

      {/* Description */}
      <div className="rounded-2xl border-2 p-4 text-sm mb-4"
        style={{ borderColor: color, background: color + "10" }}>
        <div className="font-extrabold text-slate-800 mb-1">
          {t(`lessons.vehicleSafety.lifts.${liftType}.title`)}
        </div>
        <div className="text-slate-700 mb-2">
          {t(`lessons.vehicleSafety.lifts.${liftType}.desc`)}
        </div>
        <div className="text-xs rounded-xl bg-white border border-slate-200 px-3 py-2">
          ✅ <strong>{t("lessons.vehicleSafety.bestFor")}:</strong>{" "}
          {t(`lessons.vehicleSafety.lifts.${liftType}.bestFor`)}
        </div>
      </div>

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.vehicleSafety.section1Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 2: Safe Lift Procedure ──────────────────────────────────────────
const LIFT_STEPS = [
  { step: 1, key: "lift1", icon: "🔍", color: B_BLUE   },
  { step: 2, key: "lift2", icon: "📍", color: B_ORANGE },
  { step: 3, key: "lift3", icon: "⬆️", color: B_BLUE   },
  { step: 4, key: "lift4", icon: "🔒", color: B_GREEN  },
  { step: 5, key: "lift5", icon: "✅", color: B_GREEN  },
];

function LiftProcedureSection() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = LIFT_STEPS[step];

  // Car height visual
  const heights = [10, 30, 90, 90, 90];
  const carY = 160 - heights[step];

  return (
    <SectionCard
      icon="⬆️"
      title={t("lessons.vehicleSafety.section2Title")}
      subtitle={t("lessons.vehicleSafety.section2Subtitle")}
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {LIFT_STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="w-9 h-9 rounded-full text-sm font-extrabold border-2 transition-all"
            style={{
              background:  i === step ? B_BLUE : i < step ? B_SOFT : "white",
              borderColor: i === step ? B_BLUE : i < step ? B_BLUE : "#e2e8f0",
              color:       i === step ? "white" : i < step ? B_BLUE : "#94a3b8",
            }}>
            {i < step ? "✓" : s.step}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-1">
          {t("lessons.step")} {step + 1} {t("lessons.of")} {LIFT_STEPS.length}
        </span>
      </div>

      {/* Car lift SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 300 190" className="w-full max-w-sm">
          {/* Floor */}
          <line x1="10" y1="175" x2="290" y2="175" stroke="#94a3b8" strokeWidth="3" />

          {/* 2-post lift arms */}
          <rect x="50" y="100" width="10" height="75" rx="3" fill={B_BLUE} opacity="0.7" />
          <rect x="240" y="100" width="10" height="75" rx="3" fill={B_BLUE} opacity="0.7" />

          {/* Lift arms extending */}
          {step >= 2 && (
            <>
              <rect x="50" y={carY + 50} width="50" height="6" rx="2" fill={B_BLUE} />
              <rect x="200" y={carY + 50} width="50" height="6" rx="2" fill={B_BLUE} />
            </>
          )}

          {/* Jack stands when step >= 3 */}
          {step >= 3 && (
            <>
              <polygon points="70,175 85,175 77,155" fill={B_YELLOW} />
              <polygon points="215,175 230,175 222,155" fill={B_YELLOW} />
            </>
          )}

          {/* Car */}
          <g style={{ transition: "transform 0.4s ease" }}>
            <rect x="80" y={carY} width="140" height="45" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
            <rect x="105" y={carY - 14} width="90" height="18" rx="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="150" y={carY + 26} textAnchor="middle" fontSize="12">🚗</text>
          </g>

          {/* Lock pins indicator step 3+ */}
          {step >= 3 && (
            <>
              <circle cx="60" cy="155" r="5" fill={B_GREEN} />
              <circle cx="240" cy="155" r="5" fill={B_GREEN} />
            </>
          )}

          {/* Height label */}
          {step >= 2 && (
            <>
              <line x1="25" y1={carY + 50} x2="25" y2="175" stroke={B_BLUE} strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="17" y={carY + 100} fontSize="8" fill={B_BLUE} fontWeight="700">
                {heights[step]}"
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border-2 p-4 mb-4"
        style={{ borderColor: current.color, background: current.color + "10" }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{current.icon}</span>
          <div>
            <div className="font-extrabold text-slate-800 mb-1">
              {t(`lessons.vehicleSafety.liftSteps.${current.key}Title`)}
            </div>
            <div className="text-sm text-slate-700">
              {t(`lessons.vehicleSafety.liftSteps.${current.key}Desc`)}
            </div>
          </div>
        </div>
      </div>

      <InfoBox color={step === 2 ? "orange" : "blue"}>
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t(`lessons.vehicleSafety.liftSteps.${current.key}Tip`)}
      </InfoBox>

      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40">
          {t("lessons.previous")}
        </button>
        <button onClick={() => setStep((s) => Math.min(LIFT_STEPS.length - 1, s + 1))}
          disabled={step === LIFT_STEPS.length - 1}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white disabled:opacity-40"
          style={{ background: B_BLUE }}>
          {t("lessons.next")}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── SECTION 3: PPE Checklist ─────────────────────────────────────────────────
const PPE_ITEMS = [
  { id: "glasses",  icon: "🥽", color: B_BLUE   },
  { id: "gloves",   icon: "🧤", color: "#06b6d4" },
  { id: "boots",    icon: "👟", color: "#8b5cf6" },
  { id: "jacket",   icon: "🥋", color: B_ORANGE  },
  { id: "noRings",  icon: "💍", color: B_RED     },
  { id: "hairTied", icon: "💇", color: B_YELLOW  },
];

function PPESection() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(new Set());

  const toggle = (id) => setChecked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allChecked = checked.size === PPE_ITEMS.length;

  return (
    <SectionCard
      icon="🦺"
      title={t("lessons.vehicleSafety.section3Title")}
      subtitle={t("lessons.vehicleSafety.section3Subtitle")}
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        {PPE_ITEMS.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button key={item.id} onClick={() => toggle(item.id)}
              className="rounded-2xl border-2 p-4 text-left flex items-center gap-3 transition-all"
              style={{
                borderColor: isChecked ? item.color : "#e2e8f0",
                background:  isChecked ? item.color + "10" : "white",
              }}>
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-extrabold text-slate-800">
                  {t(`lessons.vehicleSafety.ppe.${item.id}.label`)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t(`lessons.vehicleSafety.ppe.${item.id}.why`)}
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                style={{
                  borderColor: isChecked ? item.color : "#94a3b8",
                  background:  isChecked ? item.color : "white",
                  color:       isChecked ? "white" : "#94a3b8",
                }}>
                {isChecked ? "✓" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-600">{t("lessons.vehicleSafety.ppeProgress")}</span>
          <span className="font-extrabold" style={{ color: B_BLUE }}>{checked.size} / {PPE_ITEMS.length}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(checked.size / PPE_ITEMS.length) * 100}%`, background: allChecked ? B_GREEN : B_BLUE }} />
        </div>
      </div>

      {allChecked ? (
        <InfoBox color="green">
          ✅ <strong>{t("lessons.vehicleSafety.ppeReady")}</strong> — {t("lessons.vehicleSafety.ppeReadyDesc")}
        </InfoBox>
      ) : (
        <InfoBox color="orange">
          ⚠️ <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.vehicleSafety.section3Tip")}
        </InfoBox>
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
      { id: "c", tKey: "q3c", correct: false },
      { id: "d", tKey: "q3d", correct: true  },
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
      title={t("lessons.vehicleSafety.section4Title")}
      subtitle={t("lessons.vehicleSafety.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.vehicleSafety.quiz.${q.qKey}`)}
              </div>
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const iChosen = chosen === opt.id;
                  let bg = "bg-white border-slate-200 hover:border-blue-300";
                  let badge = null;
                  if (iChosen) {
                    bg    = opt.correct ? "border-brand-primary bg-blue-50" : "border-brand-accent bg-orange-50";
                    badge = opt.correct
                      ? <span className="ml-2 text-xs font-extrabold text-blue-700">{t("lessons.correct")}</span>
                      : <span className="ml-2 text-xs font-extrabold text-orange-700">{t("lessons.incorrect")}</span>;
                  } else if (chosen && opt.correct) {
                    bg = "border-blue-200 bg-blue-50/60";
                  }
                  return (
                    <button key={opt.id}
                      onClick={() => !chosen && setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                      disabled={!!chosen}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${bg} disabled:cursor-default`}>
                      <span className="mr-2 text-slate-500">{opt.id.toUpperCase()}.</span>
                      {t(`lessons.vehicleSafety.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.vehicleSafety.quiz.${q.expKey}`)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-6 rounded-2xl border-2 p-5 text-center"
          style={{
            borderColor: score === 3 ? B_GREEN : score >= 2 ? B_BLUE : B_ORANGE,
            background:  score === 3 ? "#f0fdf4" : score >= 2 ? B_SOFT : "#fff7ed",
          }}>
          <div className="text-3xl mb-2">{score === 3 ? "🎉" : score >= 2 ? "👍" : "📚"}</div>
          <div className="text-xl font-extrabold text-slate-800 mb-1">
            {score} {t("lessons.outOf", { total: QUIZ_QUESTIONS.length })}
          </div>
          <div className="text-sm text-slate-600">
            {score === 3 ? t("lessons.scoreExcellent") : score >= 2 ? t("lessons.scoreGood") : t("lessons.scoreReview")}
          </div>
          {score < 3 && (
            <button onClick={() => setAnswers({})}
              className="mt-3 px-4 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_BLUE }}>
              {t("lessons.tryAgain")}
            </button>
          )}
          {score === 3 && onComplete && (
            <button onClick={onComplete}
              className="mt-3 px-4 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_GREEN }}>
              {t("lessons.markLessonComplete")}
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export function VehicleSafety() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "lifts",     labelKey: "lessons.vehicleSafety.navPills.lifts"     },
    { id: "procedure", labelKey: "lessons.vehicleSafety.navPills.procedure" },
    { id: "ppe",       labelKey: "lessons.vehicleSafety.navPills.ppe"       },
    { id: "quiz",      labelKey: "lessons.vehicleSafety.navPills.quiz"      },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: B_BLUE }}>
              📖 {t("lessons.interactiveLesson")}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              {t("lessons.vehicleSafety.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.vehicleSafety.description")}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-slate-500 mb-1">{t("lessons.progressLabel")}</div>
            <div className="w-32 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: B_BLUE }} />
            </div>
            <div className="text-xs font-extrabold mt-1" style={{ color: B_BLUE }}>
              {completedSections.size} / 4 {t("lessons.sections")}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {NAV_PILLS.map((s) => (
            <a key={s.id} href={`#safety-lesson-${s.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition-all"
              style={{
                borderColor: completedSections.has(s.id) ? B_GREEN : "#e2e8f0",
                background:  completedSections.has(s.id) ? "#f0fdf4" : "white",
                color:       completedSections.has(s.id) ? B_GREEN : "#64748b",
              }}>
              {completedSections.has(s.id) ? "✓ " : ""}{t(s.labelKey)}
            </a>
          ))}
        </div>
      </div>

      {lessonDone && (
        <div className="rounded-3xl border-2 p-5 text-center"
          style={{ borderColor: B_GREEN, background: "#f0fdf4" }}>
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-extrabold text-slate-800">{t("lessons.lessonComplete")}</div>
          <div className="text-sm text-slate-600 mt-1">
            {t("lessons.lessonCompleteBody", { title: t("lessons.vehicleSafety.title") })}
          </div>
        </div>
      )}

      <div id="safety-lesson-lifts">
        <LiftTypesSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("lifts")} disabled={completedSections.has("lifts")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("lifts") ? B_GREEN : B_BLUE,
              background:  completedSections.has("lifts") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("lifts") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("lifts") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="safety-lesson-procedure">
        <LiftProcedureSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("procedure")} disabled={completedSections.has("procedure")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("procedure") ? B_GREEN : B_BLUE,
              background:  completedSections.has("procedure") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("procedure") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("procedure") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="safety-lesson-ppe">
        <PPESection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("ppe")} disabled={completedSections.has("ppe")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("ppe") ? B_GREEN : B_BLUE,
              background:  completedSections.has("ppe") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("ppe") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("ppe") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="safety-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
