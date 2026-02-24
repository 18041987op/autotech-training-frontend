/**
 * AlternatorAndBattery — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Charging System Overview — animated SVG diagram
 *   2. Battery Testing — step-by-step voltmeter procedure
 *   3. Alternator Testing — load test and ripple test steps
 *   4. Mini-Quiz — 3 diagnostic questions
 *
 * All content strings come from i18n keys under "lessons.alternatorAndBattery.*"
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
@keyframes charge-flow {
  0%   { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0;   }
}
@keyframes alt-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.charge-wire {
  stroke-dasharray: 6 8;
  animation: charge-flow 1.2s linear infinite;
}
.alt-rotor {
  transform-origin: 260px 110px;
  animation: alt-spin 1.5s linear infinite;
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
    : color === "green"
    ? "bg-green-50 border-green-200 text-green-800"
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Charging System Overview ─────────────────────────────────────
function ChargingSystemSection() {
  const { t } = useTranslation();
  const [engineOn, setEngineOn] = useState(false);
  const [selected, setSelected] = useState(null);

  const COMPONENTS = ["battery", "alternator", "regulator", "belt"];

  return (
    <SectionCard
      icon="🔋"
      title={t("lessons.alternatorAndBattery.section1Title")}
      subtitle={t("lessons.alternatorAndBattery.section1Subtitle")}
    >
      {/* SVG Diagram */}
      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 440 220" className="w-full max-w-lg" style={{ fontFamily: "sans-serif" }}>

          {/* Wires */}
          {engineOn ? (
            <>
              <path d="M110,80 H200 H320" stroke={B_BLUE} strokeWidth="4" fill="none"
                className="charge-wire" strokeLinecap="round" />
              <path d="M320,150 H200 H110" stroke={B_BLUE} strokeWidth="4" fill="none"
                className="charge-wire" strokeLinecap="round" strokeDashoffset="50" />
            </>
          ) : (
            <>
              <path d="M110,80 H200 H320" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M320,150 H200 H110" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          )}
          <line x1="110" y1="80"  x2="110" y2="150" stroke={engineOn ? B_BLUE : "#cbd5e1"} strokeWidth="4" />
          <line x1="320" y1="80"  x2="320" y2="150" stroke={engineOn ? B_BLUE : "#cbd5e1"} strokeWidth="4" />

          {/* Battery */}
          <g onClick={() => setSelected(selected === "battery" ? null : "battery")} style={{ cursor: "pointer" }}>
            <rect x="50" y="95" width="100" height="46" rx="10"
              fill={selected === "battery" ? B_SOFT : "#f8fafc"}
              stroke={selected === "battery" ? B_BLUE : "#94a3b8"} strokeWidth="2.5" />
            <text x="100" y="116" textAnchor="middle" fontSize="13">🔋</text>
            <text x="100" y="130" textAnchor="middle" fontSize="9" fill="#64748b">
              {engineOn ? "13.8–14.4V" : "12.6V"}
            </text>
            <text x="54" y="93" fontSize="11" fontWeight="900" fill={B_BLUE}>+</text>
            <text x="140" y="155" fontSize="11" fontWeight="900" fill="#64748b">−</text>
          </g>

          {/* Alternator */}
          <g onClick={() => setSelected(selected === "alternator" ? null : "alternator")} style={{ cursor: "pointer" }}>
            <rect x="220" y="80" width="100" height="60" rx="10"
              fill={selected === "alternator" ? B_SOFT : "#f8fafc"}
              stroke={selected === "alternator" ? B_BLUE : "#94a3b8"} strokeWidth="2.5" />
            {engineOn && (
              <circle cx="270" cy="110" r="18" fill="none" stroke={B_ORANGE} strokeWidth="2.5"
                className="alt-rotor" strokeDasharray="4 4" />
            )}
            <text x="270" y="106" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">⚡ALT</text>
            <text x="270" y="120" textAnchor="middle" fontSize="9" fill="#64748b">
              {engineOn ? "14.0V" : "OFF"}
            </text>
          </g>

          {/* Regulator */}
          <g onClick={() => setSelected(selected === "regulator" ? null : "regulator")} style={{ cursor: "pointer" }}>
            <rect x="230" y="155" width="80" height="32" rx="8"
              fill={selected === "regulator" ? B_SOFT : "#f8fafc"}
              stroke={selected === "regulator" ? B_BLUE : "#94a3b8"} strokeWidth="2" />
            <text x="270" y="169" textAnchor="middle" fontSize="9" fontWeight="700" fill="#334155">REG</text>
            <text x="270" y="180" textAnchor="middle" fontSize="8" fill="#64748b">14.5V limit</text>
          </g>

          {/* Belt indicator */}
          <g onClick={() => setSelected(selected === "belt" ? null : "belt")} style={{ cursor: "pointer" }}>
            <ellipse cx="200" cy="160" rx="28" ry="10" fill="none"
              stroke={engineOn ? B_ORANGE : "#94a3b8"} strokeWidth="3" strokeDasharray="5 3" />
            <text x="200" y="164" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">BELT</text>
          </g>

          {/* Voltage display */}
          {engineOn && (
            <rect x="360" y="60" width="72" height="40" rx="8" fill="#1e293b" stroke={B_GREEN} strokeWidth="2" />
          )}
          {engineOn && (
            <>
              <text x="396" y="76" textAnchor="middle" fontSize="7" fill={B_GREEN} fontWeight="700">VOLTMETER</text>
              <text x="396" y="91" textAnchor="middle" fontSize="12" fill={B_GREEN} fontWeight="900">14.2V</text>
            </>
          )}
        </svg>
      </div>

      {/* Component info */}
      {selected && COMPONENTS.includes(selected) && (
        <div className="mb-4 rounded-2xl border-2 p-4 text-sm"
          style={{ borderColor: B_BLUE, background: B_SOFT }}>
          <div className="font-extrabold text-slate-800 mb-1">
            {t(`lessons.alternatorAndBattery.components.${selected}.label`)}
          </div>
          <div className="text-slate-700">
            {t(`lessons.alternatorAndBattery.components.${selected}.desc`)}
          </div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelected(null)}>
            {t("lessons.close")}
          </button>
        </div>
      )}

      {/* Engine toggle */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setEngineOn(!engineOn)}
          className="px-5 py-2 rounded-2xl font-extrabold text-sm transition-all"
          style={{
            background: engineOn ? B_GREEN : "#f1f5f9",
            color:      engineOn ? "white" : "#475569",
            border:     `2px solid ${engineOn ? B_GREEN : "#cbd5e1"}`,
          }}>
          {engineOn
            ? t("lessons.alternatorAndBattery.engineOn")
            : t("lessons.alternatorAndBattery.engineOff")}
        </button>
        <span className="text-sm text-slate-600">
          {engineOn
            ? t("lessons.alternatorAndBattery.chargingActive")
            : t("lessons.alternatorAndBattery.batteryOnly")}
        </span>
      </div>

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.alternatorAndBattery.section1Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 2: Battery Testing ───────────────────────────────────────────────
const BATTERY_STEPS = [
  { step: 1, key: "batt1", voltDisplay: "12.6V", color: B_GREEN  },
  { step: 2, key: "batt2", voltDisplay: "11.8V", color: B_YELLOW },
  { step: 3, key: "batt3", voltDisplay: "10.5V", color: B_RED    },
  { step: 4, key: "batt4", voltDisplay: "PASS",  color: B_GREEN  },
];

function BatteryTestSection() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = BATTERY_STEPS[step];

  return (
    <SectionCard
      icon="🔌"
      title={t("lessons.alternatorAndBattery.section2Title")}
      subtitle={t("lessons.alternatorAndBattery.section2Subtitle")}
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {BATTERY_STEPS.map((s, i) => (
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
          {t("lessons.step")} {step + 1} {t("lessons.of")} {BATTERY_STEPS.length}
        </span>
      </div>

      {/* Voltmeter SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 300 160" className="w-full max-w-sm">
          {/* Battery */}
          <rect x="20" y="60" width="90" height="50" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <text x="65" y="83" textAnchor="middle" fontSize="16">🔋</text>
          <text x="65" y="100" textAnchor="middle" fontSize="10" fill="#64748b">Battery</text>
          <text x="25" y="58" fontSize="11" fontWeight="900" fill={B_BLUE}>+</text>
          <text x="98" y="120" fontSize="11" fontWeight="900" fill="#64748b">−</text>

          {/* Wires to meter */}
          <line x1="110" y1="75" x2="185" y2="75" stroke="red"     strokeWidth="3" />
          <line x1="110" y1="100" x2="185" y2="100" stroke="#1e293b" strokeWidth="3" />

          {/* Voltmeter display */}
          <rect x="185" y="55" width="95" height="60" rx="10" fill="#1e293b" stroke={current.color} strokeWidth="2.5" />
          <text x="232" y="73" textAnchor="middle" fontSize="8" fill={current.color} fontWeight="700">VOLTMETER</text>
          <text x="232" y="95" textAnchor="middle" fontSize="18" fill={current.color} fontWeight="900">
            {current.voltDisplay}
          </text>
          <text x="232" y="108" textAnchor="middle" fontSize="7" fill={current.color}>DC VOLTS</text>
        </svg>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border-2 p-4 mb-4"
        style={{ borderColor: current.color, background: current.color + "15" }}>
        <div className="flex items-start gap-3">
          <span className="rounded-full text-white text-sm font-extrabold w-7 h-7 flex items-center justify-center flex-shrink-0"
            style={{ background: current.color }}>
            {current.step}
          </span>
          <div>
            <div className="font-extrabold text-slate-800 mb-1">
              {t(`lessons.alternatorAndBattery.battTest.${current.key}Title`)}
            </div>
            <div className="text-sm text-slate-700">
              {t(`lessons.alternatorAndBattery.battTest.${current.key}Desc`)}
            </div>
          </div>
        </div>
      </div>

      <InfoBox color={current.color === B_RED ? "orange" : "blue"}>
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t(`lessons.alternatorAndBattery.battTest.${current.key}Tip`)}
      </InfoBox>

      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40">
          {t("lessons.previous")}
        </button>
        <button onClick={() => setStep((s) => Math.min(BATTERY_STEPS.length - 1, s + 1))}
          disabled={step === BATTERY_STEPS.length - 1}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white disabled:opacity-40"
          style={{ background: B_BLUE }}>
          {t("lessons.next")}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── SECTION 3: Alternator Testing ───────────────────────────────────────────
const ALT_STATES = ["good", "low", "high", "ripple"];

function AlternatorTestSection() {
  const { t } = useTranslation();
  const [state, setState] = useState("good");

  const STATE_COLORS = {
    good:   B_GREEN,
    low:    B_YELLOW,
    high:   B_RED,
    ripple: B_ORANGE,
  };
  const STATE_VOLTS = {
    good:   "14.2V",
    low:    "12.8V",
    high:   "15.1V",
    ripple: "~AC",
  };

  const color = STATE_COLORS[state];

  return (
    <SectionCard
      icon="⚡"
      title={t("lessons.alternatorAndBattery.section3Title")}
      subtitle={t("lessons.alternatorAndBattery.section3Subtitle")}
    >
      {/* State selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ALT_STATES.map((id) => (
          <button key={id} onClick={() => setState(id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all"
            style={{
              borderColor: state === id ? STATE_COLORS[id] : "#e2e8f0",
              background:  state === id ? STATE_COLORS[id] + "18" : "white",
              color:       state === id ? STATE_COLORS[id] : "#64748b",
            }}>
            {t(`lessons.alternatorAndBattery.altStates.${id}.label`)}
          </button>
        ))}
      </div>

      {/* Display */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 340 160" className="w-full max-w-md">
          {/* Alternator */}
          <circle cx="100" cy="90" r="55" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
          <circle cx="100" cy="90" r="32" fill="none" stroke={color} strokeWidth="3"
            className={state !== "good" ? "" : "alt-rotor"} strokeDasharray="5 4" />
          <text x="100" y="85" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">ALT</text>
          <text x="100" y="100" textAnchor="middle" fontSize="10" fill="#64748b">Alternator</text>

          {/* Wire */}
          <line x1="155" y1="80" x2="220" y2="80" stroke="red" strokeWidth="3" />
          <line x1="155" y1="100" x2="220" y2="100" stroke="#1e293b" strokeWidth="3" />

          {/* Voltmeter */}
          <rect x="220" y="55" width="105" height="70" rx="10" fill="#1e293b" stroke={color} strokeWidth="2.5" />
          <text x="272" y="72" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">VOLTMETER</text>
          <text x="272" y="96" textAnchor="middle" fontSize="20" fill={color} fontWeight="900">
            {STATE_VOLTS[state]}
          </text>
          <text x="272" y="113" textAnchor="middle" fontSize="8" fill={color}>
            {state === "ripple" ? "AC ripple" : "DC VOLTS"}
          </text>
        </svg>
      </div>

      {/* Description */}
      <div className="rounded-2xl border-2 p-4 text-sm mb-4"
        style={{ borderColor: color, background: color + "10" }}>
        <div className="font-extrabold text-slate-800 mb-1">
          {t(`lessons.alternatorAndBattery.altStates.${state}.title`)}
        </div>
        <div className="text-slate-700">
          {t(`lessons.alternatorAndBattery.altStates.${state}.desc`)}
        </div>
      </div>

      <InfoBox color={state === "good" ? "green" : "orange"}>
        <strong>{t("lessons.diagTip")}:</strong>{" "}
        {t("lessons.alternatorAndBattery.altDiagTip")}
      </InfoBox>
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
      title={t("lessons.alternatorAndBattery.section4Title")}
      subtitle={t("lessons.alternatorAndBattery.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.alternatorAndBattery.quiz.${q.qKey}`)}
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
                      {t(`lessons.alternatorAndBattery.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.alternatorAndBattery.quiz.${q.expKey}`)}
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
export function AlternatorAndBattery() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "system",  labelKey: "lessons.alternatorAndBattery.navPills.system"  },
    { id: "battery", labelKey: "lessons.alternatorAndBattery.navPills.battery" },
    { id: "alt",     labelKey: "lessons.alternatorAndBattery.navPills.alt"     },
    { id: "quiz",    labelKey: "lessons.alternatorAndBattery.navPills.quiz"    },
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
              {t("lessons.alternatorAndBattery.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.alternatorAndBattery.description")}
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
            <a key={s.id} href={`#alt-lesson-${s.id}`}
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
            {t("lessons.lessonCompleteBody", { title: t("lessons.alternatorAndBattery.title") })}
          </div>
        </div>
      )}

      <div id="alt-lesson-system">
        <ChargingSystemSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("system")} disabled={completedSections.has("system")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("system") ? B_GREEN : B_BLUE,
              background:  completedSections.has("system") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("system") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("system") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="alt-lesson-battery">
        <BatteryTestSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("battery")} disabled={completedSections.has("battery")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("battery") ? B_GREEN : B_BLUE,
              background:  completedSections.has("battery") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("battery") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("battery") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="alt-lesson-alt">
        <AlternatorTestSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("alt")} disabled={completedSections.has("alt")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("alt") ? B_GREEN : B_BLUE,
              background:  completedSections.has("alt") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("alt") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("alt") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="alt-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
