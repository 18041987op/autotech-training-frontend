/**
 * BrakeSystem — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Brake System Components — SVG disc brake diagram with clickable parts
 *   2. Pad & Rotor Measurement — interactive thickness gauge
 *   3. Brake Bleeding Procedure — step-by-step
 *   4. Mini-Quiz — 3 diagnostic questions
 *
 * All content strings come from i18n keys under "lessons.brakeSystem.*"
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
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Brake Components ─────────────────────────────────────────────
const BRAKE_PARTS = ["rotor", "pad", "caliper", "piston", "hose"];

function ComponentsSection() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const PART_COLORS = {
    rotor:   "#64748b",
    pad:     B_RED,
    caliper: B_BLUE,
    piston:  B_ORANGE,
    hose:    B_YELLOW,
  };

  const sel = (id) => setSelected(selected === id ? null : id);
  const isSelected = (id) => selected === id;
  const stroke = (id) => isSelected(id) ? PART_COLORS[id] : "#94a3b8";
  const fill   = (id) => isSelected(id) ? PART_COLORS[id] + "25" : "#f8fafc";

  return (
    <SectionCard
      icon="🛑"
      title={t("lessons.brakeSystem.section1Title")}
      subtitle={t("lessons.brakeSystem.section1Subtitle")}
    >
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 420 240" className="w-full max-w-lg" style={{ fontFamily: "sans-serif" }}>

          {/* Rotor — large circle */}
          <g onClick={() => sel("rotor")} style={{ cursor: "pointer" }}>
            <circle cx="210" cy="120" r="95" fill={fill("rotor")} stroke={stroke("rotor")} strokeWidth="3" />
            <circle cx="210" cy="120" r="30" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
            {/* Ventilation holes */}
            {[0,60,120,180,240,300].map((deg, i) => (
              <circle key={i}
                cx={210 + 62 * Math.cos(deg * Math.PI / 180)}
                cy={120 + 62 * Math.sin(deg * Math.PI / 180)}
                r="8" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
            ))}
            <text x="210" y="185" textAnchor="middle" fontSize="10" fontWeight="700" fill={isSelected("rotor") ? PART_COLORS.rotor : "#64748b"}>ROTOR</text>
          </g>

          {/* Caliper — wrapping rectangle */}
          <g onClick={() => sel("caliper")} style={{ cursor: "pointer" }}>
            <rect x="150" y="45" width="120" height="60" rx="10"
              fill={fill("caliper")} stroke={stroke("caliper")} strokeWidth="3" />
            <text x="210" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill={isSelected("caliper") ? PART_COLORS.caliper : "#64748b"}>CALIPER</text>
            <text x="210" y="86" textAnchor="middle" fontSize="8" fill="#64748b">Floating</text>
          </g>

          {/* Pad — inner face */}
          <g onClick={() => sel("pad")} style={{ cursor: "pointer" }}>
            <rect x="165" y="108" width="90" height="14" rx="3"
              fill={isSelected("pad") ? B_RED + "40" : "#fecaca"}
              stroke={isSelected("pad") ? B_RED : "#fca5a5"} strokeWidth="2" />
            <text x="210" y="119" textAnchor="middle" fontSize="8" fontWeight="700" fill={B_RED}>BRAKE PAD</text>
          </g>

          {/* Piston */}
          <g onClick={() => sel("piston")} style={{ cursor: "pointer" }}>
            <rect x="180" y="93" width="60" height="16" rx="4"
              fill={fill("piston")} stroke={stroke("piston")} strokeWidth="2.5" />
            <text x="210" y="105" textAnchor="middle" fontSize="8" fontWeight="700" fill={isSelected("piston") ? PART_COLORS.piston : "#64748b"}>PISTON</text>
          </g>

          {/* Hose */}
          <g onClick={() => sel("hose")} style={{ cursor: "pointer" }}>
            <path d="M270,75 Q310,75 315,55" stroke={isSelected("hose") ? B_YELLOW : "#94a3b8"}
              strokeWidth="5" fill="none" strokeLinecap="round" />
            <text x="320" y="50" fontSize="8" fontWeight="700" fill={isSelected("hose") ? B_YELLOW : "#64748b"}>HOSE</text>
          </g>

          {/* Callout legend */}
          {!selected && (
            <text x="210" y="225" textAnchor="middle" fontSize="9" fill="#94a3b8">
              Click any part to learn about it
            </text>
          )}
        </svg>
      </div>

      {selected && BRAKE_PARTS.includes(selected) && (
        <div className="mb-4 rounded-2xl border-2 p-4 text-sm"
          style={{ borderColor: PART_COLORS[selected], background: PART_COLORS[selected] + "10" }}>
          <div className="font-extrabold text-slate-800 mb-1">
            {t(`lessons.brakeSystem.parts.${selected}.label`)}
          </div>
          <div className="text-slate-700">
            {t(`lessons.brakeSystem.parts.${selected}.desc`)}
          </div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelected(null)}>
            {t("lessons.close")}
          </button>
        </div>
      )}

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.brakeSystem.section1Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 2: Measurement ───────────────────────────────────────────────────
function MeasurementSection() {
  const { t } = useTranslation();
  const [padMM, setPadMM]     = useState(8);
  const [rotorMM, setRotorMM] = useState(26);

  const padStatus   = padMM >= 4   ? "ok"    : padMM >= 2 ? "warn" : "replace";
  const rotorStatus = rotorMM >= 22 ? "ok"    : rotorMM >= 20 ? "warn" : "replace";

  const statusColor = (s) => s === "ok" ? B_GREEN : s === "warn" ? B_YELLOW : B_RED;
  const statusLabel = (s) => s === "ok"
    ? t("lessons.brakeSystem.statusOk")
    : s === "warn"
    ? t("lessons.brakeSystem.statusWarn")
    : t("lessons.brakeSystem.statusReplace");

  return (
    <SectionCard
      icon="📏"
      title={t("lessons.brakeSystem.section2Title")}
      subtitle={t("lessons.brakeSystem.section2Subtitle")}
    >
      {/* Pad thickness */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="font-extrabold text-slate-800 text-sm">
            🔴 {t("lessons.brakeSystem.padThickness")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold" style={{ color: statusColor(padStatus) }}>
              {padMM}mm
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold text-white"
              style={{ background: statusColor(padStatus) }}>
              {statusLabel(padStatus)}
            </span>
          </div>
        </div>
        <input type="range" min="0" max="14" value={padMM}
          onChange={(e) => setPadMM(Number(e.target.value))}
          className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0mm (worn)</span>
          <span className="text-red-600 font-bold">2mm = replace</span>
          <span className="text-yellow-600 font-bold">4mm = warn</span>
          <span>14mm (new)</span>
        </div>
      </div>

      {/* Rotor thickness */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <div className="font-extrabold text-slate-800 text-sm">
            ⚙️ {t("lessons.brakeSystem.rotorThickness")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold" style={{ color: statusColor(rotorStatus) }}>
              {rotorMM}mm
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold text-white"
              style={{ background: statusColor(rotorStatus) }}>
              {statusLabel(rotorStatus)}
            </span>
          </div>
        </div>
        <input type="range" min="18" max="30" value={rotorMM}
          onChange={(e) => setRotorMM(Number(e.target.value))}
          className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>18mm (worn)</span>
          <span className="text-red-600 font-bold">20mm = replace</span>
          <span>30mm (new)</span>
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: t("lessons.brakeSystem.padLabel"), value: padMM + "mm", status: padStatus },
          { label: t("lessons.brakeSystem.rotorLabel"), value: rotorMM + "mm", status: rotorStatus },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border-2 p-3 text-center"
            style={{ borderColor: statusColor(item.status), background: statusColor(item.status) + "10" }}>
            <div className="text-xs text-slate-500 mb-1">{item.label}</div>
            <div className="text-xl font-extrabold" style={{ color: statusColor(item.status) }}>
              {item.value}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: statusColor(item.status) }}>
              {statusLabel(item.status)}
            </div>
          </div>
        ))}
      </div>

      <InfoBox color={padStatus === "replace" || rotorStatus === "replace" ? "red" : "blue"}>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.brakeSystem.section2Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 3: Bleeding Procedure ───────────────────────────────────────────
const BLEED_STEPS = [
  { step: 1, key: "bleed1", icon: "🔋", color: B_BLUE   },
  { step: 2, key: "bleed2", icon: "🔩", color: B_ORANGE },
  { step: 3, key: "bleed3", icon: "💧", color: B_BLUE   },
  { step: 4, key: "bleed4", icon: "🔧", color: B_BLUE   },
  { step: 5, key: "bleed5", icon: "✅", color: B_GREEN  },
];

function BleedingSection() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = BLEED_STEPS[step];

  // Bleed order visual: RR → LR → RF → LF
  const WHEELS = [
    { label: "RF", x: 50,  y: 30,  order: 3 },
    { label: "LF", x: 200, y: 30,  order: 4 },
    { label: "RR", x: 50,  y: 130, order: 1 },
    { label: "LR", x: 200, y: 130, order: 2 },
  ];
  const activeWheel = [null,"RR","LR","RF","LF"][step] || null;

  return (
    <SectionCard
      icon="💧"
      title={t("lessons.brakeSystem.section3Title")}
      subtitle={t("lessons.brakeSystem.section3Subtitle")}
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {BLEED_STEPS.map((s, i) => (
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
          {t("lessons.step")} {step + 1} {t("lessons.of")} {BLEED_STEPS.length}
        </span>
      </div>

      {/* Brake bleed order diagram */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 300 180" className="w-full max-w-sm">
          {/* Car body outline */}
          <rect x="80" y="60" width="140" height="70" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <text x="150" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">🚗</text>
          <text x="150" y="115" textAnchor="middle" fontSize="8" fill="#64748b">
            {t("lessons.brakeSystem.bleedOrder")}
          </text>

          {/* Wheels */}
          {WHEELS.map((w) => {
            const isActive = w.label === activeWheel;
            const highlight = isActive;
            return (
              <g key={w.label}>
                <circle cx={w.x + 30} cy={w.y + 25} r="22"
                  fill={highlight ? B_BLUE + "20" : "#f1f5f9"}
                  stroke={highlight ? B_BLUE : "#94a3b8"} strokeWidth={highlight ? 3 : 1.5} />
                <text x={w.x + 30} y={w.y + 21} textAnchor="middle" fontSize="10" fontWeight="700"
                  fill={highlight ? B_BLUE : "#64748b"}>{w.label}</text>
                <text x={w.x + 30} y={w.y + 33} textAnchor="middle" fontSize="8"
                  fill={highlight ? B_BLUE : "#94a3b8"}>#{w.order}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border-2 p-4 mb-4"
        style={{ borderColor: current.color, background: current.color + "10" }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{current.icon}</span>
          <div>
            <div className="font-extrabold text-slate-800 mb-1">
              {t(`lessons.brakeSystem.bleeding.${current.key}Title`)}
            </div>
            <div className="text-sm text-slate-700">
              {t(`lessons.brakeSystem.bleeding.${current.key}Desc`)}
            </div>
          </div>
        </div>
      </div>

      <InfoBox>
        💡 <strong>{t("lessons.tipPrefix")}:</strong>{" "}
        {t(`lessons.brakeSystem.bleeding.${current.key}Tip`)}
      </InfoBox>

      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40">
          {t("lessons.previous")}
        </button>
        <button onClick={() => setStep((s) => Math.min(BLEED_STEPS.length - 1, s + 1))}
          disabled={step === BLEED_STEPS.length - 1}
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
      { id: "b", tKey: "q1b", correct: false },
      { id: "c", tKey: "q1c", correct: true  },
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
      { id: "b", tKey: "q3b", correct: true  },
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
      title={t("lessons.brakeSystem.section4Title")}
      subtitle={t("lessons.brakeSystem.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.brakeSystem.quiz.${q.qKey}`)}
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
                      {t(`lessons.brakeSystem.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.brakeSystem.quiz.${q.expKey}`)}
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
export function BrakeSystem() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "components",  labelKey: "lessons.brakeSystem.navPills.components"  },
    { id: "measurement", labelKey: "lessons.brakeSystem.navPills.measurement" },
    { id: "bleeding",    labelKey: "lessons.brakeSystem.navPills.bleeding"    },
    { id: "quiz",        labelKey: "lessons.brakeSystem.navPills.quiz"        },
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
              {t("lessons.brakeSystem.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.brakeSystem.description")}
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
            <a key={s.id} href={`#brake-lesson-${s.id}`}
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
            {t("lessons.lessonCompleteBody", { title: t("lessons.brakeSystem.title") })}
          </div>
        </div>
      )}

      <div id="brake-lesson-components">
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

      <div id="brake-lesson-measurement">
        <MeasurementSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("measurement")} disabled={completedSections.has("measurement")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("measurement") ? B_GREEN : B_BLUE,
              background:  completedSections.has("measurement") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("measurement") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("measurement") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="brake-lesson-bleeding">
        <BleedingSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("bleeding")} disabled={completedSections.has("bleeding")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("bleeding") ? B_GREEN : B_BLUE,
              background:  completedSections.has("bleeding") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("bleeding") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("bleeding") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="brake-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
