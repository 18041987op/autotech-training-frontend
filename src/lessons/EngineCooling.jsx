/**
 * EngineCooling — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Cooling System Components — clickable SVG diagram
 *   2. Coolant Types & Mixing — interactive coolant chart
 *   3. Pressure Testing — step-by-step procedure
 *   4. Mini-Quiz — 3 questions
 *
 * All content strings come from i18n keys under "lessons.engineCooling.*"
 */
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const B_BLUE   = "#1E6FAE";
const B_ORANGE = "#F7941D";
const B_SOFT   = "#E6F1FA";
const B_GREEN  = "#22c55e";
const B_RED    = "#ef4444";
const B_YELLOW = "#eab308";

const STYLES = `
@keyframes coolant-flow {
  0%   { stroke-dashoffset: 80; }
  100% { stroke-dashoffset: 0;  }
}
.coolant-pipe {
  stroke-dasharray: 6 8;
  animation: coolant-flow 1.5s linear infinite;
}
`;

function StyleInjector() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch (_) {} };
  }, []);
  return null;
}

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
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Components ────────────────────────────────────────────────────
const COOLING_PARTS = ["radiator", "thermostat", "waterpump", "expansion", "hoses"];

function ComponentsSection() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);

  const PART_COLORS = {
    radiator:   "#06b6d4",
    thermostat: B_ORANGE,
    waterpump:  B_BLUE,
    expansion:  B_GREEN,
    hoses:      "#94a3b8",
  };

  const sel = (id) => setSelected(selected === id ? null : id);
  const stroke = (id) => selected === id ? PART_COLORS[id] : "#94a3b8";

  return (
    <SectionCard
      icon="🌡️"
      title={t("lessons.engineCooling.section1Title")}
      subtitle={t("lessons.engineCooling.section1Subtitle")}
    >
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 440 220" className="w-full max-w-lg" style={{ fontFamily: "sans-serif" }}>

          {/* Coolant hoses / pipes */}
          {running ? (
            <>
              <path d="M340,70 H380 Q395,70 395,85 V155 Q395,170 380,170 H340"
                stroke="#06b6d4" strokeWidth="5" fill="none" className="coolant-pipe" strokeLinecap="round" />
              <path d="M160,70 H90 Q75,70 75,85 V155 Q75,170 90,170 H160"
                stroke="#ef4444" strokeWidth="5" fill="none" className="coolant-pipe" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M340,70 H380 Q395,70 395,85 V155 Q395,170 380,170 H340"
                stroke="#e2e8f0" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M160,70 H90 Q75,70 75,85 V155 Q75,170 90,170 H160"
                stroke="#e2e8f0" strokeWidth="5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Radiator */}
          <g onClick={() => sel("radiator")} style={{ cursor: "pointer" }}>
            <rect x="150" y="50" width="140" height="80" rx="10"
              fill={selected === "radiator" ? "#06b6d420" : "#f0fdff"}
              stroke={stroke("radiator")} strokeWidth="2.5" />
            {[0,1,2,3,4,5].map((i) => (
              <line key={i} x1={165 + i*22} y1="65" x2={165 + i*22} y2="115"
                stroke={running ? "#06b6d4" : "#94a3b8"} strokeWidth="3" />
            ))}
            <text x="220" y="143" textAnchor="middle" fontSize="10" fontWeight="700"
              fill={selected === "radiator" ? "#06b6d4" : "#64748b"}>RADIATOR</text>
          </g>

          {/* Thermostat */}
          <g onClick={() => sel("thermostat")} style={{ cursor: "pointer" }}>
            <circle cx="150" cy="120" r="18"
              fill={selected === "thermostat" ? B_ORANGE + "25" : "#fff7ed"}
              stroke={stroke("thermostat")} strokeWidth="2.5" />
            <text x="150" y="116" textAnchor="middle" fontSize="8" fontWeight="700"
              fill={selected === "thermostat" ? B_ORANGE : "#64748b"}>THERM</text>
            <text x="150" y="126" textAnchor="middle" fontSize="7" fill="#64748b">
              {running ? "195°F" : "CLOSED"}
            </text>
          </g>

          {/* Water pump */}
          <g onClick={() => sel("waterpump")} style={{ cursor: "pointer" }}>
            <circle cx="340" cy="120" r="22"
              fill={selected === "waterpump" ? B_BLUE + "20" : B_SOFT}
              stroke={stroke("waterpump")} strokeWidth="2.5" />
            <text x="340" y="116" textAnchor="middle" fontSize="8" fontWeight="700"
              fill={selected === "waterpump" ? B_BLUE : "#64748b"}>W.PUMP</text>
            <text x="340" y="128" textAnchor="middle" fontSize="7" fill="#64748b">
              {running ? "●●●" : "OFF"}
            </text>
          </g>

          {/* Expansion tank */}
          <g onClick={() => sel("expansion")} style={{ cursor: "pointer" }}>
            <rect x="15" y="95" width="40" height="50" rx="6"
              fill={selected === "expansion" ? B_GREEN + "20" : "#f0fdf4"}
              stroke={stroke("expansion")} strokeWidth="2" />
            <text x="35" y="118" textAnchor="middle" fontSize="7" fontWeight="700"
              fill={selected === "expansion" ? B_GREEN : "#64748b"}>EXP</text>
            <text x="35" y="129" textAnchor="middle" fontSize="7"
              fill={selected === "expansion" ? B_GREEN : "#64748b"}>TANK</text>
          </g>

          {/* Engine block */}
          <rect x="180" y="155" width="100" height="40" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <text x="230" y="178" textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">ENGINE</text>

          {/* Temp gauge */}
          {running && (
            <>
              <rect x="390" y="80" width="44" height="50" rx="6" fill="#1e293b" stroke={B_GREEN} strokeWidth="2" />
              <text x="412" y="95" textAnchor="middle" fontSize="7" fill={B_GREEN} fontWeight="700">TEMP</text>
              <text x="412" y="112" textAnchor="middle" fontSize="13" fill={B_GREEN} fontWeight="900">195°</text>
              <text x="412" y="124" textAnchor="middle" fontSize="6" fill={B_GREEN}>NORMAL</text>
            </>
          )}
        </svg>
      </div>

      {/* Engine run toggle */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setRunning(!running)}
          className="px-5 py-2 rounded-2xl font-extrabold text-sm transition-all"
          style={{
            background: running ? B_GREEN : "#f1f5f9",
            color:      running ? "white" : "#475569",
            border:     `2px solid ${running ? B_GREEN : "#cbd5e1"}`,
          }}>
          {running ? t("lessons.engineCooling.engineRunning") : t("lessons.engineCooling.engineOff")}
        </button>
        <span className="text-sm text-slate-600">
          {running ? t("lessons.engineCooling.coolantCirculating") : t("lessons.engineCooling.systemAtRest")}
        </span>
      </div>

      {selected && COOLING_PARTS.includes(selected) && (
        <div className="mb-4 rounded-2xl border-2 p-4 text-sm"
          style={{ borderColor: PART_COLORS[selected], background: PART_COLORS[selected] + "10" }}>
          <div className="font-extrabold text-slate-800 mb-1">
            {t(`lessons.engineCooling.parts.${selected}.label`)}
          </div>
          <div className="text-slate-700">
            {t(`lessons.engineCooling.parts.${selected}.desc`)}
          </div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelected(null)}>
            {t("lessons.close")}
          </button>
        </div>
      )}

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.engineCooling.section1Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 2: Coolant Types ─────────────────────────────────────────────────
const COOLANT_TYPES = [
  { id: "green",  color: "#22c55e", hex: "#HOAT",   life: "2 yrs / 30k mi" },
  { id: "orange", color: "#f97316", hex: "DEXCOOL",  life: "5 yrs / 150k mi" },
  { id: "yellow", color: "#eab308", hex: "HOAT",     life: "5 yrs / 150k mi" },
  { id: "blue",   color: "#3b82f6", hex: "OAT/HOAT", life: "5 yrs / 150k mi" },
  { id: "purple", color: "#8b5cf6", hex: "HOAT",     life: "5 yrs / 150k mi" },
];

function CoolantSection() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("green");
  const [mixRatio, setMixRatio] = useState(50);

  const freezePoint = mixRatio >= 70 ? -84 : mixRatio >= 60 ? -65 : mixRatio >= 50 ? -34 : mixRatio >= 40 ? -12 : 15;
  const spec = COOLANT_TYPES.find((c) => c.id === selected);

  return (
    <SectionCard
      icon="🧪"
      title={t("lessons.engineCooling.section2Title")}
      subtitle={t("lessons.engineCooling.section2Subtitle")}
    >
      {/* Coolant type selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {COOLANT_TYPES.map((c) => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all flex items-center gap-2"
            style={{
              borderColor: selected === c.id ? c.color : "#e2e8f0",
              background:  selected === c.id ? c.color + "18" : "white",
              color:       selected === c.id ? c.color : "#64748b",
            }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.color }} />
            {t(`lessons.engineCooling.coolants.${c.id}.label`)}
          </button>
        ))}
      </div>

      {/* Coolant info */}
      <div className="rounded-2xl border-2 p-4 text-sm mb-5"
        style={{ borderColor: spec.color, background: spec.color + "10" }}>
        <div className="font-extrabold text-slate-800 mb-1">
          {t(`lessons.engineCooling.coolants.${selected}.title`)}
        </div>
        <div className="text-slate-700 mb-2">
          {t(`lessons.engineCooling.coolants.${selected}.desc`)}
        </div>
        <div className="flex gap-4 text-xs">
          <span><strong>{t("lessons.engineCooling.serviceLife")}:</strong> {spec.life}</span>
          <span><strong>{t("lessons.engineCooling.type")}:</strong> {spec.hex}</span>
        </div>
      </div>

      {/* Mix ratio slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-extrabold text-slate-800">
            {t("lessons.engineCooling.mixRatio")}
          </span>
          <span className="font-extrabold" style={{ color: spec.color }}>
            {mixRatio}% coolant / {100 - mixRatio}% water
          </span>
        </div>
        <input type="range" min="30" max="70" value={mixRatio}
          onChange={(e) => setMixRatio(Number(e.target.value))}
          className="w-full" />
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm flex justify-between">
          <span>❄️ <strong>{t("lessons.engineCooling.freezePoint")}:</strong> {freezePoint}°F</span>
          <span className={`font-bold ${mixRatio >= 40 && mixRatio <= 60 ? "text-green-700" : "text-orange-700"}`}>
            {mixRatio >= 40 && mixRatio <= 60
              ? `✅ ${t("lessons.engineCooling.mixOk")}`
              : `⚠️ ${t("lessons.engineCooling.mixWarn")}`}
          </span>
        </div>
      </div>

      <InfoBox color="orange">
        ⚠️ <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.engineCooling.section2Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 3: Pressure Testing ─────────────────────────────────────────────
const PRESSURE_STEPS = [
  { step: 1, key: "press1", icon: "🌡️", color: B_BLUE   },
  { step: 2, key: "press2", icon: "🔧", color: B_ORANGE },
  { step: 3, key: "press3", icon: "📊", color: B_BLUE   },
  { step: 4, key: "press4", icon: "🔍", color: B_YELLOW },
  { step: 5, key: "press5", icon: "✅", color: B_GREEN  },
];

function PressureTestSection() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = PRESSURE_STEPS[step];

  const psiValues = [0, 0, 15, 15, 15];
  const psi = psiValues[step];
  const psiOk = psi >= 13;

  return (
    <SectionCard
      icon="🔧"
      title={t("lessons.engineCooling.section3Title")}
      subtitle={t("lessons.engineCooling.section3Subtitle")}
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {PRESSURE_STEPS.map((s, i) => (
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
          {t("lessons.step")} {step + 1} {t("lessons.of")} {PRESSURE_STEPS.length}
        </span>
      </div>

      {/* Pressure gauge SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 280 160" className="w-full max-w-sm">
          {/* Radiator */}
          <rect x="20" y="60" width="120" height="80" rx="10" fill="#f0fdff" stroke="#94a3b8" strokeWidth="2" />
          <text x="80" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">RADIATOR</text>
          {step >= 2 && (
            <text x="80" y="125" textAnchor="middle" fontSize="9" fill={B_BLUE}>16 PSI cap</text>
          )}

          {/* Pressure tester */}
          {step >= 2 && (
            <>
              <circle cx="200" cy="80" r="40" fill="#1e293b" stroke={psiOk ? B_GREEN : B_RED} strokeWidth="3" />
              <text x="200" y="72" textAnchor="middle" fontSize="8" fill={psiOk ? B_GREEN : B_RED} fontWeight="700">PRESSURE</text>
              <text x="200" y="88" textAnchor="middle" fontSize="20" fill={psiOk ? B_GREEN : B_RED} fontWeight="900">
                {psi}
              </text>
              <text x="200" y="102" textAnchor="middle" fontSize="8" fill={psiOk ? B_GREEN : B_RED}>PSI</text>
            </>
          )}

          {/* Adapter */}
          {step >= 2 && (
            <line x1="140" y1="80" x2="160" y2="80" stroke={B_BLUE} strokeWidth="4" strokeLinecap="round" />
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
              {t(`lessons.engineCooling.pressureTest.${current.key}Title`)}
            </div>
            <div className="text-sm text-slate-700">
              {t(`lessons.engineCooling.pressureTest.${current.key}Desc`)}
            </div>
          </div>
        </div>
      </div>

      <InfoBox>
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t(`lessons.engineCooling.pressureTest.${current.key}Tip`)}
      </InfoBox>

      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40">
          {t("lessons.previous")}
        </button>
        <button onClick={() => setStep((s) => Math.min(PRESSURE_STEPS.length - 1, s + 1))}
          disabled={step === PRESSURE_STEPS.length - 1}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white disabled:opacity-40"
          style={{ background: B_BLUE }}>
          {t("lessons.next")}
        </button>
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
      { id: "a", tKey: "q2a", correct: false },
      { id: "b", tKey: "q2b", correct: false },
      { id: "c", tKey: "q2c", correct: false },
      { id: "d", tKey: "q2d", correct: true  },
    ],
  },
  {
    id: 3, qKey: "q3", expKey: "q3exp",
    options: [
      { id: "a", tKey: "q3a", correct: true  },
      { id: "b", tKey: "q3b", correct: false },
      { id: "c", tKey: "q3c", correct: false },
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
      title={t("lessons.engineCooling.section4Title")}
      subtitle={t("lessons.engineCooling.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.engineCooling.quiz.${q.qKey}`)}
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
                      {t(`lessons.engineCooling.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.engineCooling.quiz.${q.expKey}`)}
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
export function EngineCooling() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "components", labelKey: "lessons.engineCooling.navPills.components" },
    { id: "coolants",   labelKey: "lessons.engineCooling.navPills.coolants"   },
    { id: "pressure",   labelKey: "lessons.engineCooling.navPills.pressure"   },
    { id: "quiz",       labelKey: "lessons.engineCooling.navPills.quiz"       },
  ];

  return (
    <div className="space-y-6">
      <StyleInjector />

      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: B_BLUE }}>
              📖 {t("lessons.interactiveLesson")}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              {t("lessons.engineCooling.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.engineCooling.description")}
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
            <a key={s.id} href={`#cool-lesson-${s.id}`}
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
            {t("lessons.lessonCompleteBody", { title: t("lessons.engineCooling.title") })}
          </div>
        </div>
      )}

      <div id="cool-lesson-components">
        <ComponentsSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("components")} disabled={completedSections.has("components")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("components") ? B_GREEN : B_BLUE,
              background:  completedSections.has("components") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("components") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("components") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="cool-lesson-coolants">
        <CoolantSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("coolants")} disabled={completedSections.has("coolants")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("coolants") ? B_GREEN : B_BLUE,
              background:  completedSections.has("coolants") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("coolants") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("coolants") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="cool-lesson-pressure">
        <PressureTestSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("pressure")} disabled={completedSections.has("pressure")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("pressure") ? B_GREEN : B_BLUE,
              background:  completedSections.has("pressure") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("pressure") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("pressure") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="cool-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
