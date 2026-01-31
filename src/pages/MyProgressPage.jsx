import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

// --- HELPERS (Sin cambios en lógica) ---
function clampPct(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

function safeCarPct(pct) {
  const p = clampPct(pct);
  return Math.min(92, Math.max(2, p)); // Ajustado para que el auto luzca mejor en los bordes
}

function getMomentum({ completionRate, quizScore }) {
  const c = clampPct(completionRate);
  const s = typeof quizScore === "number" ? quizScore : null;
  if (c >= 80 || (s !== null && s >= 85)) return "fast";
  if (c >= 40 || (s !== null && s >= 70)) return "steady";
  return "stalled";
}

function getMomentumCopy(momentum) {
  if (momentum === "fast") {
    return { badge: "¡A toda velocidad!", line: "¡Estás volando! Mantén el ritmo para terminar el módulo.", roadSec: 0.8, wheelSec: 0.2, bounceSec: 0.4, cloudSec: 10 };
  }
  if (momentum === "steady") {
    return { badge: "Ritmo Constante", line: "Progreso sólido. Una sesión más y estarás cerca de la meta.", roadSec: 2.0, wheelSec: 0.5, bounceSec: 0.8, cloudSec: 20 };
  }
  return { badge: "Calentando Motores", line: "Momento de arrancar. Intenta un repaso corto hoy mismo.", roadSec: 5, wheelSec: 1.2, bounceSec: 1.5, cloudSec: 40 };
}

// --- COMPONENTES VISUALES MEJORADOS ---

function CarIcon({ wheelSec, momentum }) {
  return (
    <svg width="100" height="50" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Degradado para un look de pintura metalizada */}
        <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sombra proyectada */}
      <ellipse cx="60" cy="55" rx="45" ry="5" fill="black" fillOpacity="0.1" />

      {/* Cuerpo del Auto (Estilo Deportivo Moderno) */}
      <g filter="url(#shadow)">
        <path d="M10 40C10 38 12 36 15 36H25L35 18C37 15 40 14 44 14H85C90 14 95 16 98 22L110 36H112C116 36 118 38 118 41V44H10V40Z" fill="url(#carBody)" />
        <path d="M44 17H82L92 33H35L44 17Z" fill="#1E293B" /> {/* Ventanas */}
        <rect x="95" y="24" width="12" height="6" rx="2" fill="#FDE047" fillOpacity="0.8" /> {/* Faro Delantero */}
        <rect x="8" y="38" width="6" height="4" rx="1" fill="#EF4444" /> {/* Luz Trasera */}
      </g>

      {/* Ruedas con Animación */}
      <g style={{ animation: `wheelSpin ${wheelSec}s linear infinite`, transformOrigin: '32px 45px' }}>
        <circle cx="32" cy="45" r="9" fill="#1F2937" />
        <circle cx="32" cy="45" r="5" fill="#94A3B8" />
        <rect x="31" y="38" width="2" height="14" fill="#E2E8F0" rx="1" />
        <rect x="25" y="44" width="14" height="2" fill="#E2E8F0" rx="1" />
      </g>
      
      <g style={{ animation: `wheelSpin ${wheelSec}s linear infinite`, transformOrigin: '92px 45px' }}>
        <circle cx="92" cy="45" r="9" fill="#1F2937" />
        <circle cx="92" cy="45" r="5" fill="#94A3B8" />
        <rect x="91" y="38" width="2" height="14" fill="#E2E8F0" rx="1" />
        <rect x="85" y="44" width="14" height="2" fill="#E2E8F0" rx="1" />
      </g>
    </svg>
  );
}

function TrackCar({ percent, momentum }) {
  const pct = clampPct(percent);
  const carPct = safeCarPct(pct);
  const { roadSec, wheelSec, bounceSec, cloudSec } = getMomentumCopy(momentum);

  return (
    <div className="mt-6">
      <style>{`
        @keyframes roadScroll { from { background-position: 0 0; } to { background-position: -120px 0; } }
        @keyframes wheelSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes carBounce { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-3px); } 
        }
        @keyframes cloudFloat { from { transform: translateX(500px); } to { transform: translateX(-200px); } }
      `}</style>

      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-sky-300 to-sky-100 border-b-4 border-green-500 shadow-inner" style={{ height: "140px" }}>
        
        {/* Nubes Decorativas */}
        <div className="absolute top-4 opacity-60" style={{ animation: `cloudFloat ${cloudSec}s linear infinite` }}>
            <div className="w-12 h-6 bg-white rounded-full shadow-sm relative">
                <div className="absolute -top-3 left-3 w-8 h-8 bg-white rounded-full"></div>
            </div>
        </div>

        {/* Carretera */}
        <div className="absolute bottom-0 w-full h-16 bg-slate-700 flex items-center">
            <div className="w-full h-1 bg-dashed opacity-30" 
                 style={{ 
                    backgroundImage: 'linear-gradient(90deg, #fff 50%, transparent 50%)', 
                    backgroundSize: '40px 100%',
                    animation: `roadScroll ${roadSec}s linear infinite`
                 }} 
            />
        </div>

        {/* Progreso Visual (Suelo pintado) */}
        <div className="absolute bottom-0 h-16 bg-blue-500/20 transition-all duration-1000 ease-out border-r-2 border-blue-400"
             style={{ width: `${pct}%` }} 
        />

        {/* El Vehículo */}
        <div 
          className="absolute z-10 transition-all duration-1000 ease-out"
          style={{ 
            left: `${carPct}%`, 
            bottom: "12px",
            animation: momentum !== "stalled" ? `carBounce ${bounceSec}s ease-in-out infinite` : 'none'
          }}
        >
          <CarIcon wheelSec={wheelSec} momentum={momentum} />
        </div>

        {/* Label de Porcentaje flotante */}
        <div className="absolute top-2 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-blue-600 shadow-sm border border-blue-100">
          {pct}% COMPLETADO
        </div>
      </div>
    </div>
  );
}

// --- RESTO DEL CÓDIGO (Lógica de Stats y Page se mantiene igual) ---

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

export function MyProgressPage() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await apiFetch("/api/progress");
        setProgress(data.progress || []);
      } catch (e) {
        setErr(e.message || "Failed to load progress");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const started = progress.length;
    const avg = started === 0 ? 0 : Math.round(progress.reduce((sum, p) => sum + (p.completion_rate || 0), 0) / started);
    const passed = progress.filter((p) => (p.quiz_score || 0) >= 70).length;
    return { started, avg, passed };
  }, [progress]);

  const rows = useMemo(() => {
    return (progress || []).map((p) => {
      const completion = clampPct(p.completion_rate || 0);
      const score = typeof p.quiz_score === "number" ? p.quiz_score : null;
      const momentum = getMomentum({ completionRate: completion, quizScore: score });
      const copy = getMomentumCopy(momentum);
      return {
        id: p.id,
        title: p.modules?.title || "Module",
        category: p.modules?.category || "",
        completion,
        score,
        momentum,
        momentumBadge: copy.badge,
        momentumLine: copy.line,
      };
    });
  }, [progress]);

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Cargando tu progreso...</div>;
  if (err) return <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">{err}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t("progress.title")}</h1>
        <p className="text-slate-500 mt-1">{t("progress.subtitle")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label={t("progress.modulesStarted")} value={stats.started} />
          <StatCard label={t("progress.avgCompletion")} value={`${stats.avg}%`} />
          <StatCard label={t("progress.passed")} value={stats.passed} />
        </div>
      </div>

      <div className="grid gap-4">
        {rows.map((r) => (
          <div key={r.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">{r.category}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{r.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                    <p className="text-sm font-bold text-blue-600">{r.momentumBadge}</p>
                 </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">{r.momentumLine}</p>
            
            <TrackCar percent={r.completion} momentum={r.momentum} />
          </div>
        ))}
      </div>
    </div>
  );
}