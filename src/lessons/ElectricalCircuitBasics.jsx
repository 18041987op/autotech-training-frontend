/**
 * ElectricalCircuitBasics — Interactive Lesson
 *
 * Sections:
 *   1. Basic Circuit — animated SVG, switch ON/OFF, clickable components
 *   2. Types of Faults — Open / Short / High Resistance toggle
 *   3. Testing with a Power Probe — step-by-step procedure
 *   4. Mini-Quiz — 3 diagnostic questions
 */
import React, { useEffect, useRef, useState } from "react";

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
const COMPONENTS = {
  battery: {
    label: "🔋 Batería (12V)",
    desc:  "La batería es la fuente de energía del circuito. Proporciona 12 voltios de corriente continua (DC). Sin batería no hay circuito.",
  },
  fuse: {
    label: "⚡ Fusible",
    desc:  "El fusible protege el circuito contra sobrecargas. Si la corriente supera el amperaje del fusible, el filamento se rompe y el circuito se abre — protegiendo los demás componentes.",
  },
  switch: {
    label: "🔀 Interruptor",
    desc:  "El interruptor controla el flujo de corriente. En posición ABIERTA, interrumpe el circuito (la lámpara se apaga). En posición CERRADA, completa el circuito (la lámpara enciende).",
  },
  lamp: {
    label: "💡 Lámpara",
    desc:  "La lámpara es la carga del circuito. Convierte energía eléctrica en luz y calor. Si la lámpara no enciende, puede ser la lámpara misma, o cualquier componente antes de ella.",
  },
  ground: {
    label: "⏚ Tierra (Ground)",
    desc:  "La tierra completa el circuito de regreso a la batería. Sin una buena conexión a tierra, el circuito no funciona aunque todos los demás componentes estén bien.",
  },
};

function CircuitSection() {
  const [switchOn, setSwitchOn]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);

  const circuitClosed = switchOn;
  const wireColor     = circuitClosed ? B_BLUE  : "#cbd5e1";
  const lampFill      = circuitClosed ? "#fef08a" : "#f1f5f9";
  const lampStroke    = circuitClosed ? B_ORANGE  : "#94a3b8";

  return (
    <SectionCard
      icon="⚡"
      title="Circuito Básico de Lámpara"
      subtitle="Haz clic en el interruptor para activar el circuito. Haz clic en cada componente para ver su descripción."
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
            <text x="180" y="60" textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">⚡ Fusible</text>
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
      {selected && COMPONENTS[selected] && (
        <div className="mb-4 rounded-2xl border-2 p-4 text-sm"
          style={{ borderColor: B_BLUE, background: B_SOFT }}>
          <div className="font-extrabold text-slate-800 mb-1">{COMPONENTS[selected].label}</div>
          <div className="text-slate-700">{COMPONENTS[selected].desc}</div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => setSelected(null)}>
            Cerrar ✕
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
          {switchOn ? "🔌 Interruptor: ON" : "⭕ Interruptor: OFF"}
        </button>
        <span className="text-sm text-slate-600">
          {switchOn ? "¡Circuito cerrado! La lámpara enciende." : "Circuito abierto. La lámpara apagada."}
        </span>
      </div>

      {/* Mini-quiz */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="font-extrabold text-slate-800 mb-3 text-sm">
          🤔 Pregunta rápida: ¿Qué pasa si el fusible se quema?
        </div>
        <div className="grid gap-2">
          {[
            { id: "a", text: "La lámpara enciende más brillante",             correct: false },
            { id: "b", text: "El circuito se abre y la lámpara no enciende",  correct: true  },
            { id: "c", text: "La batería se descarga más rápido",              correct: false },
            { id: "d", text: "Solo el interruptor deja de funcionar",          correct: false },
          ].map((opt) => {
            const chosen = quizAnswer === opt.id;
            let bg = "bg-white border-slate-200";
            let label = null;
            if (chosen) {
              bg    = opt.correct ? "border-brand-primary bg-blue-50" : "border-brand-accent bg-orange-50";
              label = opt.correct ? "✅ ¡Correcto!" : "❌ Incorrecto";
            }
            return (
              <button key={opt.id} onClick={() => setQuizAnswer(opt.id)}
                className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${bg}`}>
                <span className="mr-2 text-slate-500">{opt.id.toUpperCase()}.</span>
                {opt.text}
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
            <strong>Explicación:</strong> Cuando el fusible se quema, su filamento interno se rompe y crea una abertura en el circuito. Esto detiene el flujo de corriente por completo — la lámpara no recibe voltaje y se apaga.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── SECTION 2: Types of Faults ───────────────────────────────────────────────
const FAULTS = [
  {
    id: "normal",
    label: "✅ Normal",
    color: B_GREEN,
    wireColor: B_BLUE,
    lampOn: true,
    title: "Circuito Normal",
    desc: "Todos los componentes funcionan correctamente. El voltaje fluye desde la batería a través del fusible, interruptor y lámpara hasta tierra. La lámpara enciende.",
    reading: "12V en todos los puntos de prueba",
  },
  {
    id: "open",
    label: "🔴 Circuito Abierto",
    color: B_RED,
    wireColor: B_RED,
    lampOn: false,
    title: "Circuito Abierto (Open Circuit)",
    desc: "Una ruptura en el circuito impide el flujo de corriente. Puede ser un fusible quemado, un cable roto, un interruptor defectuoso o una mala conexión a tierra. La lámpara no enciende.",
    reading: "12V antes del punto abierto, 0V después",
  },
  {
    id: "short",
    label: "⚠️ Cortocircuito",
    color: B_ORANGE,
    wireColor: B_ORANGE,
    lampOn: false,
    title: "Cortocircuito (Short Circuit)",
    desc: "Un cable o componente crea un camino no deseado a tierra antes de llegar a la carga. Esto causa un flujo excesivo de corriente que quema el fusible. Es el tipo de falla más peligroso.",
    reading: "El fusible se quema inmediatamente, 0V en la lámpara",
  },
  {
    id: "resistance",
    label: "🟡 Alta Resistencia",
    color: "#eab308",
    wireColor: "#eab308",
    lampOn: true,
    dim: true,
    title: "Alta Resistencia",
    desc: "Una conexión oxidada, terminal corroída o cable dañado crea resistencia adicional. La lámpara enciende pero con menos brillo. Con el tiempo puede causar calentamiento y falla completa.",
    reading: "Caída de voltaje en el punto de alta resistencia (ej. 9V en lámpara en vez de 12V)",
  },
];

function FaultsSection() {
  const [fault, setFault] = useState("normal");
  const current = FAULTS.find((f) => f.id === fault);

  return (
    <SectionCard
      icon="🔧"
      title="Tipos de Fallas Eléctricas"
      subtitle="Selecciona cada tipo de falla para ver cómo afecta el circuito."
    >
      {/* Fault selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FAULTS.map((f) => (
          <button key={f.id} onClick={() => setFault(f.id)}
            className="px-4 py-2 rounded-2xl text-sm font-extrabold border-2 transition-all"
            style={{
              borderColor: fault === f.id ? f.color : "#e2e8f0",
              background:  fault === f.id ? f.color + "18" : "white",
              color:       fault === f.id ? f.color : "#64748b",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Fault SVG */}
      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 420 200" className="w-full max-w-lg">
          {current.id === "open" ? (
            <>
              <path d="M60,60 H230" stroke={current.wireColor} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M270,60 H340" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
              <line x1="238" y1="50" x2="248" y2="72" stroke={B_RED} strokeWidth="3" />
              <line x1="252" y1="50" x2="262" y2="72" stroke={B_RED} strokeWidth="3" />
              <text x="250" y="45" textAnchor="middle" fontSize="9" fill={B_RED} fontWeight="700">OPEN</text>
            </>
          ) : current.id === "short" ? (
            <>
              <path d="M60,60 H180" stroke={current.wireColor} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M180,60 L180,160" stroke={B_RED} strokeWidth="4" strokeDasharray="6 4" fill="none" />
              <text x="195" y="115" fontSize="9" fill={B_RED} fontWeight="700">SHORT!</text>
              <path d="M180,60 H340" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <path d="M60,60 H340" stroke={current.wireColor} strokeWidth="4"
              className={current.lampOn && !current.dim ? "electron-wire" : ""}
              fill="none" strokeLinecap="round" />
          )}
          <path d="M340,160 H60" stroke={current.id === "open" ? "#cbd5e1" : current.wireColor}
            strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="60"  y1="60"  x2="60"  y2="160" stroke={current.wireColor} strokeWidth="4" />
          <line x1="340" y1="60"  x2="340" y2="160"
            stroke={current.id === "open" ? "#cbd5e1" : current.wireColor} strokeWidth="4" />

          {/* Battery */}
          <rect x="20" y="90" width="80" height="38" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <text x="60" y="108" textAnchor="middle" fontSize="12">🔋</text>
          <text x="60" y="122" textAnchor="middle" fontSize="9" fill="#64748b">12V</text>

          {/* Fuse */}
          <rect x="150" y="45" width="60" height="28" rx="6"
            fill={current.id === "short" ? "#fee2e2" : "#f8fafc"}
            stroke={current.id === "short" ? B_RED : "#94a3b8"} strokeWidth="2" />
          <text x="180" y="60" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">
            {current.id === "short" ? "💥 FUSIBLE" : "⚡ Fusible"}
          </text>
          <text x="180" y="70" textAnchor="middle" fontSize="8" fill="#64748b">
            {current.id === "short" ? "QUEMADO" : "15A"}
          </text>

          {/* Switch */}
          <rect x="235" y="44" width="55" height="28" rx="6"
            fill={current.id === "open" ? "#fee2e2" : "#f0fdf4"}
            stroke={current.id === "open" ? B_RED : "#86efac"} strokeWidth="2" />
          <text x="262" y="62" textAnchor="middle" fontSize="9" fill="#334155" fontWeight="700">
            {current.id === "open" ? "🔴 OPEN" : "🟢 ON"}
          </text>

          {/* Lamp */}
          {current.lampOn && (
            <circle cx="340" cy="110" r="26" fill="#fef08a"
              opacity={current.dim ? 0.3 : 0.4}
              className={current.dim ? "" : "lamp-glow"} />
          )}
          <circle cx="340" cy="110" r="21"
            fill={current.lampOn ? (current.dim ? "#fef9c3" : "#fef08a") : "#f1f5f9"}
            stroke={current.lampOn ? B_ORANGE : "#94a3b8"} strokeWidth="2.5" />
          <text x="340" y="107" textAnchor="middle" fontSize="13">💡</text>
          <text x="340" y="119" textAnchor="middle" fontSize="8" fill="#64748b">
            {current.dim ? "TENUE" : current.lampOn ? "ON" : "OFF"}
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
        style={{ borderColor: current.color, background: current.color + "10" }}>
        <div className="font-extrabold text-slate-800 mb-1">{current.title}</div>
        <div className="text-slate-700 mb-2">{current.desc}</div>
        <div className="rounded-xl bg-white border px-3 py-2 text-xs font-mono text-slate-600 border-slate-200">
          📊 Power Probe: {current.reading}
        </div>
      </div>

      <InfoBox>
        <strong>Consejo de diagnóstico:</strong> Siempre empieza probando la fuente de poder (batería). Si la fuente está bien, prueba secuencialmente cada componente hacia la carga. El punto donde el voltaje desaparece es donde está la falla.
      </InfoBox>
    </SectionCard>
  );
}

// ─── SECTION 3: Power Probe Testing ──────────────────────────────────────────
const PROBE_STEPS = [
  {
    step: 1,
    title: "Conectar Power Probe a la batería",
    desc: "Conecta el cable ROJO del Power Probe al terminal POSITIVO (+) de la batería. Conecta el cable NEGRO al terminal NEGATIVO (−) o a tierra del chasis.",
    probeState: "ready",
    probeLabel: "POWER PROBE\nLISTO",
    probeColor: B_GREEN,
    testPoint: null,
    tip: "El Power Probe siempre necesita referencia directa de la batería para funcionar correctamente.",
  },
  {
    step: 2,
    title: "Probar la fuente: Terminal + de la batería",
    desc: "Toca con la punta del Power Probe el terminal positivo (+) de la batería. Debes ver 12V y la luz VERDE encender.",
    probeState: "positive",
    probeLabel: "12.6V\n✅ POSITIVO",
    probeColor: B_GREEN,
    testPoint: "battery",
    tip: "Si no ves 12V aquí, el problema es la batería. Cárgala o reemplázala.",
  },
  {
    step: 3,
    title: "Probar salida del fusible",
    desc: "Toca la salida del fusible (lado hacia la carga). Si el fusible está bueno, debes ver 12V. Si ves 0V, el fusible está quemado.",
    probeState: "positive",
    probeLabel: "12.6V\n✅ FUSIBLE OK",
    probeColor: B_GREEN,
    testPoint: "fuse",
    tip: "Puedes probar ambos lados del fusible. Si el lado de entrada tiene voltaje pero el de salida no, el fusible está quemado.",
  },
  {
    step: 4,
    title: "Probar entrada del interruptor",
    desc: "Toca el terminal de entrada del interruptor (el que viene del fusible). Debes ver 12V aquí independientemente de si el interruptor está abierto o cerrado.",
    probeState: "positive",
    probeLabel: "12.6V\n✅ VOLTAJE OK",
    probeColor: B_GREEN,
    testPoint: "switch_in",
    tip: "Si no hay voltaje en la entrada del interruptor, el problema está antes — revisa el fusible y los cables.",
  },
  {
    step: 5,
    title: "Probar salida del interruptor (ON)",
    desc: "Con el interruptor en posición ON, toca su terminal de salida. Si el interruptor funciona bien, debes ver 12V. Si ves 0V con el interruptor ON, el interruptor está defectuoso.",
    probeState: "fault",
    probeLabel: "0V\n❌ INTERRUPTOR\nDEFECTUOSO",
    probeColor: B_RED,
    testPoint: "switch_out",
    tip: "Este es el diagnóstico clave: 12V entrada + 0V salida con switch ON = switch malo. ¡Reemplaza el interruptor!",
  },
  {
    step: 6,
    title: "Verificar tierra de la lámpara",
    desc: "Toca la conexión a tierra de la lámpara con el Power Probe. Si el Power Probe muestra una señal de tierra, el ground está bien.",
    probeState: "ground",
    probeLabel: "GND\n✅ TIERRA OK",
    probeColor: B_BLUE,
    testPoint: "ground",
    tip: "Una mala tierra puede causar que la lámpara encienda tenuemente o no encienda en absoluto, aunque tenga voltaje en la entrada.",
  },
];

function PowerProbeSection() {
  const [step, setStep] = useState(0);
  const current = PROBE_STEPS[step];

  return (
    <SectionCard
      icon="🔌"
      title="Diagnóstico con Power Probe"
      subtitle="Procedimiento paso a paso para localizar fallas en el circuito."
    >
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {PROBE_STEPS.map((s, i) => (
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
          Paso {step + 1} de {PROBE_STEPS.length}
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
          <text x="180" y="70" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">⚡ Fusible</text>
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
          {current.probeLabel.split("\n").map((line, i) => (
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
            <div className="font-extrabold text-slate-800 mb-1">{current.title}</div>
            <div className="text-sm text-slate-700">{current.desc}</div>
          </div>
        </div>
      </div>

      <InfoBox color={current.probeState === "fault" ? "orange" : "blue"}>
        💡 <strong>Tip:</strong> {current.tip}
      </InfoBox>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold border-2 border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all">
          ← Anterior
        </button>
        <button onClick={() => setStep((s) => Math.min(PROBE_STEPS.length - 1, s + 1))}
          disabled={step === PROBE_STEPS.length - 1}
          className="px-5 py-2 rounded-2xl text-sm font-extrabold text-white transition-all disabled:opacity-40"
          style={{ background: B_BLUE }}>
          Siguiente →
        </button>
      </div>
    </SectionCard>
  );
}

// ─── SECTION 4: Final Quiz ────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 1,
    q: "¿Qué muestra el Power Probe cuando hay un circuito abierto en el lado de la carga?",
    options: [
      { id: "a", text: "12V con luz verde",                      correct: false },
      { id: "b", text: "0V — no hay voltaje en la carga",        correct: true  },
      { id: "c", text: "La batería se descarga rápido",          correct: false },
      { id: "d", text: "El fusible se quema inmediatamente",     correct: false },
    ],
    explanation: "En un circuito abierto, la corriente no puede fluir. El Power Probe no detectará voltaje en el lado de la carga (después del punto de ruptura). Antes del punto de ruptura seguirá mostrando 12V.",
  },
  {
    id: 2,
    q: "¿Dónde debes conectar el cable NEGRO (negativo) del Power Probe para obtener lecturas precisas?",
    options: [
      { id: "a", text: "A cualquier parte metálica del vehículo",                               correct: false },
      { id: "b", text: "Al terminal negativo de la batería o tierra del chasis comprobada",     correct: true  },
      { id: "c", text: "Al terminal positivo de la batería",                                    correct: false },
      { id: "d", text: "No importa — el Power Probe se calibra solo",                           correct: false },
    ],
    explanation: "La referencia de tierra debe ser sólida y directa. Una tierra mala dará lecturas incorrectas. Siempre usa el terminal negativo de la batería o un punto de tierra del chasis verificado.",
  },
  {
    id: 3,
    q: "Tienes 12V en la entrada del interruptor pero 0V en su salida con el interruptor en posición ON. ¿Cuál es el problema?",
    options: [
      { id: "a", text: "La lámpara está quemada",        correct: false },
      { id: "b", text: "El fusible está quemado",         correct: false },
      { id: "c", text: "El interruptor está defectuoso",  correct: true  },
      { id: "d", text: "La batería tiene baja carga",     correct: false },
    ],
    explanation: "12V en la entrada y 0V en la salida con el switch ON es el diagnóstico definitivo de un interruptor defectuoso. El componente que tiene voltaje en su entrada pero no lo pasa a su salida es el componente fallado.",
  },
];

function QuizSection({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const allDone = Object.keys(answers).length === QUIZ_QUESTIONS.length;
  const score   = QUIZ_QUESTIONS.filter((q) => {
    const sel = answers[q.id];
    return sel && q.options.find((o) => o.id === sel)?.correct;
  }).length;

  return (
    <SectionCard
      icon="📝"
      title="Examen Final"
      subtitle="3 preguntas de diagnóstico. Selecciona la mejor respuesta para cada pregunta."
    >
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-800 mb-3 text-sm">
                {q.id}. {q.q}
              </div>
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const iChosen = chosen === opt.id;
                  let bg = "bg-white border-slate-200 hover:border-blue-300";
                  let badge = null;
                  if (iChosen) {
                    bg    = opt.correct ? "border-brand-primary bg-blue-50" : "border-brand-accent bg-orange-50";
                    badge = opt.correct
                      ? <span className="ml-2 text-xs font-extrabold text-blue-700">✅ Correcto</span>
                      : <span className="ml-2 text-xs font-extrabold text-orange-700">❌ Incorrecto</span>;
                  } else if (chosen && opt.correct) {
                    bg = "border-blue-200 bg-blue-50/60";
                  }
                  return (
                    <button key={opt.id}
                      onClick={() => !chosen && setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                      disabled={!!chosen}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${bg} disabled:cursor-default`}>
                      <span className="mr-2 text-slate-500">{opt.id.toUpperCase()}.</span>
                      {opt.text}
                      {badge}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <div className="mt-3 text-xs text-slate-600 rounded-xl bg-white border border-slate-200 p-3">
                  <strong>Explicación:</strong> {q.explanation}
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
            {score} / {QUIZ_QUESTIONS.length} correctas
          </div>
          <div className="text-sm text-slate-600">
            {score === 3
              ? "¡Excelente! Dominaste los conceptos de diagnóstico eléctrico básico."
              : score >= 2
              ? "¡Buen trabajo! Repasa los conceptos que fallaste y vuelve a intentarlo."
              : "Repasa las secciones anteriores y vuelve a intentarlo. ¡Tú puedes!"}
          </div>
          {score < 3 && (
            <button onClick={() => setAnswers({})}
              className="mt-3 px-4 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_BLUE }}>
              Intentar de nuevo
            </button>
          )}
          {score === 3 && onComplete && (
            <button onClick={onComplete}
              className="mt-3 px-4 py-2 rounded-2xl text-sm font-extrabold text-white"
              style={{ background: B_GREEN }}>
              ✅ Marcar lección completada
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export function ElectricalCircuitBasics() {
  const [completedSections, setCompletedSections] = useState(new Set());
  const [lessonDone, setLessonDone]               = useState(false);

  const progress = (completedSections.size / 4) * 100;

  const markSection = (id) =>
    setCompletedSections((prev) => new Set([...prev, id]));

  return (
    <div className="space-y-6">
      <StyleInjector />

      {/* Lesson header */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: B_BLUE }}>
              📖 Lección Interactiva
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              Circuitos Eléctricos Básicos
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Aprende cómo funciona el circuito de una lámpara automotriz y cómo diagnosticar fallas con el Power Probe.
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-slate-500 mb-1">Progreso</div>
            <div className="w-32 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: B_BLUE }} />
            </div>
            <div className="text-xs font-extrabold mt-1" style={{ color: B_BLUE }}>
              {completedSections.size} / 4 secciones
            </div>
          </div>
        </div>

        {/* Section nav pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { id: "circuit", label: "⚡ Circuito Básico"   },
            { id: "faults",  label: "🔧 Tipos de Fallas"   },
            { id: "probe",   label: "🔌 Power Probe"        },
            { id: "quiz",    label: "📝 Examen Final"       },
          ].map((s) => (
            <a key={s.id} href={`#lesson-${s.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition-all"
              style={{
                borderColor: completedSections.has(s.id) ? B_GREEN : "#e2e8f0",
                background:  completedSections.has(s.id) ? "#f0fdf4" : "white",
                color:       completedSections.has(s.id) ? B_GREEN : "#64748b",
              }}>
              {completedSections.has(s.id) ? "✓ " : ""}{s.label}
            </a>
          ))}
        </div>
      </div>

      {/* Completion banner */}
      {lessonDone && (
        <div className="lesson-section rounded-3xl border-2 p-5 text-center"
          style={{ borderColor: B_GREEN, background: "#f0fdf4" }}>
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-extrabold text-slate-800">¡Lección Completada!</div>
          <div className="text-sm text-slate-600 mt-1">
            Completaste "Circuitos Eléctricos Básicos". ¡Continúa con el siguiente módulo!
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
            {completedSections.has("circuit") ? "✓ Sección completada" : "✓ Marcar como completada"}
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
            {completedSections.has("faults") ? "✓ Sección completada" : "✓ Marcar como completada"}
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
            {completedSections.has("probe") ? "✓ Sección completada" : "✓ Marcar como completada"}
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
