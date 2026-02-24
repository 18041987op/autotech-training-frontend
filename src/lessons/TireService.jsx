/**
 * TireService — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Tire Sizing — interactive sidewall decoder
 *   2. TPMS & Inflation — pressure gauge interaction
 *   3. Rotation Patterns — vehicle rotation diagram
 *   4. Mini-Quiz — 3 questions
 *
 * All content strings come from i18n keys under "lessons.tireService.*"
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

// ─── SECTION 1: Tire Sizing ───────────────────────────────────────────────────
const SIDEWALL_SEGMENTS = [
  { id: "width",       label: "225",  color: B_BLUE,   x1: 30,  x2: 90  },
  { id: "slash",       label: "/",    color: "#94a3b8", x1: 90,  x2: 100 },
  { id: "aspect",      label: "60",   color: B_ORANGE, x1: 100, x2: 140 },
  { id: "construction",label: "R",    color: "#8b5cf6", x1: 140, x2: 160 },
  { id: "diameter",    label: "16",   color: B_GREEN,  x1: 160, x2: 200 },
];

function TireSizingSection() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  return (
    <SectionCard
      icon="🔵"
      title={t("lessons.tireService.section1Title")}
      subtitle={t("lessons.tireService.section1Subtitle")}
    >
      {/* Sidewall visualization */}
      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 420 180" className="w-full max-w-lg" style={{ fontFamily: "sans-serif" }}>

          {/* Tire circle */}
          <circle cx="330" cy="90" r="75" fill="#1e293b" />
          <circle cx="330" cy="90" r="48" fill="#475569" />
          <circle cx="330" cy="90" r="30" fill="#94a3b8" />
          <text x="330" y="87" textAnchor="middle" fontSize="8" fill="white" fontWeight="700">16"</text>
          <text x="330" y="98" textAnchor="middle" fontSize="7" fill="#cbd5e1">RIM</text>

          {/* Sidewall label */}
          <text x="260" y="70" fontSize="8" fill="#94a3b8" transform="rotate(-45,260,70)">P225/60R16</text>

          {/* Sidewall decode */}
          <rect x="10" y="130" width="220" height="40" rx="8" fill="#1e293b" />
          {SIDEWALL_SEGMENTS.map((seg) => (
            <text key={seg.id} x={seg.x1 + 10} y="156" fontSize="16" fontWeight="900"
              fill={selected === seg.id ? seg.color : "white"}
              style={{ cursor: "pointer" }}
              onClick={() => setSelected(selected === seg.id ? null : seg.id)}>
              {seg.label}
            </text>
          ))}

          {/* Clickable hitboxes */}
          {SIDEWALL_SEGMENTS.filter(s => s.id !== "slash").map((seg) => (
            <rect key={seg.id + "_hit"}
              x={seg.x1 + 10} y="132" width={seg.x2 - seg.x1} height="34" rx="4"
              fill="transparent"
              stroke={selected === seg.id ? seg.color : "transparent"} strokeWidth="2"
              style={{ cursor: "pointer" }}
              onClick={() => setSelected(selected === seg.id ? null : seg.id)} />
          ))}

          <text x="120" y="178" textAnchor="middle" fontSize="7" fill="#64748b">
            ↑ Tap each number to learn what it means
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SIDEWALL_SEGMENTS.filter((s) => s.id !== "slash").map((seg) => (
          <button key={seg.id}
            onClick={() => setSelected(selected === seg.id ? null : seg.id)}
            className="rounded-2xl border-2 p-3 text-left transition-all"
            style={{
              borderColor: selected === seg.id ? seg.color : "#e2e8f0",
              background:  selected === seg.id ? seg.color + "10" : "white",
            }}>
            <div className="text-lg font-extrabold" style={{ color: seg.color }}>{seg.label}</div>
            <div className="text-xs font-bold text-slate-700">
              {t(`lessons.tireService.sidewall.${seg.id}.label`)}
            </div>
          </button>
        ))}
      </div>

      {selected && selected !== "slash" && (
        <div className="rounded-2xl border-2 p-4 text-sm mb-4"
          style={{ borderColor: SIDEWALL_SEGMENTS.find(s=>s.id===selected)?.color || B_BLUE,
                   background:  (SIDEWALL_SEGMENTS.find(s=>s.id===selected)?.color || B_BLUE) + "10" }}>
          <div className="font-extrabold text-slate-800 mb-1">
            {t(`lessons.tireService.sidewall.${selected}.label`)}
          </div>
          <div className="text-slate-700">
            {t(`lessons.tireService.sidewall.${selected}.desc`)}
          </div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelected(null)}>
            {t("lessons.close")}
          </button>
        </div>
      )}

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.tireService.section1Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 2: TPMS & Inflation ─────────────────────────────────────────────
function TPMSSection() {
  const { t } = useTranslation();
  const [pressures, setPressures] = useState({ FL: 32, FR: 28, RL: 35, RR: 32 });

  const SPEC = 32;
  const status = (psi) => {
    if (psi < 25)      return "danger";
    if (psi < 29)      return "low";
    if (psi > 38)      return "high";
    if (psi >= 30 && psi <= 35) return "ok";
    return "warn";
  };
  const statusColor = (s) => ({
    ok:     B_GREEN,
    warn:   B_YELLOW,
    low:    B_ORANGE,
    high:   B_RED,
    danger: B_RED,
  }[s]);

  const setWheel = (wheel, val) =>
    setPressures((prev) => ({ ...prev, [wheel]: val }));

  const WHEELS_UI = [
    { id: "FL", label: "FL", x: 30,  y: 30  },
    { id: "FR", label: "FR", x: 120, y: 30  },
    { id: "RL", label: "RL", x: 30,  y: 120 },
    { id: "RR", label: "RR", x: 120, y: 120 },
  ];

  const allOk = Object.values(pressures).every((p) => status(p) === "ok");

  return (
    <SectionCard
      icon="💨"
      title={t("lessons.tireService.section2Title")}
      subtitle={t("lessons.tireService.section2Subtitle")}
    >
      {/* Pressure gauge diagram */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 230 180" className="w-full max-w-xs">
          {/* Car body */}
          <rect x="75" y="60" width="80" height="60" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <text x="115" y="94" textAnchor="middle" fontSize="10" fill="#64748b">🚗</text>

          {WHEELS_UI.map((w) => {
            const psi = pressures[w.id];
            const s   = status(psi);
            const col = statusColor(s);
            return (
              <g key={w.id}>
                <circle cx={w.x + 20} cy={w.y + 20} r="22"
                  fill={col + "20"} stroke={col} strokeWidth="2.5" />
                <text x={w.x + 20} y={w.y + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill={col}>
                  {w.label}
                </text>
                <text x={w.x + 20} y={w.y + 27} textAnchor="middle" fontSize="11" fontWeight="900" fill={col}>
                  {psi}
                </text>
                <text x={w.x + 20} y={w.y + 37} textAnchor="middle" fontSize="7" fill="#64748b">PSI</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Sliders */}
      <div className="space-y-3 mb-4">
        {WHEELS_UI.map((w) => {
          const psi = pressures[w.id];
          const s   = status(psi);
          const col = statusColor(s);
          return (
            <div key={w.id} className="flex items-center gap-3">
              <span className="w-8 text-xs font-extrabold text-slate-700">{w.label}</span>
              <input type="range" min="15" max="50" value={psi}
                onChange={(e) => setWheel(w.id, Number(e.target.value))}
                className="flex-1" />
              <span className="w-14 text-right font-extrabold text-sm" style={{ color: col }}>
                {psi} PSI
              </span>
              <span className="w-16 text-xs font-bold text-right" style={{ color: col }}>
                {t(`lessons.tireService.pressureStatus.${s}`)}
              </span>
            </div>
          );
        })}
      </div>

      {allOk ? (
        <div className="rounded-2xl border-2 p-3 mb-4"
          style={{ borderColor: B_GREEN, background: "#f0fdf4" }}>
          <div className="font-extrabold text-green-800 text-sm">
            ✅ {t("lessons.tireService.allPressuresOk")}
          </div>
          <div className="text-xs text-green-700 mt-0.5">
            {t("lessons.tireService.allPressuresOkDesc")}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 p-3 mb-4"
          style={{ borderColor: B_ORANGE, background: "#fff7ed" }}>
          <div className="font-extrabold text-orange-800 text-sm">
            ⚠️ {t("lessons.tireService.pressureIssues")}
          </div>
          <div className="text-xs text-orange-700 mt-0.5">
            {t("lessons.tireService.pressureIssuesDesc", { spec: SPEC })}
          </div>
        </div>
      )}

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.tireService.section2Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 3: Rotation Patterns ────────────────────────────────────────────
const ROTATION_PATTERNS = ["forward", "xPattern", "rearward"];

function RotationSection() {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState("forward");

  const ARROWS = {
    forward:  [{ x1:60,y1:90, x2:60,y2:40, label:"FL→RL" },  { x1:160,y1:90, x2:160,y2:40, label:"FR→RR" },
               { x1:60,y1:140, x2:60,y2:90, label:"RL→FL" }, { x1:160,y1:140, x2:160,y2:90, label:"RR→FR" }],
    xPattern: [{ x1:60,y1:140, x2:160,y2:40, label:"RL→FR" }, { x1:160,y1:140, x2:60,y2:40, label:"RR→FL" },
               { x1:60,y1:90, x2:160,y2:90, label:"FL→FR" }, { x1:160,y1:90, x2:60,y2:90, label:"FR→FL" }],
    rearward: [{ x1:60,y1:40, x2:60,y2:140, label:"FL→RL" }, { x1:160,y1:40, x2:160,y2:140, label:"FR→RR" },
               { x1:60,y1:90, x2:160,y2:40, label:"RL→FR" }, { x1:160,y1:90, x2:60,y2:40, label:"RR→FL" }],
  };

  const WHEELS_POS = [
    { id: "FL", x: 40,  y: 25  },
    { id: "FR", x: 140, y: 25  },
    { id: "RL", x: 40,  y: 115 },
    { id: "RR", x: 140, y: 115 },
  ];

  return (
    <SectionCard
      icon="🔄"
      title={t("lessons.tireService.section3Title")}
      subtitle={t("lessons.tireService.section3Subtitle")}
    >
      {/* Pattern selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROTATION_PATTERNS.map((id) => (
          <button key={id} onClick={() => setPattern(id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all"
            style={{
              borderColor: pattern === id ? B_BLUE : "#e2e8f0",
              background:  pattern === id ? B_SOFT : "white",
              color:       pattern === id ? B_BLUE : "#64748b",
            }}>
            {t(`lessons.tireService.patterns.${id}.label`)}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 230 180" className="w-full max-w-xs">
          {/* Car body */}
          <rect x="70" y="50" width="90" height="90" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="115" y="100" textAnchor="middle" fontSize="11" fill="#94a3b8">🚗</text>

          {/* Arrows */}
          <defs>
            <marker id="arrow-tire" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={B_ORANGE} />
            </marker>
          </defs>
          {ARROWS[pattern].map((a, i) => (
            <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
              stroke={B_ORANGE} strokeWidth="2.5" strokeDasharray="5 3"
              markerEnd="url(#arrow-tire)" />
          ))}

          {/* Wheel circles */}
          {WHEELS_POS.map((w) => (
            <g key={w.id}>
              <circle cx={w.x + 20} cy={w.y + 20} r="20" fill={B_SOFT} stroke={B_BLUE} strokeWidth="2" />
              <text x={w.x + 20} y={w.y + 24} textAnchor="middle" fontSize="10" fontWeight="700" fill={B_BLUE}>
                {w.id}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="rounded-2xl border-2 p-4 text-sm mb-4"
        style={{ borderColor: B_BLUE, background: B_SOFT }}>
        <div className="font-extrabold text-slate-800 mb-1">
          {t(`lessons.tireService.patterns.${pattern}.label`)}
        </div>
        <div className="text-slate-700">
          {t(`lessons.tireService.patterns.${pattern}.desc`)}
        </div>
      </div>

      <InfoBox>
        <strong>{t("lessons.tipPrefix")}:</strong> {t("lessons.tireService.section3Tip")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 4: Quiz ─────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 1, qKey: "q1", expKey: "q1exp",
    options: [
      { id: "a", tKey: "q1a", correct: true  },
      { id: "b", tKey: "q1b", correct: false },
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
      title={t("lessons.tireService.section4Title")}
      subtitle={t("lessons.tireService.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.tireService.quiz.${q.qKey}`)}
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
                      {t(`lessons.tireService.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong>{" "}
                  {t(`lessons.tireService.quiz.${q.expKey}`)}
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
export function TireService() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;
  const markSection = (id) => setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "sizing",   labelKey: "lessons.tireService.navPills.sizing"   },
    { id: "tpms",     labelKey: "lessons.tireService.navPills.tpms"     },
    { id: "rotation", labelKey: "lessons.tireService.navPills.rotation" },
    { id: "quiz",     labelKey: "lessons.tireService.navPills.quiz"     },
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
              {t("lessons.tireService.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.tireService.description")}
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
            <a key={s.id} href={`#tire-lesson-${s.id}`}
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
            {t("lessons.lessonCompleteBody", { title: t("lessons.tireService.title") })}
          </div>
        </div>
      )}

      <div id="tire-lesson-sizing">
        <TireSizingSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("sizing")} disabled={completedSections.has("sizing")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("sizing") ? B_GREEN : B_BLUE,
              background:  completedSections.has("sizing") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("sizing") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("sizing") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="tire-lesson-tpms">
        <TPMSSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("tpms")} disabled={completedSections.has("tpms")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("tpms") ? B_GREEN : B_BLUE,
              background:  completedSections.has("tpms") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("tpms") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("tpms") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="tire-lesson-rotation">
        <RotationSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("rotation")} disabled={completedSections.has("rotation")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("rotation") ? B_GREEN : B_BLUE,
              background:  completedSections.has("rotation") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("rotation") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("rotation") ? `✓ ${t("lessons.sectionComplete")}` : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="tire-lesson-quiz">
        <QuizSection onComplete={() => { markSection("quiz"); setLessonDone(true); }} />
      </div>
    </div>
  );
}
