/**
 * KeyBoardPage — Smart Shop Key Board v3
 *
 * COLUMNS (5):
 *   🔴 Customer Waiting  — client in waiting room, highest priority
 *   🟠 Drop Off          — client dropped off, needs to be assigned
 *   🟡 In Progress       — repair active OR on hold (parts/approval)
 *   🟢 Ready for Pick Up — repair done, call customer
 *   ⚪ Shop / Employee   — internal vehicles
 *
 * 8 OVERRIDE RULES:
 *   R1 🔴 Customer Waiting = Highest Priority
 *   R2 🛋️ Waiting → First Free Tech (queue order)
 *   R3 🔁 Return Vehicle → Original Tech
 *   R4 ⏱️ Deadline Conflict → Warn + require override reason
 *   R5 🕐 Tech Absent/Unavailable → Skip in dispatch
 *   R6 ⚠️ Hours Overload → Warn when exceeding 8h
 *   R7 🔧 Skill Gap → Flag job, warn on mismatch
 *   R8 📝 Manual Override → Requires written reason, note shown on card
 *
 * Shared state persisted in Supabase. Polls every 15 s.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TECHS = [
  { key: "romel",     num: 1, name: "Romel",    color: "#7c3aed" },
  { key: "juan",      num: 2, name: "Juan",     color: "#1d4ed8" },
  { key: "eluzahin",  num: 3, name: "Eluzahin", color: "#0369a1" },
  { key: "kevin",     num: 4, name: "Kevin",    color: "#ea580c" },
  { key: "ivan",      num: 5, name: "Ivan",     color: "#475569" },
];

const COLS = [
  { id: "waiting", label: "Customer\nWaiting",   color: "#dc2626", darkColor: "#7f1d1d", needsDispatch: true  },
  { id: "dropoff", label: "Drop Off",             color: "#ea580c", darkColor: "#7c2d12", needsDispatch: true  },
  { id: "repair",  label: "In Progress",          color: "#eab308", darkColor: "#a16207", needsDispatch: true  },
  { id: "ready",   label: "Ready for\nPick Up",   color: "#16a34a", darkColor: "#14532d", needsDispatch: false },
  { id: "shop",    label: "Shop /\nEmployee Cars",color: "#475569", darkColor: "#1e293b", needsDispatch: false },
];

const MAX_HOURS = 8;

// Roles allowed to write to the board
const CAN_EDIT_ROLES = ["admin", "service_advisor", "service advisor", "sa", "serviceadvisor"];

// App native palette (matches training app light theme)
const APP = {
  bg:         "#f1f5f9",
  surface:    "#ffffff",
  border:     "#e2e8f0",
  text:       "#0f172a",
  textMed:    "#475569",
  textLight:  "#94a3b8",
  primary:    "#6366f1",
  primaryBg:  "#eef2ff",
  danger:     "#ef4444",
  dangerBg:   "#fee2e2",
  warn:       "#f59e0b",
  warnBg:     "#fef3c7",
  success:    "#22c55e",
  successBg:  "#dcfce7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function elapsedLabel(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function timerColor(ms, colId) {
  const h = ms / 3600000;
  if (colId === "shop")                   return { bg: "#dcfce7", text: "#166534" };
  if (colId === "waiting" && h > 0.5)     return { bg: "#fee2e2", text: "#991b1b" };
  if (colId === "ready"   && h > 2)       return { bg: "#fee2e2", text: "#991b1b" };
  if (h > 2.5)                            return { bg: "#fef9c3", text: "#854d0e" };
  return { bg: "#dcfce7", text: "#166534" };
}

function parseDeadline(str) {
  if (!str) return null;
  const m = str.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2] || "0", 10);
  const ampm = (m[3] || "").toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  const d = new Date(); d.setHours(h, min, 0, 0);
  return d;
}

function deadlineUrgency(str) {
  const d = parseDeadline(str);
  if (!d) return null;
  const diffMin = (d - Date.now()) / 60000;
  if (diffMin < 0)   return "overdue";
  if (diffMin <= 30) return "critical";
  if (diffMin <= 60) return "warning";
  return "ok";
}

const URGENCY_STYLE = {
  overdue:  { color: "#ef4444", bg: "#fee2e2", label: "🔴 OVERDUE"  },
  critical: { color: "#f97316", bg: "#ffedd5", label: "⚠️ < 30 MIN" },
  warning:  { color: "#d97706", bg: "#fef9c3", label: "⏰ < 1 HR"   },
  ok:       { color: "#16a34a", bg: "#dcfce7", label: "✅ On Track"  },
};

const URGENCY_RANK = { overdue: 4, critical: 3, warning: 2, ok: 1 };

// ─── DB mapping ───────────────────────────────────────────────────────────────

function toDbRow(card) {
  return {
    id:            card.id,
    col:           card.col,
    status:        card.status        || "repairing",
    name:          card.name          || "",
    vehicle:       card.vehicle       || "",
    ro:            card.ro            || "",
    hours:         card.hours         || 0,
    deadline:      card.deadline      || "",
    tech:          card.tech          || "",
    original_tech: card.originalTech  || "",
    added_at:      card.addedAt       || Date.now(),
    override_note: card.overrideNote  || "",
    skill:         card.skill         || "",
  };
}

function fromDbRow(row) {
  return {
    id:           row.id,
    col:          row.col,
    status:       row.status        || "repairing",
    name:         row.name          || "",
    vehicle:      row.vehicle       || "",
    ro:           row.ro            || "",
    hours:        row.hours         || 0,
    deadline:     row.deadline      || "",
    tech:         row.tech          || "",
    originalTech: row.original_tech || "",
    addedAt:      row.added_at      || Date.now(),
    overrideNote: row.override_note || "",
    skill:        row.skill         || "",
  };
}

// ─── Dispatch & Override Rules ─────────────────────────────────────────────────

function computeTechLoad(cards, unavailableTechs = new Set()) {
  const load = {};
  TECHS.forEach(t => {
    load[t.key] = {
      hours: 0, jobs: [], hasDeadline: false, worstUrgency: null,
      unavailable: unavailableTechs.has(t.key),
    };
  });
  cards
    .filter(c => c.tech && c.col !== "ready" && c.col !== "shop")
    .forEach(c => {
      if (!load[c.tech]) return;
      load[c.tech].hours += c.hours || 0;
      load[c.tech].jobs.push(c);
      if (c.deadline) {
        load[c.tech].hasDeadline = true;
        const u = deadlineUrgency(c.deadline);
        const prev = load[c.tech].worstUrgency;
        if (u && (!prev || URGENCY_RANK[u] > URGENCY_RANK[prev])) {
          load[c.tech].worstUrgency = u;
        }
      }
    });
  return load;
}

function buildTechResult(tech, l) {
  // Rule R5: Tech absent → skip entirely
  if (l.unavailable) return { tech, tag: "unavailable", tier: 99, hours: l.hours, available: 0, jobs: l.jobs, worstUrgency: null };

  const available = MAX_HOURS - l.hours;
  const u = l.worstUrgency;
  let tag, tier;

  if (l.jobs.length === 0)                        { tag = "free";       tier = 1; } // R2: free tech
  else if (u === "critical" || u === "overdue")   { tag = "finishing";  tier = 2; } // finishing soon
  else if (l.jobs.length === 1 && !l.hasDeadline) { tag = "busy";       tier = 3; }
  else if (u === "warning")                       { tag = "warning";    tier = 4; } // R4: deadline <1h
  else if (l.hasDeadline)                         { tag = "deadline";   tier = 4; }
  else if (l.jobs.length >= 2)                    { tag = "overloaded"; tier = 5; } // R6: overload
  else if (available <= 0)                        { tag = "full";       tier = 6; }
  else                                            { tag = "busy";       tier = 3; }

  return { tech, tag, tier, hours: l.hours, available: Math.max(0, available), jobs: l.jobs, worstUrgency: u };
}

function dispatchAnalysis(cards, { isWaiting = false, returningTechKey = null, unavailableTechs = new Set() } = {}) {
  const load = computeTechLoad(cards, unavailableTechs);

  // R3: Return vehicle → force original tech
  if (returningTechKey) {
    const tech = TECHS.find(t => t.key === returningTechKey);
    if (tech) {
      const result = { ...buildTechResult(tech, load[returningTechKey]), tag: "return", tier: 0 };
      const rest = TECHS
        .filter(t => t.key !== returningTechKey)
        .map(t => buildTechResult(t, load[t.key]))
        .sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : a.tech.num - b.tech.num);
      return [result, ...rest];
    }
  }

  return TECHS
    .map(tech => buildTechResult(tech, load[tech.key]))
    .sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : a.tech.num - b.tech.num);
}

function getRecommendationText(analysis, isWaiting) {
  // Filter out unavailable for best pick
  const eligible = analysis.filter(a => a.tag !== "unavailable");
  const best = eligible[0];
  if (!best) return { title: "⚠️ All Techs Unavailable", body: "No available technicians. Mark someone as available first.", accent: APP.danger };

  if (best.tag === "return")
    return { title: "🔁 R3: Return Vehicle", body: `Must go back to ${best.tech.name} who did the original work.`, accent: APP.warn };
  if (best.tier >= 6)
    return { title: "⚠️ All Technicians Full", body: "Consider asking the customer to drop off or come back later.", accent: APP.danger };
  if (best.tag === "finishing") {
    const lbl = best.worstUrgency === "overdue" ? "finishing up (deadline passed)" : "deadline in < 30 min";
    return isWaiting
      ? { title: "🛋️ R1+R2: Waiting — Finishing Up", body: `${best.tech.name} (#${best.tech.num}) is ${lbl}. Override if urgent.`, accent: "#f97316" }
      : { title: "⏰ Finishing Up — Next in Queue",   body: `${best.tech.name} (#${best.tech.num}) is ${lbl}. Assign next car.`, accent: "#f97316" };
  }
  if (isWaiting && best.tag === "free")
    return { title: "🛋️ R1+R2: Customer Waiting", body: `${best.tech.name} (#${best.tech.num}) is first free tech — no active jobs.`, accent: APP.warn };
  if (isWaiting)
    return { title: "🛋️ R1: Waiting — No Free Techs", body: `${best.tech.name} (#${best.tech.num}) has lightest load (${best.hours}h). Verify committed times.`, accent: APP.warn };
  if (best.tag === "free")
    return { title: "📋 R2: Next in Queue", body: `${best.tech.name} (#${best.tech.num}) is next and has no active jobs.`, accent: APP.success };
  if (best.tag === "warning")
    return { title: "⚠️ R4: Deadline Warning", body: `${best.tech.name} (#${best.tech.num}) has a deadline within the hour. Confirm capacity.`, accent: APP.warn };
  return { title: "📋 R2: Next in Queue", body: `${best.tech.name} (#${best.tech.num}) — ${best.hours}h assigned, ${best.available.toFixed(1)}h remaining.`, accent: APP.success };
}

/**
 * R4 + R6: Detect conflicts when assigning newCard to techKey.
 * Returns array of conflict objects.
 */
function detectConflicts(newCard, techKey, cards) {
  if (!techKey) return [];
  const tech = TECHS.find(t => t.key === techKey);
  if (!tech) return [];
  const techJobs = cards.filter(c =>
    c.tech === techKey && c.col !== "ready" && c.col !== "shop" && c.id !== newCard.id
  );
  const existingHours = techJobs.reduce((s, c) => s + (c.hours || 0), 0);
  const newHours = parseFloat(newCard.hours) || 0;
  const totalHours = existingHours + newHours;
  const conflicts = [];

  // R6: Hours overload
  if (totalHours > MAX_HOURS) {
    conflicts.push({
      rule: 6,
      severity: "danger",
      icon: "⚠️",
      message: `R6 Overload: ${tech.name} would be at ${totalHours.toFixed(1)}h total (limit ${MAX_HOURS}h). That's ${(totalHours - MAX_HOURS).toFixed(1)}h over capacity.`,
    });
  }

  // R4: Deadline conflict — new job pushes past an existing committed time
  techJobs.forEach(existing => {
    if (!existing.deadline) return;
    const dl = parseDeadline(existing.deadline);
    if (!dl) return;
    const hoursUntilDeadline = (dl - Date.now()) / 3600000;
    if (hoursUntilDeadline > 0 && totalHours > hoursUntilDeadline) {
      conflicts.push({
        rule: 4,
        severity: "danger",
        icon: "⏱️",
        message: `R4 Deadline: Adding ${newHours}h puts ${tech.name} at ${totalHours.toFixed(1)}h — but "${existing.name}'s" ${existing.deadline} deadline is only ${hoursUntilDeadline.toFixed(1)}h away.`,
        conflictingCard: existing,
      });
    }
  });

  // R7: Skill gap — if card has required skill and tech is not explicitly matched
  if (newCard.skill && newCard.skill.trim()) {
    conflicts.push({
      rule: 7,
      severity: "warning",
      icon: "🔧",
      message: `R7 Skill Check: This job requires "${newCard.skill}". Confirm ${tech.name} has this skill before assigning.`,
    });
  }

  return conflicts;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TechPanel({ cards, unavailableTechs, canEdit, onToggleUnavailable }) {
  const load = computeTechLoad(cards, unavailableTechs);
  const analysis = dispatchAnalysis(cards, { unavailableTechs });
  const suggestedKey = analysis.find(a => a.tag !== "unavailable")?.tech.key;

  return (
    <div style={{
      width: 210, flexShrink: 0, background: APP.surface,
      borderRight: `1px solid ${APP.border}`,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px", fontSize: "0.6rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1, color: APP.textLight,
        borderBottom: `1px solid ${APP.border}`, flexShrink: 0,
        background: APP.bg,
      }}>
        👷 Tech Queue & Load
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {TECHS.map(tech => {
          const l = load[tech.key];
          const result = buildTechResult(tech, l);
          const isOff = unavailableTechs.has(tech.key);
          const isSuggested = tech.key === suggestedKey && !isOff;
          const pct = Math.min(100, (l.hours / MAX_HOURS) * 100);
          const barColor = l.hours >= MAX_HOURS ? "#ef4444" : l.hours > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";

          // Pill style
          const pillStyle = isOff
            ? { bg: "#f1f5f9", text: "#94a3b8", label: "OFF" }
            : result.tag === "free"       ? { bg: "#dcfce7", text: "#166534", label: "FREE" }
            : result.tag === "finishing"  ? { bg: "#ffedd5", text: "#9a3412", label: "⏰ FINISHING" }
            : result.tag === "warning"    ? { bg: "#fef9c3", text: "#854d0e", label: "⚠️ DUE SOON" }
            : result.tag === "full"       ? { bg: APP.dangerBg, text: "#991b1b", label: "FULL" }
            : result.tag === "overloaded" ? { bg: APP.dangerBg, text: "#991b1b", label: "2+ JOBS" }
            :                               { bg: APP.primaryBg, text: APP.primary, label: "BUSY" };

          return (
            <div key={tech.key} style={{
              padding: "9px 10px",
              borderBottom: `1px solid ${APP.border}`,
              background: isOff ? APP.bg : isSuggested ? "#f0fdf4" : APP.surface,
              borderLeft: `3px solid ${isOff ? "#cbd5e1" : isSuggested ? "#22c55e" : "transparent"}`,
              opacity: isOff ? 0.6 : 1,
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: isOff ? "#cbd5e1" : tech.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: "0.78rem", color: "#fff", flexShrink: 0,
                }}>{tech.num}</div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: APP.text, flex: 1 }}>{tech.name}</span>
                <span style={{
                  fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: 20,
                  background: pillStyle.bg, color: pillStyle.text, textTransform: "uppercase",
                }}>{pillStyle.label}</span>
              </div>

              {!isOff && (
                <>
                  {/* Hours bar */}
                  <div style={{ fontSize: "0.55rem", color: APP.textLight, display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span>{l.hours}h / {MAX_HOURS}h</span>
                    <span>{Math.max(0, MAX_HOURS - l.hours).toFixed(1)}h free</span>
                  </div>
                  <div style={{ height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width 0.4s" }} />
                  </div>
                  {/* Job lines */}
                  {l.jobs.length === 0
                    ? <div style={{ fontSize: "0.58rem", color: APP.textLight }}>No active jobs</div>
                    : l.jobs.map((j, i) => {
                      const ju = deadlineUrgency(j.deadline);
                      const jus = ju ? URGENCY_STYLE[ju] : null;
                      return (
                        <div key={i} style={{ fontSize: "0.58rem", color: APP.textMed, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: jus ? jus.color : "#cbd5e1", flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {j.name} · {j.hours || "?"}h
                          </span>
                          {j.deadline && (
                            <span style={{ color: jus ? jus.color : APP.warn, fontWeight: 700, fontSize: "0.52rem", flexShrink: 0 }}>
                              ⏱️ {j.deadline}
                            </span>
                          )}
                        </div>
                      );
                    })
                  }
                  {/* Status banners */}
                  {result.tag === "finishing" && (
                    <div style={{ marginTop: 4, padding: "2px 6px", borderRadius: 4, background: "#ffedd5", fontSize: "0.55rem", fontWeight: 700, color: "#9a3412" }}>
                      {result.worstUrgency === "overdue" ? "🔴 DEADLINE PASSED — wrapping up?" : "⏰ FINISHING UP — ready soon"}
                    </div>
                  )}
                  {result.tag === "warning" && (
                    <div style={{ marginTop: 4, padding: "2px 6px", borderRadius: 4, background: "#fef9c3", fontSize: "0.55rem", fontWeight: 700, color: "#854d0e" }}>
                      ⚠️ Deadline within 1 hour
                    </div>
                  )}
                  {isSuggested && (
                    <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
                      {result.tag === "finishing" ? "▶ ASSIGN NEXT" : "▶ NEXT UP"}
                    </div>
                  )}
                </>
              )}

              {/* R5: Toggle unavailable — SA/admin only */}
              {canEdit && (
                <button
                  onClick={() => onToggleUnavailable(tech.key)}
                  title={isOff ? "Mark as available" : "Mark as unavailable (R5)"}
                  style={{
                    marginTop: 5, width: "100%", padding: "3px 0",
                    border: `1px solid ${isOff ? "#22c55e" : "#e2e8f0"}`,
                    borderRadius: 5, cursor: "pointer",
                    background: isOff ? "#dcfce7" : APP.bg,
                    color: isOff ? "#166534" : APP.textLight,
                    fontSize: "0.55rem", fontWeight: 700,
                  }}
                >
                  {isOff ? "✓ Marcar disponible" : "🕐 Marcar ausente"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Override Rules Legend */}
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${APP.border}`, flexShrink: 0, background: APP.bg }}>
        <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: APP.textLight, marginBottom: 4 }}>
          Override Rules
        </div>
        <div style={{ fontSize: "0.58rem", color: APP.textMed, lineHeight: 1.8 }}>
          R1 🔴 Waiting = highest priority<br />
          R2 🛋️ Waiting → first free tech<br />
          R3 🔁 Return → original tech<br />
          R4 ⏱️ Deadline conflict → warn<br />
          R5 🕐 Absent → skip tech<br />
          R6 ⚠️ Over 8h → overload warn<br />
          R7 🔧 Skill gap → confirm<br />
          R8 📝 Override → write reason
        </div>
      </div>
    </div>
  );
}

// ─── Key Card ─────────────────────────────────────────────────────────────────

function KeyCard({ card, col, canEdit, onEdit, onDelete, onQuickAction }) {
  const [confirmAction, setConfirmAction] = useState(null); // "done" | "hold" | "resume"
  const tech = TECHS.find(t => t.key === card.tech);
  const ms = Date.now() - card.addedAt;
  const tc = timerColor(ms, col.id);
  const isUrgent = col.id === "waiting";
  const isOnHold = card.col === "repair" && card.status === "onhold";

  function handleAction(action) {
    if (!canEdit) {
      // Non-SA/admin: require confirmation
      setConfirmAction(action);
    } else {
      onQuickAction(card.id, action);
    }
  }

  return (
    <div
      onClick={() => canEdit && !confirmAction && onEdit(card)}
      style={{
        background: isOnHold ? "#fefce8" : "#ffffff",
        borderRadius: 9, padding: "7px 8px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        position: "relative", userSelect: "none",
        borderLeft: `3px solid ${isOnHold ? "#ca8a04" : tech ? tech.color : isUrgent ? "#dc2626" : "#e2e8f0"}`,
        cursor: canEdit ? "pointer" : "default",
        transition: "transform 0.12s, box-shadow 0.12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)"; }}
    >
      {/* Confirmation overlay for non-SA users */}
      {confirmAction && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(255,255,255,0.95)",
          borderRadius: 9, zIndex: 10, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 8, gap: 6,
        }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: APP.text, textAlign: "center", lineHeight: 1.4 }}>
            ⚠️ No tienes rol SA/Admin.<br />¿Confirmar acción?
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => setConfirmAction(null)}
              style={{ fontSize: "0.6rem", padding: "3px 8px", border: `1px solid ${APP.border}`, borderRadius: 5, cursor: "pointer", background: "#fff", color: APP.textMed }}>
              Cancelar
            </button>
            <button onClick={() => { onQuickAction(card.id, confirmAction); setConfirmAction(null); }}
              style={{ fontSize: "0.6rem", padding: "3px 8px", border: "none", borderRadius: 5, cursor: "pointer", background: APP.primary, color: "#fff", fontWeight: 700 }}>
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Name + key icon */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: "0.95rem" }}>🔑</span>
        <span style={{ fontWeight: 800, fontSize: "0.78rem", color: APP.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {card.name}
        </span>
      </div>

      {/* Vehicle */}
      <div style={{ fontSize: "0.65rem", color: APP.textMed, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {card.vehicle}
      </div>

      {/* Hours */}
      {card.hours > 0 && (
        <div style={{ fontSize: "0.6rem", color: APP.primary, fontWeight: 700, marginTop: 2 }}>
          ⏳ {card.hours}h est.
        </div>
      )}

      {/* Deadline with urgency */}
      {card.deadline && (() => {
        const u = deadlineUrgency(card.deadline);
        const us = u ? URGENCY_STYLE[u] : null;
        return (
          <div style={{
            fontSize: "0.6rem", fontWeight: 700, marginTop: 2,
            color: us ? us.color : APP.warn,
            ...(u === "overdue" || u === "critical"
              ? { background: us.bg, padding: "1px 5px", borderRadius: 4, display: "inline-block" }
              : {}),
          }}>
            ⏱️ {card.deadline}{u === "overdue" ? " — OVERDUE" : u === "critical" ? " — SOON" : ""}
          </div>
        );
      })()}

      {/* Skill badge */}
      {card.skill && (
        <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "1px 5px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>
          🔧 {card.skill}
        </div>
      )}

      {/* Tech badge or unassigned warning */}
      {tech ? (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4,
          padding: "2px 7px", borderRadius: 20, fontSize: "0.62rem", fontWeight: 700,
          color: "#fff", background: tech.color,
        }}>#{tech.num} {tech.name}</span>
      ) : col.needsDispatch ? (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4,
          fontSize: "0.62rem", fontWeight: 700, color: "#b45309",
          background: "#fef3c7", padding: "2px 7px", borderRadius: 20,
        }}>⚠️ Assign tech</span>
      ) : null}

      {/* On-hold indicator */}
      {isOnHold && (
        <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#92400e", background: "#fde68a", padding: "1px 6px", borderRadius: 4, display: "inline-block", marginTop: 3 }}>
          ⏸ Waiting for parts / approval
        </div>
      )}

      {/* Override note (R8) */}
      {card.overrideNote && (
        <div style={{ fontSize: "0.55rem", color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", padding: "3px 6px", borderRadius: 4, marginTop: 4, lineHeight: 1.4 }}>
          📝 Override: {card.overrideNote}
        </div>
      )}

      {/* Footer: RO + elapsed */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: "0.58rem", color: APP.textLight, fontWeight: 600 }}>
          {card.ro ? `RO #${card.ro}` : ""}
        </span>
        <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: tc.bg, color: tc.text }}
          title="Time on board">
          🕐 {elapsedLabel(ms)}
        </span>
      </div>

      {/* Quick action buttons (In Progress column) — visible to ALL */}
      {card.col === "repair" && (
        <div style={{ display: "flex", gap: 4, marginTop: 5 }} onClick={e => e.stopPropagation()}>
          {isOnHold ? (
            <button onClick={() => handleAction("resume")} style={{ flex: 1, fontSize: "0.58rem", fontWeight: 700, padding: "3px 0", borderRadius: 5, border: "none", cursor: "pointer", background: APP.successBg, color: "#166534" }}>
              ▶ Resume
            </button>
          ) : (
            <button onClick={() => handleAction("hold")} style={{ flex: 1, fontSize: "0.58rem", fontWeight: 700, padding: "3px 0", borderRadius: 5, border: "none", cursor: "pointer", background: "#fef9c3", color: "#854d0e" }}>
              ⏸ On Hold
            </button>
          )}
          <button onClick={() => handleAction("done")} style={{ flex: 1, fontSize: "0.58rem", fontWeight: 700, padding: "3px 0", borderRadius: 5, border: "none", cursor: "pointer", background: "#bbf7d0", color: "#14532d" }}>
            ✅ Done
          </button>
        </div>
      )}

      {/* Delete */}
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(card.id); }}
          style={{ position: "absolute", top: 4, right: 5, background: "none", border: "none", color: "#cbd5e0", fontSize: "0.68rem", cursor: "pointer", padding: "2px 3px", borderRadius: 3 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e0")}
        >✕</button>
      )}
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({ col, cards, canEdit, onAddClick, onEditCard, onDeleteCard, onQuickAction }) {
  const colCards = cards.filter(c => c.col === col.id);

  return (
    <div style={{
      borderRadius: 14, padding: "8px 7px",
      background: `linear-gradient(160deg, ${col.color}, ${col.darkColor})`,
      display: "flex", flexDirection: "column", minHeight: 0,
    }}>
      <div style={{ textAlign: "center", marginBottom: 6, flexShrink: 0 }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: 0.4, textShadow: "0 1px 3px rgba(0,0,0,0.4)", lineHeight: 1.3 }}>
          {col.label.split("\n").map((line, i) => (
            <span key={i}>{line}{i === 0 && col.label.includes("\n") ? <br /> : null}</span>
          ))}
        </div>
        <span style={{ display: "inline-block", marginTop: 3, background: "rgba(0,0,0,0.25)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "0 7px", borderRadius: 20 }}>
          {colCards.length}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, minHeight: 0, paddingBottom: 4 }}>
        {colCards.map(card => (
          <KeyCard
            key={card.id}
            card={card}
            col={col}
            canEdit={canEdit}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onQuickAction={onQuickAction}
          />
        ))}
      </div>
      {canEdit && (
        <button
          onClick={() => onAddClick(col.id)}
          style={{ marginTop: 5, flexShrink: 0, background: "rgba(255,255,255,0.15)", border: "1.5px dashed rgba(255,255,255,0.5)", borderRadius: 8, color: "rgba(255,255,255,0.9)", fontSize: "0.72rem", fontWeight: 700, padding: 5, cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        >+ Add</button>
      )}
    </div>
  );
}

// ─── Card Modal ───────────────────────────────────────────────────────────────

function CardModal({ colId, card, cards, onSave, onClose, unavailableTechs }) {
  const col = COLS.find(c => c.id === colId);
  const isWaiting = colId === "waiting";
  const returningTechKey = card?.originalTech || null;

  const analysis = dispatchAnalysis(cards, { isWaiting, returningTechKey, unavailableTechs });
  const eligible = analysis.filter(a => a.tag !== "unavailable");
  const suggestedKey = eligible[0]?.tech.key;
  const rec = getRecommendationText(analysis, isWaiting);

  const [name,         setName]         = useState(card?.name      || "");
  const [vehicle,      setVehicle]      = useState(card?.vehicle   || "");
  const [ro,           setRo]           = useState(card?.ro        || "");
  const [hours,        setHours]        = useState(card?.hours     || "");
  const [deadline,     setDeadline]     = useState(card?.deadline  || "");
  const [skill,        setSkill]        = useState(card?.skill     || "");
  const [selTech,      setSelTech]      = useState(card?.tech || (col.needsDispatch ? suggestedKey : "") || "");
  const [overrideNote, setOverrideNote] = useState("");
  const [errors,       setErrors]       = useState({});

  // Detect conflicts whenever relevant fields change
  const conflicts = col.needsDispatch && selTech
    ? detectConflicts({ ...card, hours: parseFloat(hours) || 0, skill, id: card?.id || "__new__" }, selTech, cards)
    : [];
  const hasConflict = conflicts.length > 0;
  const requiresNote = hasConflict; // R8: override needs reason

  function handleSave() {
    const errs = {};
    if (!name.trim())    errs.name    = true;
    if (!vehicle.trim()) errs.vehicle = true;
    if (requiresNote && !overrideNote.trim()) errs.overrideNote = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSave({
      ...(card || {}),
      id:           card?.id || uid(),
      col:          colId,
      status:       card?.status || "repairing",
      name:         name.trim(),
      vehicle:      vehicle.trim(),
      ro:           ro.trim(),
      hours:        parseFloat(hours) || 0,
      deadline:     deadline.trim(),
      skill:        skill.trim(),
      tech:         col.needsDispatch ? selTech : (card?.tech || ""),
      addedAt:      card?.addedAt || Date.now(),
      originalTech: card?.originalTech || (col.needsDispatch ? selTech : ""),
      overrideNote: overrideNote.trim(),
    });
  }

  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: 8, padding: "7px 10px", fontSize: "0.82rem", color: APP.text,
    outline: "none", boxSizing: "border-box",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 22, width: 440, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 70px rgba(0,0,0,0.3)", color: APP.text }}>

        <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 2 }}>{card ? "Edit Vehicle" : "Add Vehicle"}</div>
        <div style={{ fontSize: "0.72rem", color: APP.textMed, marginBottom: 14 }}>{col.label.replace("\n", " ")}</div>

        {/* Name */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "0 0 3px" }}>Customer Last Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Martinez"
          style={inp(errors.name)} maxLength={20} onKeyDown={e => e.key === "Enter" && handleSave()} />

        {/* Vehicle */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "9px 0 3px" }}>Vehicle *</label>
        <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. 2019 Honda Civic"
          style={inp(errors.vehicle)} maxLength={30} onKeyDown={e => e.key === "Enter" && handleSave()} />

        {/* RO + Hours */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "9px 0 3px" }}>RO #</label>
            <input value={ro} onChange={e => setRo(e.target.value)} placeholder="4821" style={inp(false)} maxLength={10} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "9px 0 3px" }}>Est. Hours</label>
            <input value={hours} onChange={e => setHours(e.target.value)} placeholder="2.5" type="number" min={0.5} max={12} step={0.5} style={inp(false)} />
          </div>
        </div>

        {/* Deadline */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "9px 0 3px" }}>
          Committed Time / Deadline
        </label>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder='e.g. "9 AM" or "3:30 PM"' style={inp(false)} />

        {/* Skill (R7) */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "9px 0 3px" }}>
          Required Skill (leave blank if none) — R7
        </label>
        <input value={skill} onChange={e => setSkill(e.target.value)} placeholder='e.g. "alignment", "transmission"' style={inp(false)} maxLength={30} />

        {/* Dispatch section */}
        {col.needsDispatch && (
          <>
            <hr style={{ border: "none", borderTop: `1px solid ${APP.border}`, margin: "12px 0" }} />

            {/* Recommendation */}
            <div style={{ padding: "10px 14px", borderRadius: 10, border: `2px solid ${rec.accent}30`, background: `${rec.accent}0f`, marginBottom: 10 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: rec.accent, marginBottom: 3 }}>{rec.title}</div>
              <div style={{ fontSize: "0.72rem", color: APP.textMed, lineHeight: 1.5 }}>{rec.body}</div>
            </div>

            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: APP.textMed, margin: "0 0 6px" }}>Select Technician</label>

            {/* Tech rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {analysis.map(({ tech, tag, tier, hours: tHours, available, jobs }) => {
                const isUnavail  = tag === "unavailable";
                const isSuggested = tech.key === suggestedKey;
                const isSelected  = tech.key === selTech;
                const pct = Math.min(100, (tHours / MAX_HOURS) * 100);
                const barColor = tHours >= MAX_HOURS ? "#ef4444" : tHours > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";

                const tagBg = isUnavail ? APP.bg
                  : tag === "full" || tag === "overloaded" ? APP.dangerBg
                  : tag === "finishing" ? "#ffedd5"
                  : tag === "warning"   ? "#fef9c3"
                  : isSuggested ? APP.successBg : APP.primaryBg;
                const tagText = isUnavail ? APP.textLight
                  : tag === "full" || tag === "overloaded" ? "#991b1b"
                  : tag === "finishing" ? "#9a3412"
                  : tag === "warning"   ? "#854d0e"
                  : isSuggested ? "#166534" : APP.primary;
                const tagLabel = isUnavail ? "OFF"
                  : isSuggested ? "✓ Best match"
                  : tag === "free"       ? "Free"
                  : tag === "finishing"  ? "⏰ Finishing"
                  : tag === "warning"    ? "⚠️ Due soon"
                  : tag === "full"       ? "Full"
                  : tag === "overloaded" ? "2+ jobs"
                  : tag === "deadline"   ? "Has deadline"
                  : tag === "busy"       ? `${jobs.length} job`
                  : "Available";

                const jobSummary = jobs.length > 0
                  ? jobs.map(j => `${j.name}${j.hours ? ` (${j.hours}h)` : ""}${j.deadline ? ` ⏱️${j.deadline}` : ""}`).join(", ")
                  : isUnavail ? "Marked as absent (R5)" : "No active jobs";

                return (
                  <div key={tech.key}
                    onClick={() => !isUnavail && setSelTech(tech.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8,
                      border: `1.5px solid ${isSelected ? (isSuggested ? "#22c55e" : APP.primary) : isSuggested ? "#86efac" : APP.border}`,
                      background: isSelected ? (isSuggested ? "#f0fdf4" : APP.primaryBg) : isSuggested ? "#f0fdf4" : "#fff",
                      cursor: isUnavail ? "not-allowed" : "pointer",
                      opacity: isUnavail || tier >= 6 ? 0.5 : 1,
                      transition: "border 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: isUnavail ? "#cbd5e1" : tech.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.75rem", color: "#fff", flexShrink: 0 }}>
                      {tech.num}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: APP.text }}>{tech.name}</span>
                        <span style={{ fontSize: "0.6rem", color: APP.textLight, fontWeight: 600 }}>
                          {tHours > 0 ? `${tHours}h / ${MAX_HOURS}h` : "0h — free"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: APP.textMed, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {jobSummary}
                      </div>
                      <div style={{ height: 3, background: "#e2e8f0", borderRadius: 3, marginTop: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: tagBg, color: tagText, flexShrink: 0, whiteSpace: "nowrap" }}>
                      {tagLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Conflict warnings (R4, R6, R7) */}
            {conflicts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {conflicts.map((c, i) => (
                  <div key={i} style={{
                    padding: "8px 12px", borderRadius: 8, marginBottom: 6,
                    background: c.severity === "danger" ? APP.dangerBg : APP.warnBg,
                    border: `1px solid ${c.severity === "danger" ? "#fca5a5" : "#fde68a"}`,
                    fontSize: "0.72rem", color: c.severity === "danger" ? "#7f1d1d" : "#78350f",
                    lineHeight: 1.5,
                  }}>
                    {c.icon} {c.message}
                  </div>
                ))}
              </div>
            )}

            {/* R8: Override reason (required when conflicts exist) */}
            {requiresNote && (
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>
                  📝 R8: Override Reason * (required — will appear on the card)
                </label>
                <textarea
                  value={overrideNote}
                  onChange={e => setOverrideNote(e.target.value)}
                  placeholder="Explain why you are overriding the dispatch rule..."
                  rows={2}
                  style={{
                    width: "100%", border: `1.5px solid ${errors.overrideNote ? "#ef4444" : "#fbbf24"}`,
                    borderRadius: 8, padding: "7px 10px", fontSize: "0.78rem", color: APP.text,
                    outline: "none", boxSizing: "border-box", resize: "vertical",
                    background: "#fffbeb",
                  }}
                />
                {errors.overrideNote && (
                  <div style={{ fontSize: "0.65rem", color: "#dc2626", marginTop: 2 }}>Required when overriding dispatch rules.</div>
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 9, border: `1.5px solid ${APP.border}`, borderRadius: 8, background: "#fff", color: APP.textMed, fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            flex: 2, padding: 9, border: "none", borderRadius: 8,
            background: hasConflict ? APP.warn : APP.primary,
            color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.82rem",
          }}>
            {hasConflict ? "⚠️ Override & Save" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function KeyBoardPage() {
  const { user } = useOutletContext() || {};
  const rawRole = (user?.role || "").toLowerCase();
  const canEdit = CAN_EDIT_ROLES.includes(rawRole) ||
                  CAN_EDIT_ROLES.includes(rawRole.replace(/[\s_]/g, "")) ||
                  rawRole === "admin";

  const [cards,            setCards]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [syncErr,          setSyncErr]          = useState(null);
  const [modal,            setModal]            = useState(null);
  const [clock,            setClock]            = useState("");
  const [unavailableTechs, setUnavailableTechs] = useState(new Set());
  const pollRef = useRef(null);

  // ── Fetch cards from API ──────────────────────────────────────────────────
  const fetchCards = useCallback(async () => {
    try {
      const data = await apiFetch("/api/keyboard/cards");
      setCards((data || []).map(fromDbRow));
      setSyncErr(null);
    } catch (e) {
      setSyncErr("Sync error — " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch tech unavailability config ─────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiFetch("/api/keyboard/config/tech_status");
      const unavail = new Set(data?.unavailable || []);
      setUnavailableTechs(unavail);
    } catch { /* ignore */ }
  }, []);

  // ── Initial load + polling (15 s) ─────────────────────────────────────────
  useEffect(() => {
    fetchCards();
    fetchConfig();
    pollRef.current = setInterval(() => { fetchCards(); fetchConfig(); }, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchCards, fetchConfig]);

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    function update() {
      const n = new Date();
      setClock(
        n.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
        "  " +
        n.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Toggle tech unavailable (R5) ──────────────────────────────────────────
  const handleToggleUnavailable = useCallback(async (techKey) => {
    if (!canEdit) return;
    setUnavailableTechs(prev => {
      const next = new Set(prev);
      if (next.has(techKey)) next.delete(techKey); else next.add(techKey);
      const value = { unavailable: [...next] };
      apiFetch("/api/keyboard/config/tech_status", { method: "PUT", body: value }).catch(() => {});
      return next;
    });
  }, [canEdit]);

  // ── Save card (create or update) ─────────────────────────────────────────
  const handleSaveCard = useCallback(async (cardData) => {
    const exists = cards.find(c => c.id === cardData.id);
    setCards(prev => exists
      ? prev.map(c => c.id === cardData.id ? cardData : c)
      : [...prev, cardData]
    );
    setModal(null);
    try {
      if (exists) {
        await apiFetch(`/api/keyboard/cards/${cardData.id}`, { method: "PATCH", body: toDbRow(cardData) });
      } else {
        await apiFetch("/api/keyboard/cards", { method: "POST", body: toDbRow(cardData) });
      }
    } catch (e) {
      setSyncErr("Save failed — " + e.message);
      fetchCards();
    }
  }, [cards, fetchCards]);

  // ── Delete card ──────────────────────────────────────────────────────────
  const handleDeleteCard = useCallback(async (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    try {
      await apiFetch(`/api/keyboard/cards/${id}`, { method: "DELETE" });
    } catch (e) {
      setSyncErr("Delete failed — " + e.message);
      fetchCards();
    }
  }, [fetchCards]);

  // ── Quick actions: done / hold / resume ───────────────────────────────────
  const handleQuickAction = useCallback(async (id, action) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const patch = action === "done"   ? { col: "ready", status: "repairing" }
                : action === "hold"   ? { status: "onhold" }
                : action === "resume" ? { status: "repairing" }
                : null;
    if (!patch) return;
    const updated = { ...card, ...patch };
    setCards(prev => prev.map(c => c.id === id ? updated : c));
    try {
      await apiFetch(`/api/keyboard/cards/${id}`, { method: "PATCH", body: patch });
    } catch (e) {
      setSyncErr("Action failed — " + e.message);
      fetchCards();
    }
  }, [cards, fetchCards]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 0px)", background: APP.bg,
      margin: "-16px", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 16px", background: APP.surface,
        borderBottom: `1px solid ${APP.border}`, flexShrink: 0, gap: 10,
      }}>
        <h1 style={{ color: APP.text, fontSize: "1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          🔑 <span>Key Board</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {syncErr && (
            <span style={{ fontSize: "0.6rem", color: "#dc2626", background: APP.dangerBg, border: `1px solid #fca5a5`, padding: "2px 8px", borderRadius: 20 }}>
              ⚠️ {syncErr}
            </span>
          )}
          {loading && <span style={{ fontSize: "0.6rem", color: APP.textLight }}>Loading…</span>}
          {!canEdit && (
            <span style={{ fontSize: "0.65rem", color: APP.textLight, background: APP.bg, border: `1px solid ${APP.border}`, padding: "2px 8px", borderRadius: 20 }}>
              👁 View only
            </span>
          )}
          <span style={{ color: APP.textMed, fontSize: "0.78rem", fontWeight: 600 }}>{clock}</span>
        </div>
      </div>

      {/* Workspace */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
        {/* Tech Panel */}
        <TechPanel
          cards={cards}
          unavailableTechs={unavailableTechs}
          canEdit={canEdit}
          onToggleUnavailable={handleToggleUnavailable}
        />

        {/* Board */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(160px, 1fr))",
            gap: 8, padding: 10,
            minWidth: 830, height: "100%",
            boxSizing: "border-box",
          }}>
            {COLS.map(col => (
              <Column
                key={col.id}
                col={col}
                cards={cards}
                canEdit={canEdit}
                onAddClick={(colId) => setModal({ colId, card: null })}
                onEditCard={(card)  => setModal({ colId: card.col, card })}
                onDeleteCard={handleDeleteCard}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <CardModal
          colId={modal.colId}
          card={modal.card}
          cards={cards}
          onSave={handleSaveCard}
          onClose={() => setModal(null)}
          unavailableTechs={unavailableTechs}
        />
      )}
    </div>
  );
}
