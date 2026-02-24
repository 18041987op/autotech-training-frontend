/**
 * OilChange — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Oil Viscosity & Specs — interactive viscosity picker
 *   2. Drain & Fill Procedure — step-by-step animated SVG
 *   3. Fluid Inspection Checklist — interactive checklist
 *   4. Mini-Quiz — 3 questions
 *
 * All content strings come from i18n keys under "lessons.oilChange.*"
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
    : color === "green"
    ? "bg-green-50 border-green-200 text-green-800"
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Oil Viscosity & Specs ────────────────────────────────────────
const OIL_SPECS = [
  { id: "0w20", label: "0W-20", color: "#06b6d4", vehicles: "Honda, Toyota, Mazda, Subaru, newer Ford" },
  { id: "5w20", label: "5W-20", color: "#3b82f6", vehicles: "Older Ford, Lincoln, some Chrysler/Ram" },
  { id: "5w30", label: "5W-30", color: "#6366f1", vehicles: "Most GM, older imports, many European" },
  { id: "5w40", label: "5W-40", color: "#8b5cf6", vehicles: "VW, Audi, BMW, Mercedes, European diesel" },
];

function ViscositySection() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("0w20");

  const spec = OIL_SPECS.find((s) => s.id === selected);

  return (
    <SectionCard
      icon="🛢️"
      title={t("lessons.oilChange.section1Title")}
      subtitle={t("lessons.oilChange.section1Subtitle")}
    >
      {/* Oil spec buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {OIL_SPECS.map((s) => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all"
            style={{
              borderColor: selected === s.id ? s.color : "#e2e8f0",
              background:  selected === s.id ? s.color + "18" : "white",
              color:       selected === s.id ? s.color : "#64748b",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Viscosity diagram */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 380 160" className="w-full max-w-md">
          {/* Cold flow bar */}
          <text x="10" y="28" fontSize="10" fontWeight="700" fill="#64748b">COLD FLOW (W number)</text>
          <rect x="10" y="35" width="340" height="20" rx="6" fill="#e2e8f0" />
          <rect x="10" y="35"
            width={selected === "0w20" ? 60 : selected === "5w20" ? 90 : selected === "5w30" ? 90 : 90}
            height="20" rx="6" fill={spec.color} />
          <text x="180" y="49" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
            {selected.startsWith("0") ? "0W — Best cold start" : "5W — Good cold start"}
          </text>

          {/* Operating viscosity bar */}
          <text x="10" y="80" fontSize="10" fontWeight="700" fill="#64748b">OPERATING VISCOSITY (2nd number)</text>
          <rect x="10" y="87" width="340" height="20" rx="6" fill="#e2e8f0" />
          <rect x="10" y="87"
            width={selected === "0w20" ? 120 : selected === "5w20" ? 120 : selected === "5w30" ? 200 : 280}
            height="20" rx="6" fill={spec.color} />
          <text x="180" y="101" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
            {selected.endsWith("20") ? "20 — Light/Thin" : selected.endsWith("30") ? "30 — Medium" : "40 — Thicker"}
          </text>

          {/* Oil can */}
          <rect x="290" y="115" width="60" height="38" rx="8"
            fill={spec.color + "20"} stroke={spec.color} strokeWidth="2.5" />
          <rect x="300" y="108" width="40" height="12" rx="4" fill={spec.color} />
          <text x="320" y="136" textAnchor="middle" fontSize="10" fontWeight="900" fill={spec.color}>
            {spec.label}
          </text>
          <text x="320" y="148" textAnchor="middle" fontSize="7" fill="#64748b">API Spec</text>
        </svg>
      </div>

      {/* Spec info */}
      <div className="rounded-2xl border-2 p-4 text-sm mb-4"
        style={{ borderColor: spec.color, background: spec.color + "10" }}>
        <div className="font-extrabold text-slate-800 mb-1">
          {spec.label} — {t(`lessons.oilChange.specs.${selected}.title`)}
        </div>
        <div className="text-slate-700 mb-2">
          {t(`lessons.oilChange.specs.${selected}.desc`)}
        </div>
        <div className="rounded-xl bg-white border px-3 py-2 text-xs font-semibold text-slate-600 border-slate-200">
          🚗 <strong>{t("lessons.oilChange.commonVehicles")}:</strong> {spec.vehicles}
        </div>
      </div>

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.oilChange.section1Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 2: Drain & Fill Procedure ──────────────────────────────────────
const DRAIN_STEPS = [
  { step: 1, key: "step1", icon: "🔧", color: B_BLUE   },
  { step: 2, key: "step2", icon: "⬇️", color: B_ORANGE },
  { step: 3, key: "step3", icon: "🔩", color: B_BLUE   },
  { step: 4, key: "step4", icon: "🛢️", color: B_GREEN  },
  { step: 5, key: "step5", icon: "📊", color: B_BLUE   },
];

function ProcedureSection() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = DRAIN_STEPS[step];

  // Oil level visual
  const levels = [0.5, 0.1, 0.1, 0.9, 0.75];
  const fillLevel = levels[step];

  return (
    <SectionCard
      icon="🔧"
      title={t("lessons.oilChange.section2Title")}
      subtitle={t("lessons.oilChange.section2Subtitle")}
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {DRAIN_STEPS.map((s, i) => (
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
          {t("lessons.step")} {step + 1} {t("lessons.of")} {DRAIN_STEPS.length}
        </span>
      </div>

      {/* SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 300 180" className="w-full max-w-sm">
          {/* Engine outline */}
          <rect x="80" y="20" width="140" height="100" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <text x="150" y="55" textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">ENGINE</text>

          {/* Oil pan */}
          <rect x="95" y="110" width="110" height="35" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
          <text x="150" y="132" textAnchor="middle" fontSize="9" fill="#64748b">OIL PAN</text>

          {/* Drain plug */}
          <rect x="138" y="143" width="24" height="10" rx="3"
            fill={step === 0 ? B_BLUE : step === 1 ? B_ORANGE : B_BLUE}
            stroke="white" strokeWidth="1.5" />
          <text x="150" y="152" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">PLUG</text>

          {/* Oil fill hole on top */}
          <circle cx="195" cy="22" r="10"
            fill={step === 3 ? B_ORANGE : "#f8fafc"}
            stroke={step === 3 ? B_ORANGE : "#94a3b8"} strokeWidth="2" />
          <text x="195" y="26" textAnchor="middle" fontSize="7" fill={step === 3 ? "white" : "#64748b"}>FILL</text>

          {/* Oil level gauge */}
          <rect x="230" y="70" width="18" height="70" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="231" y={70 + (70 * (1 - fillLevel))} width="16"
            height={70 * fillLevel} rx="3"
            fill={fillLevel > 0.6 ? B_GREEN : fillLevel > 0.2 ? B_YELLOW : B_RED} />
          <text x="239" y="152" textAnchor="middle" fontSize="7" fill="#64748b">LEVEL</text>
          <line x1="228" y1="87" x2="248" y2="87" stroke={B_GREEN} strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="228" y1="123" x2="248" y2="123" stroke={B_RED} strokeWidth="1.5" strokeDasharray="2 2" />
          <text x="252" y="90" fontSize="6" fill={B_GREEN}>MAX</text>
          <text x="252" y="126" fontSize="6" fill={B_RED}>MIN</text>

          {/* Oil drain stream when step 1 */}
          {step === 1 && (
            <path d="M150,153 Q155,165 152,178" stroke={B_ORANGE} strokeWidth="4" fill="none"
              strokeLinecap="round" strokeDasharray="4 3" />
          )}

          {/* Oil pour when step 3 */}
          {step === 3 && (
            <path d="M195,10 Q198,0 195,0" stroke={B_ORANGE} strokeWidth="3" fill="none"
              strokeLinecap="round" />
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
              {t(`lessons.oilChange.procedure.${current.key}Title`)}
            </div>
            <div className="text-sm text-slate-700">
              {t(`lessons.oilChange.procedure.${current.key}Desc`)}
            </div>
          </div>
        </div>
      </div>

      <InfoBox>
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t(`lessons.oilChange.procedure.${current.key}Tip`)}
      </InfoBox>

      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40">
          {t("lessons.previous")}
        </button>
        <button onClick={() => setStep((s) => Math.min(DRAIN_STEPS.length - 1, s + 1))}
          disabled={step === DRAIN_STEPS.length - 1}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white disabled:opacity-40"
          style={{ background: B_BLUE }}>
          {t("lessons.next")}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── SECTION 3: Fluid Inspection Checklist ────────────────────────────────────
const FLUIDS = [
  { id: "coolant",     icon: "🌡️", color: "#06b6d4" },
  { id: "brake",       icon: "🛑", color: "#ef4444"  },
  { id: "power",       icon: "🔄", color: "#f97316"  },
  { id: "washer",      icon: "💧", color: "#3b82f6"  },
  { id: "transmission",icon: "⚙️", color: "#8b5cf6"  },
];

function FluidCheckSection() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(new Set());
  const [conditions, setConditions] = useState({});

  const toggle = (id) => setChecked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const setCondition = (id, val) =>
    setConditions((prev) => ({ ...prev, [id]: val }));

  const allChecked = checked.size === FLUIDS.length;

  return (
    <SectionCard
      icon="🔍"
      title={t("lessons.oilChange.section3Title")}
      subtitle={t("lessons.oilChange.section3Subtitle")}
    >
      <div className="space-y-3 mb-4">
        {FLUIDS.map((f) => {
          const isChecked = checked.has(f.id);
          const condition = conditions[f.id];
          return (
            <div key={f.id}
              className="rounded-2xl border-2 p-4 transition-all"
              style={{
                borderColor: isChecked ? f.color : "#e2e8f0",
                background:  isChecked ? f.color + "08" : "white",
              }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">
                      {t(`lessons.oilChange.fluids.${f.id}.label`)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(`lessons.oilChange.fluids.${f.id}.checkWhat`)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggle(f.id)}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all text-sm font-extrabold"
                  style={{
                    borderColor: isChecked ? f.color : "#94a3b8",
                    background:  isChecked ? f.color : "white",
                    color:       isChecked ? "white" : "#94a3b8",
                  }}>
                  {isChecked ? "✓" : ""}
                </button>
              </div>
              {isChecked && (
                <div className="flex gap-2 mt-1">
                  {["ok", "low", "dirty", "replace"].map((cond) => (
                    <button key={cond} onClick={() => setCondition(f.id, cond)}
                      className="px-3 py-1 rounded-xl text-xs font-extrabold border-2 transition-all"
                      style={{
                        borderColor: condition === cond ? f.color : "#e2e8f0",
                        background:  condition === cond ? f.color : "white",
                        color:       condition === cond ? "white" : "#64748b",
                      }}>
                      {t(`lessons.oilChange.fluidConditions.${cond}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allChecked && (
        <div className="rounded-2xl border-2 p-4"
          style={{ borderColor: B_GREEN, background: "#f0fdf4" }}>
          <div className="font-extrabold text-green-800 mb-1">
            ✅ {t("lessons.oilChange.checklistComplete")}
          </div>
          <div className="text-sm text-green-700">
            {t("lessons.oilChange.checklistCompleteDesc")}
          </div>
        </div>
      )}

      <div className="mt-4">
        <InfoBox>
          <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.oilChange.section3Tip")}
        </InfoBox>
      </div>
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
      { id: "a", tKey: "q2a", correct: true  },
      { id: "b", tKey: "q2b", correct: false },
      { id: "c", tKey: "q2c", correct: false },
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
      title={t("lessons.oilChange.section4Title")}
      subtitle={t("lessons.oilChange.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.oilChange.quiz.${q.qKey}`)}
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
                      {t(`lessons.oilChange.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.oilChange.quiz.${q.expKey}`)}
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
export function OilChange() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "viscosity",  labelKey: "lessons.oilChange.navPills.viscosity"  },
    { id: "procedure",  labelKey: "lessons.oilChange.navPills.procedure"  },
    { id: "fluids",     labelKey: "lessons.oilChange.navPills.fluids"     },
    { id: "quiz",       labelKey: "lessons.oilChange.navPills.quiz"       },
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
              {t("lessons.oilChange.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.oilChange.description")}
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
            <a key={s.id} href={`#oil-lesson-${s.id}`}
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
            {t("lessons.lessonCompleteBody", { title: t("lessons.oilChange.title") })}
          </div>
        </div>
      )}

      <div id="oil-lesson-viscosity">
        <ViscositySection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("viscosity")} disabled={completedSections.has("viscosity")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("viscosity") ? B_GREEN : B_BLUE,
              background:  completedSections.has("viscosity") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("viscosity") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("viscosity") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="oil-lesson-procedure">
        <ProcedureSection />
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

      <div id="oil-lesson-fluids">
        <FluidCheckSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("fluids")} disabled={completedSections.has("fluids")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("fluids") ? B_GREEN : B_BLUE,
              background:  completedSections.has("fluids") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("fluids") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("fluids") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="oil-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
