/**
 * ElectricalCircuitBasics — Interactive Lesson (Bilingual via i18n)
 *
 * Sections:
 *   1. Basic Circuit — animated SVG, switch ON/OFF, clickable components
 *   2. Types of Faults — Open / Short / High Resistance toggle
 *   3. Testing with a Power Probe — step-by-step procedure
 *   4. Mini-Quiz — 3 diagnostic questions
 *
 * All content strings come from i18n keys under "lessons.electricalCircuitBasics.*"
 * so the lesson is fully bilingual (EN / ES).
 */
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const B_BLUE   = "#1E6FAE";
const B_ORANGE = "#F7941D";
const B_SOFT   = "#E6F1FA";
const B_GREEN  = "#22c55e";
const B_RED    = "#ef4444";

// ─── CSS injected once ────────────────────────────────────────────────────────
const STYLES = `
@keyframes electron-flow {
  0%   { stroke-dashoffset: 120; }
  100% { stroke-dashoffset: 0;   }
}
@keyframes lamp-glow {
  0%, 100% { opacity: 0.6; r: 10; }
  50%       { opacity: 1;   r: 13; }
}
@keyframes lesson-fadein {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.electron-wire {
  stroke-dasharray: 8 10;
  animation: electron-flow 0.9s linear infinite;
}
.lamp-glow {
  animation: lamp-glow 1.1s ease-in-out infinite;
}
.lesson-section {
  animation: lesson-fadein 0.4s ease both;
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

// ─── Shared UI helpers ────────────────────────────────────────────────────────
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
    : "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ─── SECTION 1: Basic Circuit ─────────────────────────────────────────────────
function CircuitSection() {
  const { t } = useTranslation();
  const [switchOn, setSwitchOn]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);

  const circuitClosed = switchOn;
  const wireColor     = circuitClosed ? B_BLUE  : "#cbd5e1";
  const lampFill      = circuitClosed ? "#fef08a" : "#f1f5f9";
  const lampStroke    = circuitClosed ? B_ORANGE  : "#94a3b8";

  const COMPONENT_KEYS = ["battery", "fuse", "switch", "lamp", "ground"];

  return (
    <SectionCard
      icon="⚡"
      title={t("lessons.electricalCircuitBasics.section1Title")}
      subtitle={t("lessons.electricalCircuitBasics.section1Subtitle")}
    >
      {/* SVG Circuit */}
      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 420 220" className="w-full max-w-lg" style={{ fontFamily: "sans-serif" }}>

          {/* Wires */}
          {circuitClosed ? (
            <path d="M60,60 H180 H260 H340" stroke={wireColor} strokeWidth="4" fill="none"
              className="electron-wire" strokeLinecap="round" />
          ) : (
            <path d="M60,60 H180 H260 H340" stroke={wireColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
          {circuitClosed ? (
            <path d="M340,160 H210 H60" stroke={wireColor} strokeWidth="4" fill="none"
              className="electron-wire" strokeLinecap="round" strokeDashoffset="60" />
          ) : (
            <path d="M340,160 H210 H60" stroke={wireColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
          <line x1="60"  y1="60"  x2="60"  y2="160" stroke={wireColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="340" y1="60"  x2="340" y2="160" stroke={wireColor} strokeWidth="4" strokeLinecap="round" />

          {/* Battery */}
          <g onClick={() => setSelected(selected === "battery" ? null : "battery")} style={{ cursor: "pointer" }}>
            <rect x="20" y="90" width="80" height="40" rx="8"
              fill={selected === "battery" ? B_SOFT : "#f8fafc"}
              stroke={selected === "battery" ? B_BLUE : "#94a3b8"} strokeWidth="2" />
            <text x="60" y="108" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">🔋</text>
            <text x="60" y="122" textAnchor="middle" fontSize="9" fill="#64748b">12V BAT</text>
            <text x="24" y="85"  fontSize="11" fontWeight="900" fill={B_BLUE}>+</text>
            <text x="90" y="165" fontSize="11" fontWeight="900" fill="#64748b">−</text>
          </g>

          {/* Fuse */}
          <g onClick={() => setSelected(selected === "fuse" ? null : "fuse")} style={{ cursor: "pointer" }}>
            <rect x="150" y="45" width="60" height="30" rx="6"
              fill={selected === "fuse" ? B_SOFT : "#f8fafc"}
              stroke={selected === "fuse" ? B_BLUE : "#94a3b8"} strokeWidth="2" />
            <text x="180" y="60" textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">⚡ Fuse</text>
            <text x="180" y="71" textAnchor="middle" fontSize="8" fill="#64748b">15A</text>
          </g>

          {/* Switch */}
          <g onClick={() => { setSwitchOn(!switchOn); setSelected("switch"); }} style={{ cursor: "pointer" }}>
            <rect x="230" y="44" width="60" height="32" rx="8"
              fill={switchOn ? B_BLUE : "#f8fafc"}
              stroke={switchOn ? B_BLUE : "#94a3b8"} strokeWidth="2" />
            <text x="260" y="60" textAnchor="middle" fontSize="10" fontWeight="700"
              fill={switchOn ? "white" : "#334155"}>{switchOn ? "ON ●" : "OFF ○"}</text>
            <text x="260" y="71" textAnchor="middle" fontSize="8"
              fill={switchOn ? "#bfdbfe" : "#94a3b8"}>Click</text>
          </g>

          {/* Lamp */}
          <g onClick={() => setSelected(selected === "lamp" ? null : "lamp")} style={{ cursor: "pointer" }}>
            {circuitClosed && (
              <circle cx="340" cy="110" r="28" fill="#fef08a" opacity="0.4" className="lamp-glow" />
            )}
            <circle cx="340" cy="110" r="22" fill={lampFill} stroke={lampStroke} strokeWidth="2.5" />
            <text x="340" y="107" textAnchor="middle" fontSize="14">💡</text>
            <text x="340" y="119" textAnchor="middle" fontSize="8" fill="#64748b">LAMP</text>
          </g>

          {/* Ground */}
          <g onClick={() => setSelected(selected === "ground" ? null : "ground")} style={{ cursor: "pointer" }}>
            <line x1="210" y1="160" x2="210" y2="185" stroke="#94a3b8" strokeWidth="3" />
            <line x1="196" y1="185" x2="224" y2="185" stroke="#64748b" strokeWidth="3" />
            <line x1="200" y1="190" x2="220" y2="190" stroke="#64748b" strokeWidth="2" />
            <line x1="205" y1="195" x2="215" y2="195" stroke="#64748b" strokeWidth="1.5" />
            <rect x="170" y="148" width="80" height="20" rx="6" fill="transparent"
              stroke={selected === "ground" ? B_BLUE : "transparent"} strokeWidth="2" />
            <text x="210" y="145" textAnchor="middle" fontSize="8" fill="#64748b">GND</text>
          </g>

          {/* Voltage labels when on */}
          {circuitClosed && (
            <>
              <text x="120" y="50" fontSize="8" fill={B_BLUE} fontWeight="600">12V</text>
              <text x="300" y="50" fontSize="8" fill={B_BLUE} fontWeight="600">12V</text>
              <text x="300" y="175" fontSize="8" fill="#64748b" fontWeight="600">0V</text>
            </>
          )}
        </svg>
      </div>

      {/* Component description */}
      {selected && COMPONENT_KEYS.includes(selected) && (
        <div className="mb-4 rounded-2xl border-2 p-4 text-sm"
          style={{ borderColor: B_BLUE, background: B_SOFT }}>
          <div className="font-extrabold text-slate-800 mb-1">
            {t(`lessons.electricalCircuitBasics.components.${selected}.label`)}
          </div>
          <div className="text-slate-700">
            {t(`lessons.electricalCircuitBasics.components.${selected}.desc`)}
          </div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelected(null)}>
            {t("lessons.close")}
          </button>
        </div>
      )}

      {/* Switch toggle */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setSwitchOn(!switchOn)}
          className="px-5 py-2 rounded-2xl font-extrabold text-sm transition-all"
          style={{
            background:   switchOn ? B_BLUE : "#f1f5f9",
            color:        switchOn ? "white" : "#475569",
            border:       `2px solid ${switchOn ? B_BLUE : "#cbd5e1"}`,
          }}
        >
          {switchOn
            ? t("lessons.electricalCircuitBasics.switchOn")
            : t("lessons.electricalCircuitBasics.switchOff")}
        </button>
        <span className="text-sm text-slate-600">
          {switchOn
            ? t("lessons.electricalCircuitBasics.circuitClosed")
            : t("lessons.electricalCircuitBasics.circuitOpen")}
        </span>
      </div>

      {/* Mini-quiz */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="font-extrabold text-slate-800 mb-3 text-sm">
          {t("lessons.electricalCircuitBasics.quickQuestion")}
        </div>
        <div className="grid gap-2">
          {[
            { id: "a", tKey: "q1a", correct: false },
            { id: "b", tKey: "q1b", correct: true  },
            { id: "c", tKey: "q1c", correct: false },
            { id: "d", tKey: "q1d", correct: false },
          ].map((opt) => {
            const chosen = quizAnswer === opt.id;
            let bg = "bg-white border-slate-200";
            let label = null;
            if (chosen) {
              bg    = opt.correct ? "border-brand-primary bg-blue-50" : "border-brand-accent bg-orange-50";
              label = opt.correct
                ? t("lessons.correct")
                : t("lessons.incorrect");
            }
            return (
              <button key={opt.id} onClick={() => setQuizAnswer(opt.id)}
                className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${bg}`}>
                <span className="mr-2 text-slate-500">{opt.id.toUpperCase()}.</span>
                {t(`lessons.electricalCircuitBasics.fuses.${opt.tKey}`)}
                {label && (
                  <span className={`ml-2 text-xs font-extrabold ${opt.correct ? "text-blue-700" : "text-orange-700"}`}>
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {quizAnswer && (
          <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
            <strong>{t("lessons.explanation")}:</strong> {t("lessons.electricalCircuitBasics.fuseExplanation")}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── SECTION 2: Types of Faults ───────────────────────────────────────────────
const FAULT_IDS = ["normal", "open", "short", "resistance"];

function FaultsSection() {
  const { t } = useTranslation();
  const [fault, setFault] = useState("normal");

  const FAULT_COLORS = {
    normal:     B_GREEN,
    open:       B_RED,
    short:      B_ORANGE,
    resistance: "#eab308",
  };

  const FAULT_WIRE_COLORS = {
    normal:     B_BLUE,
    open:       B_RED,
    short:      B_ORANGE,
    resistance: "#eab308",
  };

  const FAULT_LAMP_ON  = { normal: true,  open: false, short: false, resistance: true  };
  const FAULT_LAMP_DIM = { normal: false, open: false, short: false, resistance: true  };

  const color     = FAULT_COLORS[fault];
  const wireColor = FAULT_WIRE_COLORS[fault];
  const lampOn    = FAULT_LAMP_ON[fault];
  const dim       = FAULT_LAMP_DIM[fault];

  return (
    <SectionCard
      icon="🔧"
      title={t("lessons.electricalCircuitBasics.section2Title")}
      subtitle={t("lessons.electricalCircuitBasics.section2Subtitle")}
    >
      {/* Fault selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FAULT_IDS.map((id) => (
          <button key={id} onClick={() => setFault(id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all"
            style={{
              borderColor: fault === id ? FAULT_COLORS[id] : "#e2e8f0",
              background:  fault === id ? FAULT_COLORS[id] + "18" : "white",
              color:       fault === id ? FAULT_COLORS[id] : "#64748b",
            }}>
            {t(`lessons.electricalCircuitBasics.faults.${id}.label`)}
          </button>
        ))}
      </div>

      {/* Fault SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 420 200" className="w-full max-w-lg">
          {fault === "open" ? (
            <>
              <path d="M60,60 H230" stroke={wireColor} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M270,60 H340" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
              <line x1="238" y1="50" x2="248" y2="72" stroke={B_RED} strokeWidth="3" />
              <line x1="252" y1="50" x2="262" y2="72" stroke={B_RED} strokeWidth="3" />
              <text x="250" y="45" textAnchor="middle" fontSize="9" fill={B_RED} fontWeight="700">OPEN</text>
            </>
          ) : fault === "short" ? (
            <>
              <path d="M60,60 H180" stroke={wireColor} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M180,60 L180,160" stroke={B_RED} strokeWidth="4" strokeDasharray="6 4" fill="none" />
              <text x="195" y="115" fontSize="9" fill={B_RED} fontWeight="700">SHORT!</text>
              <path d="M180,60 H340" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <path d="M60,60 H340" stroke={wireColor} strokeWidth="4"
              className={lampOn && !dim ? "electron-wire" : ""}
              fill="none" strokeLinecap="round" />
          )}
          <path d="M340,160 H60" stroke={fault === "open" ? "#cbd5e1" : wireColor}
            strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="60"  y1="60"  x2="60"  y2="160" stroke={wireColor} strokeWidth="4" />
          <line x1="340" y1="60"  x2="340" y2="160"
            stroke={fault === "open" ? "#cbd5e1" : wireColor} strokeWidth="4" />

          {/* Battery */}
          <rect x="20" y="90" width="80" height="38" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <text x="60" y="108" textAnchor="middle" fontSize="12">🔋</text>
          <text x="60" y="122" textAnchor="middle" fontSize="9" fill="#64748b">12V</text>

          {/* Fuse */}
          <rect x="150" y="45" width="60" height="28" rx="6"
            fill={fault === "short" ? "#fee2e2" : "#f8fafc"}
            stroke={fault === "short" ? B_RED : "#94a3b8"} strokeWidth="2" />
          <text x="180" y="60" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">
            {fault === "short" ? "💥 FUSE" : "⚡ Fuse"}
          </text>
          <text x="180" y="70" textAnchor="middle" fontSize="8" fill="#64748b">
            {fault === "short" ? "BLOWN" : "15A"}
          </text>

          {/* Switch */}
          <rect x="235" y="44" width="55" height="28" rx="6"
            fill={fault === "open" ? "#fee2e2" : "#f0fdf4"}
            stroke={fault === "open" ? B_RED : "#86efac"} strokeWidth="2" />
          <text x="262" y="62" textAnchor="middle" fontSize="9" fill="#334155" fontWeight="700">
            {fault === "open" ? "🔴 OPEN" : "🟢 ON"}
          </text>

          {/* Lamp */}
          {lampOn && (
            <circle cx="340" cy="110" r="26" fill="#fef08a"
              opacity={dim ? 0.3 : 0.4}
              className={dim ? "" : "lamp-glow"} />
          )}
          <circle cx="340" cy="110" r="21"
            fill={lampOn ? (dim ? "#fef9c3" : "#fef08a") : "#f1f5f9"}
            stroke={lampOn ? B_ORANGE : "#94a3b8"} strokeWidth="2.5" />
          <text x="340" y="107" textAnchor="middle" fontSize="13">💡</text>
          <text x="340" y="119" textAnchor="middle" fontSize="8" fill="#64748b">
            {dim ? "DIM" : lampOn ? "ON" : "OFF"}
          </text>

          {/* Ground */}
          <line x1="210" y1="160" x2="210" y2="178" stroke="#94a3b8" strokeWidth="3" />
          <line x1="197" y1="178" x2="223" y2="178" stroke="#64748b" strokeWidth="3" />
          <line x1="202" y1="183" x2="218" y2="183" stroke="#64748b" strokeWidth="2" />
          <line x1="207" y1="188" x2="213" y2="188" stroke="#64748b" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Fault description */}
      <div className="rounded-2xl border-2 p-4 text-sm mb-4"
        style={{ borderColor: color, background: color + "10" }}>
        <div className="font-extrabold text-slate-800 mb-1">
          {t(`lessons.electricalCircuitBasics.faults.${fault}.title`)}
        </div>
        <div className="text-slate-700 mb-2">
          {t(`lessons.electricalCircuitBasics.faults.${fault}.desc`)}
        </div>
        <div className="rounded-xl bg-white border px-3 py-2 text-xs font-mono text-slate-600 border-slate-200">
          📊 Power Probe: {t(`lessons.electricalCircuitBasics.faults.${fault}.reading`)}
        </div>
      </div>

      <InfoBox>
        <strong>{t("lessons.diagTip")}:</strong> {t("lessons.electricalCircuitBasics.diagTipContent")}
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 3: Power Probe Testing ──────────────────────────────────────────
const PROBE_STEP_KEYS = [
  { step: 1, key: "step1", probeState: "ready",    probeColor: B_GREEN, testPoint: null       },
  { step: 2, key: "step2", probeState: "positive", probeColor: B_GREEN, testPoint: "battery"  },
  { step: 3, key: "step3", probeState: "positive", probeColor: B_GREEN, testPoint: "fuse"     },
  { step: 4, key: "step4", probeState: "positive", probeColor: B_GREEN, testPoint: "switch_in"},
  { step: 5, key: "step5", probeState: "fault",    probeColor: B_RED,   testPoint: "switch_out"},
  { step: 6, key: "step6", probeState: "ground",   probeColor: B_BLUE,  testPoint: "ground"   },
];

function PowerProbeSection() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = PROBE_STEP_KEYS[step];

  return (
    <SectionCard
      icon="🔌"
      title={t("lessons.electricalCircuitBasics.section3Title")}
      subtitle={t("lessons.electricalCircuitBasics.section3Subtitle")}
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {PROBE_STEP_KEYS.map((s, i) => (
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
          {t("lessons.step")} {step + 1} {t("lessons.of")} {PROBE_STEP_KEYS.length}
        </span>
      </div>

      {/* SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 460 220" className="w-full max-w-xl">
          {/* Wires */}
          <path d="M60,70 H170 H250 H360" stroke={B_BLUE} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M360,160 H220 H60" stroke={B_BLUE} strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="60"  y1="70"  x2="60"  y2="160" stroke={B_BLUE} strokeWidth="4" />
          <line x1="360" y1="70"  x2="360" y2="160"
            stroke={current.step === 5 ? B_RED : B_BLUE} strokeWidth="4" />

          {/* Battery */}
          <rect x="20" y="95" width="80" height="38" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <text x="60" y="112" textAnchor="middle" fontSize="12">🔋</text>
          <text x="60" y="125" textAnchor="middle" fontSize="9" fill="#64748b">12V BAT</text>
          <line x1="60" y1="95"  x2="60" y2="72"  stroke="red"     strokeWidth="2.5" strokeDasharray="4 3" />
          <line x1="60" y1="133" x2="60" y2="158" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="4 3" />

          {/* Fuse */}
          <rect x="150" y="55" width="60" height="28" rx="6"
            fill={current.testPoint === "fuse" ? B_SOFT : "#f8fafc"}
            stroke={current.testPoint === "fuse" ? B_BLUE : "#94a3b8"} strokeWidth="2" />
          <text x="180" y="70" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">⚡ Fuse</text>
          <text x="180" y="80" textAnchor="middle" fontSize="8" fill="#64748b">15A</text>

          {/* Switch */}
          <rect x="250" y="54" width="60" height="30" rx="6"
            fill={["switch_in","switch_out"].includes(current.testPoint) ? B_SOFT : "#f8fafc"}
            stroke={["switch_in","switch_out"].includes(current.testPoint) ? B_BLUE : "#94a3b8"} strokeWidth="2" />
          <text x="280" y="73" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">🔀 SW</text>

          {/* Lamp */}
          <circle cx="360" cy="115" r="22"
            fill={current.step === 5 ? "#f1f5f9" : current.testPoint === "battery" ? "#f1f5f9" : "#fef08a"}
            stroke="#f97316" strokeWidth="2.5" />
          <text x="360" y="111" textAnchor="middle" fontSize="13">💡</text>
          <text x="360" y="124" textAnchor="middle" fontSize="8" fill="#64748b">LAMP</text>

          {/* Ground */}
          <line x1="220" y1="160" x2="220" y2="178" stroke="#94a3b8" strokeWidth="3" />
          <line x1="207" y1="178" x2="233" y2="178" stroke="#64748b" strokeWidth="3" />
          <line x1="212" y1="183" x2="228" y2="183" stroke="#64748b" strokeWidth="2" />

          {/* Probe tip indicator */}
          {current.testPoint === "battery"    && <circle cx="60"  cy="72"  r="6" fill={current.probeColor} opacity="0.9" className="lamp-glow" />}
          {current.testPoint === "fuse"       && <circle cx="210" cy="69"  r="6" fill={current.probeColor} opacity="0.9" className="lamp-glow" />}
          {current.testPoint === "switch_in"  && <circle cx="250" cy="69"  r="6" fill={current.probeColor} opacity="0.9" className="lamp-glow" />}
          {current.testPoint === "switch_out" && <circle cx="310" cy="69"  r="6" fill={current.probeColor} opacity="0.9" className="lamp-glow" />}
          {current.testPoint === "ground"     && <circle cx="220" cy="178" r="6" fill={current.probeColor} opacity="0.9" className="lamp-glow" />}

          {/* Power Probe display */}
          <rect x="365" y="15" width="88" height="52" rx="8" fill="#1e293b" stroke={current.probeColor} strokeWidth="2.5" />
          <text x="409" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fill={current.probeColor}>POWER PROBE</text>
          {t(`lessons.electricalCircuitBasics.probe.${current.key}Label`).split("\n").map((line, i) => (
            <text key={i} x="409" y={43 + i * 11} textAnchor="middle" fontSize="9" fontWeight="700"
              fill={current.probeColor}>{line}</text>
          ))}
        </svg>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border-2 p-4 mb-4"
        style={{ borderColor: current.probeColor, background: current.probeColor + "10" }}>
        <div className="flex items-start gap-3">
          <span className="rounded-full text-white text-sm font-extrabold w-7 h-7 flex items-center justify-center flex-shrink-0"
            style={{ background: current.probeColor }}>
            {current.step}
          </span>
          <div>
            <div className="font-extrabold text-slate-800 mb-1">
              {t(`lessons.electricalCircuitBasics.probe.${current.key}Title`)}
            </div>
            <div className="text-sm text-slate-700">
              {t(`lessons.electricalCircuitBasics.probe.${current.key}Desc`)}
            </div>
          </div>
        </div>
      </div>

      <InfoBox color={current.probeState === "fault" ? "orange" : "blue"}>
        💡 <strong>{t("lessons.tipPrefix")}:</strong> {t(`lessons.electricalCircuitBasics.probe.${current.key}Tip`)}
      </InfoBox>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all">
          {t("lessons.previous")}
        </button>
        <button onClick={() => setStep((s) => Math.min(PROBE_STEP_KEYS.length - 1, s + 1))}
          disabled={step === PROBE_STEP_KEYS.length - 1}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white transition-all disabled:opacity-40"
          style={{ background: B_BLUE }}>
          {t("lessons.next")}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── SECTION 4: Final Quiz ────────────────────────────────────────────────────
const QUIZ_Q_KEYS = [
  {
    id: 1,
    qKey: "q1",
    options: [
      { id: "a", tKey: "q1a", correct: false },
      { id: "b", tKey: "q1b", correct: true  },
      { id: "c", tKey: "q1c", correct: false },
      { id: "d", tKey: "q1d", correct: false },
    ],
    expKey: "q1exp",
  },
  {
    id: 2,
    qKey: "q2",
    options: [
      { id: "a", tKey: "q2a", correct: false },
      { id: "b", tKey: "q2b", correct: true  },
      { id: "c", tKey: "q2c", correct: false },
      { id: "d", tKey: "q2d", correct: false },
    ],
    expKey: "q2exp",
  },
  {
    id: 3,
    qKey: "q3",
    options: [
      { id: "a", tKey: "q3a", correct: false },
      { id: "b", tKey: "q3b", correct: false },
      { id: "c", tKey: "q3c", correct: true  },
      { id: "d", tKey: "q3d", correct: false },
    ],
    expKey: "q3exp",
  },
];

function QuizSection({ onComplete }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const allDone = Object.keys(answers).length === QUIZ_Q_KEYS.length;
  const score   = QUIZ_Q_KEYS.filter((q) => {
    const sel = answers[q.id];
    return sel && q.options.find((o) => o.id === sel)?.correct;
  }).length;

  return (
    <SectionCard
      icon="📝"
      title={t("lessons.electricalCircuitBasics.section4Title")}
      subtitle={t("lessons.electricalCircuitBasics.section4Subtitle")}
    >
      <div className="space-y-6">
        {QUIZ_Q_KEYS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {t(`lessons.electricalCircuitBasics.quiz.${q.qKey}`)}
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
                      {t(`lessons.electricalCircuitBasics.quiz.${opt.tKey}`)}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>{t("lessons.explanation")}:</strong> {t(`lessons.electricalCircuitBasics.quiz.${q.expKey}`)}
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
          <div className="text-3xl mb-2">
            {score === 3 ? "🎉" : score >= 2 ? "👍" : "📚"}
          </div>
          <div className="text-xl font-extrabold text-slate-800 mb-1">
            {score} {t("lessons.outOf", { total: QUIZ_Q_KEYS.length })}
          </div>
          <div className="text-sm text-slate-600">
            {score === 3
              ? t("lessons.scoreExcellent")
              : score >= 2
              ? t("lessons.scoreGood")
              : t("lessons.scoreReview")}
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
export function ElectricalCircuitBasics() {
  const { t } = useTranslation();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;

  const markSection = (id) =>
    setCompletedSections((prev) => new Set([...prev, id]));

  const NAV_PILLS = [
    { id: "circuit", labelKey: "lessons.electricalCircuitBasics.navPills.circuit" },
    { id: "faults",  labelKey: "lessons.electricalCircuitBasics.navPills.faults"  },
    { id: "probe",   labelKey: "lessons.electricalCircuitBasics.navPills.probe"   },
    { id: "quiz",    labelKey: "lessons.electricalCircuitBasics.navPills.quiz"    },
  ];

  return (
    <div className="space-y-6">
      <StyleInjector />

      {/* Lesson header */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: B_BLUE }}>
              📖 {t("lessons.interactiveLesson")}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              {t("lessons.electricalCircuitBasics.title")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("lessons.electricalCircuitBasics.description")}
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

        {/* Section nav pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {NAV_PILLS.map((s) => (
            <a key={s.id} href={`#lesson-${s.id}`}
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

      {/* Completion banner */}
      {lessonDone && (
        <div className="lesson-section rounded-3xl border-2 p-5 text-center"
          style={{ borderColor: B_GREEN, background: "#f0fdf4" }}>
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-extrabold text-slate-800">{t("lessons.lessonComplete")}</div>
          <div className="text-sm text-slate-600 mt-1">
            {t("lessons.lessonCompleteBody", { title: t("lessons.electricalCircuitBasics.title") })}
          </div>
        </div>
      )}

      {/* Sections */}
      <div id="lesson-circuit">
        <CircuitSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("circuit")} disabled={completedSections.has("circuit")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("circuit") ? B_GREEN : B_BLUE,
              background:  completedSections.has("circuit") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("circuit") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("circuit")
              ? `✓ ${t("lessons.sectionComplete")}`
              : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="lesson-faults">
        <FaultsSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("faults")} disabled={completedSections.has("faults")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("faults") ? B_GREEN : B_BLUE,
              background:  completedSections.has("faults") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("faults") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("faults")
              ? `✓ ${t("lessons.sectionComplete")}`
              : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="lesson-probe">
        <PowerProbeSection />
        <div className="flex justify-end mt-2">
          <button onClick={() => markSection("probe")} disabled={completedSections.has("probe")}
            className="px-4 py-1.5 rounded-2xl text-xs font-extrabold border-2 transition-all disabled:opacity-50"
            style={{
              borderColor: completedSections.has("probe") ? B_GREEN : B_BLUE,
              background:  completedSections.has("probe") ? "#f0fdf4" : B_SOFT,
              color:       completedSections.has("probe") ? B_GREEN : B_BLUE,
            }}>
            {completedSections.has("probe")
              ? `✓ ${t("lessons.sectionComplete")}`
              : `✓ ${t("lessons.markComplete")}`}
          </button>
        </div>
      </div>

      <div id="lesson-quiz">
        <QuizSection
          onComplete={() => { markSection("quiz"); setLessonDone(true); }}
        />
      </div>
    </div>
  );
}
