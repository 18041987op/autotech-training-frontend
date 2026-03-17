/**
 * KeyBoardPage — Smart Shop Key Board
 *
 * Visible to ALL employees (admin, SA, technician).
 * Only admin and SA can add/edit/assign vehicles.
 * Technicians see a read-only view of the board.
 *
 * Columns:
 *   🔴 Customer Waiting  — client in waiting room, highest priority
 *   🟠 Drop Off          — client dropped off, needs to be assigned
 *   🟠 Repair in Progress— job active, tech assigned
 *   🟡 Waiting (Hold)    — paused waiting for parts or approval
 *   🟢 Ready for Pick Up — repair done, call customer
 *   ⚪ Shop / Employee   — internal vehicles
 */
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const TECHS = [
  { key: "romel",    num: 1, name: "Romel",    color: "#7c3aed" },
  { key: "juan",     num: 2, name: "Juan",     color: "#1d4ed8" },
  { key: "eluzahin", num: 3, name: "Eluzahin", color: "#0369a1" },
  { key: "kevin",    num: 4, name: "Kevin",    color: "#ea580c" },
  { key: "ivan",     num: 5, name: "Ivan",     color: "#475569" },
];

const COLS = [
  { id: "waiting", label: "Customer\nWaiting",            color: "#dc2626", darkColor: "#7f1d1d", needsDispatch: true  },
  { id: "dropoff", label: "Drop Off",                     color: "#ea580c", darkColor: "#7c2d12", needsDispatch: true  },
  { id: "repair",  label: "Repair in\nProgress",          color: "#b45309", darkColor: "#78350f", needsDispatch: true  },
  { id: "hold",    label: "Waiting for\nParts / Approval",color: "#ca8a04", darkColor: "#713f12", needsDispatch: false },
  { id: "ready",   label: "Ready for\nPick Up",           color: "#16a34a", darkColor: "#14532d", needsDispatch: false },
  { id: "shop",    label: "Shop /\nEmployee Cars",        color: "#475569", darkColor: "#1e293b", needsDispatch: false },
];

const MAX_HOURS = 8;
const STORAGE_KEY = "autorx_keyboard_v1";

const CAN_EDIT_ROLES = ["admin", "service advisor", "sa", "serviceadvisor"];

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
  if (colId === "shop") return { bg: "#dcfce7", text: "#166534" };
  if (colId === "waiting" && h > 0.5) return { bg: "#fee2e2", text: "#991b1b" };
  if (colId === "ready"   && h > 2)   return { bg: "#fee2e2", text: "#991b1b" };
  if (h > 2.5) return { bg: "#fef9c3", text: "#854d0e" };
  return { bg: "#dcfce7", text: "#166534" };
}

// ─── Dispatch logic ───────────────────────────────────────────────────────────

function computeTechLoad(cards) {
  const load = {};
  TECHS.forEach(t => load[t.key] = { hours: 0, jobs: [], hasDeadline: false });
  cards
    .filter(c => c.tech && c.col !== "ready" && c.col !== "shop")
    .forEach(c => {
      if (!load[c.tech]) return;
      load[c.tech].hours += c.hours || 0;
      load[c.tech].jobs.push(c);
      if (c.deadline) load[c.tech].hasDeadline = true;
    });
  return load;
}

function buildTechResult(tech, l) {
  const available = MAX_HOURS - l.hours;
  const isFull = available <= 0;
  let tag, tier;
  if (isFull)                                  { tag = "full";       tier = 5; }
  else if (l.jobs.length === 0)                { tag = "free";       tier = 1; }
  else if (l.jobs.length === 1 && !l.hasDeadline) { tag = "busy";   tier = 2; }
  else if (l.jobs.length === 1 && l.hasDeadline)  { tag = "deadline"; tier = 3; }
  else                                         { tag = "overloaded"; tier = 4; }
  return { tech, tag, tier, hours: l.hours, available: Math.max(0, available), jobs: l.jobs };
}

function dispatchAnalysis(cards, { isWaiting = false, returningTechKey = null } = {}) {
  const load = computeTechLoad(cards);

  if (returningTechKey) {
    const tech = TECHS.find(t => t.key === returningTechKey);
    if (tech) {
      const result = { ...buildTechResult(tech, load[returningTechKey]), tag: "return", tier: 0 };
      const rest = TECHS.filter(t => t.key !== returningTechKey)
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
  const best = analysis[0];
  if (!best) return { title: "⚠️ No techs available", body: "All technicians are at capacity.", accent: "#dc2626" };

  if (best.tag === "return")
    return { title: "🔁 Rule: Return Vehicle", body: `Must go back to ${best.tech.name} who did the original work.`, accent: "#f59e0b" };
  if (best.tier === 5)
    return { title: "⚠️ All Technicians Full", body: "Consider asking the customer to drop off or come back later.", accent: "#dc2626" };
  if (isWaiting && best.tag === "free")
    return { title: "🛋️ Rule: Customer Waiting", body: `${best.tech.name} (#${best.tech.num}) is the first free tech in the queue — no active jobs.`, accent: "#f59e0b" };
  if (isWaiting)
    return { title: "🛋️ Customer Waiting — No Free Techs", body: `${best.tech.name} (#${best.tech.num}) has the lightest load (${best.hours}h). Check committed times before assigning.`, accent: "#f59e0b" };
  if (best.tag === "free")
    return { title: "📋 Next in Queue", body: `${best.tech.name} (#${best.tech.num}) is next and has no active jobs.`, accent: "#22c55e" };
  return { title: "📋 Next in Queue", body: `${best.tech.name} (#${best.tech.num}) — ${best.hours}h assigned, ${best.available.toFixed(1)}h remaining.`, accent: "#22c55e" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TechPanel({ cards }) {
  const load = computeTechLoad(cards);
  const analysis = dispatchAnalysis(cards);
  const suggestedKey = analysis[0]?.tech.key;

  return (
    <div style={{
      width: 200, flexShrink: 0, background: "#1a2235",
      borderRight: "1px solid #334155", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{ padding: "8px 12px", fontSize: "0.6rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1, color: "#64748b",
        borderBottom: "1px solid #334155", flexShrink: 0 }}>
        👷 Tech Queue & Load
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {TECHS.map(tech => {
          const l = load[tech.key];
          const result = buildTechResult(tech, l);
          const isSuggested = tech.key === suggestedKey && result.tier < 5;
          const pct = Math.min(100, (l.hours / MAX_HOURS) * 100);
          const barColor = l.hours >= MAX_HOURS ? "#ef4444" : l.hours > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";
          const pillBg = result.tag === "free" ? "#14532d" : result.tag === "full" || result.tag === "overloaded" ? "#450a0a" : "#451a03";
          const pillText = result.tag === "free" ? "#86efac" : result.tag === "full" || result.tag === "overloaded" ? "#fca5a5" : "#fed7aa";
          const pillLabel = result.tag === "free" ? "Free" : result.tag === "full" ? "Full" : result.tag === "overloaded" ? "2+ jobs" : "Busy";

          return (
            <div key={tech.key} style={{
              padding: "9px 10px", borderBottom: "1px solid #0f172a",
              background: isSuggested ? "#0d2d1a" : "transparent",
              borderLeft: isSuggested ? "3px solid #22c55e" : "3px solid transparent",
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", background: tech.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: "0.78rem", color: "#fff", flexShrink: 0,
                }}>{tech.num}</div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e2e8f0", flex: 1 }}>{tech.name}</span>
                <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 20,
                  background: pillBg, color: pillText, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {pillLabel}
                </span>
              </div>
              {/* Hours bar */}
              <div style={{ fontSize: "0.58rem", color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>{l.hours}h / {MAX_HOURS}h</span>
                <span>{Math.max(0, MAX_HOURS - l.hours).toFixed(1)}h free</span>
              </div>
              <div style={{ height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width 0.4s" }} />
              </div>
              {/* Jobs */}
              {l.jobs.length === 0
                ? <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: 3 }}>No active jobs</div>
                : l.jobs.map((j, i) => (
                  <div key={i} style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#475569", flexShrink: 0 }} />
                    {j.name} · {j.hours || "?"}h
                    {j.deadline && <span style={{ color: "#f59e0b", fontWeight: 700 }}> ⏱️ {j.deadline}</span>}
                  </div>
                ))
              }
              {isSuggested && (
                <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#22c55e", marginTop: 4 }}>▶ NEXT UP</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rules legend */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid #334155", flexShrink: 0 }}>
        <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: 1, color: "#475569", marginBottom: 5 }}>Override Rules</div>
        <div style={{ fontSize: "0.6rem", color: "#64748b", lineHeight: 1.7 }}>
          🔴 Waiting = highest priority<br/>
          🛋️ Waiting → first free tech<br/>
          🔁 Return → original tech<br/>
          ⏱️ Deadline → check capacity<br/>
          🕐 Late/absent → skip<br/>
          ❌ Skill gap → re-assign
        </div>
      </div>
    </div>
  );
}

function KeyCard({ card, col, canEdit, onEdit, onDelete }) {
  const tech = TECHS.find(t => t.key === card.tech);
  const ms = Date.now() - card.addedAt;
  const tc = timerColor(ms, col.id);
  const isUrgent = col.id === "waiting";

  return (
    <div
      onClick={() => canEdit && onEdit(card)}
      style={{
        background: "rgba(255,255,255,0.97)",
        borderRadius: 9, padding: "7px 8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        position: "relative", userSelect: "none",
        borderLeft: `3px solid ${tech ? tech.color : isUrgent ? "#dc2626" : "transparent"}`,
        cursor: canEdit ? "pointer" : "default",
        transition: "transform 0.12s",
      }}
      onMouseEnter={e => canEdit && (e.currentTarget.style.transform = "translateY(-1px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "")}
    >
      {/* Name + key icon */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: "0.95rem" }}>🔑</span>
        <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#0f172a", flex: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {card.name}
        </span>
      </div>
      {/* Vehicle */}
      <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {card.vehicle}
      </div>
      {/* Hours + deadline */}
      {card.hours > 0 && (
        <div style={{ fontSize: "0.6rem", color: "#6366f1", fontWeight: 700, marginTop: 2 }}>
          ⏳ {card.hours}h est.
        </div>
      )}
      {card.deadline && (
        <div style={{ fontSize: "0.6rem", color: "#d97706", fontWeight: 700 }}>
          ⏱️ {card.deadline}
        </div>
      )}
      {/* Tech tag or unassigned warning */}
      {tech ? (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4,
          padding: "2px 7px", borderRadius: 20, fontSize: "0.62rem", fontWeight: 700,
          color: "#fff", background: tech.color,
        }}>#{tech.num} {tech.name}</span>
      ) : col.needsDispatch && canEdit ? (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4,
          fontSize: "0.62rem", fontWeight: 700, color: "#b45309",
          background: "#fef3c7", padding: "2px 7px", borderRadius: 20, cursor: "pointer",
        }}>⚠️ Assign tech</span>
      ) : null}
      {/* Footer: RO + timer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: "0.58rem", color: "#94a3b8", fontWeight: 600 }}>
          {card.ro ? `RO #${card.ro}` : ""}
        </span>
        <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "1px 5px", borderRadius: 4,
          background: tc.bg, color: tc.text }}>
          {elapsedLabel(ms)}
        </span>
      </div>
      {/* Delete button */}
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(card.id); }}
          style={{
            position: "absolute", top: 4, right: 5, background: "none", border: "none",
            color: "#cbd5e0", fontSize: "0.68rem", cursor: "pointer", padding: "2px 3px", borderRadius: 3,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e0")}
        >✕</button>
      )}
    </div>
  );
}

function Column({ col, cards, canEdit, onAddClick, onEditCard, onDeleteCard }) {
  const colCards = cards.filter(c => c.col === col.id);

  return (
    <div style={{
      borderRadius: 14, padding: "8px 7px",
      background: `linear-gradient(160deg, ${col.color}, ${col.darkColor})`,
      display: "flex", flexDirection: "column", minHeight: 0,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 6, flexShrink: 0 }}>
        <div style={{
          color: "#fff", fontWeight: 800, fontSize: "0.68rem",
          textTransform: "uppercase", letterSpacing: 0.4,
          textShadow: "0 1px 3px rgba(0,0,0,0.5)", lineHeight: 1.3,
        }}>
          {col.label.split("\n").map((line, i) => (
            <span key={i}>{line}{i === 0 && col.label.includes("\n") ? <br/> : null}</span>
          ))}
        </div>
        <span style={{
          display: "inline-block", marginTop: 3, background: "rgba(0,0,0,0.3)",
          color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "0 7px", borderRadius: 20,
        }}>{colCards.length}</span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        gap: 5, minHeight: 0, paddingBottom: 4 }}>
        {colCards.map(card => (
          <KeyCard
            key={card.id}
            card={card}
            col={col}
            canEdit={canEdit}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
          />
        ))}
      </div>

      {/* Add button — only for editors */}
      {canEdit && (
        <button
          onClick={() => onAddClick(col.id)}
          style={{
            marginTop: 5, flexShrink: 0,
            background: "rgba(255,255,255,0.12)",
            border: "1.5px dashed rgba(255,255,255,0.4)",
            borderRadius: 8, color: "rgba(255,255,255,0.8)",
            fontSize: "0.72rem", fontWeight: 700, padding: 5, cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        >+ Add</button>
      )}
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

function CardModal({ colId, card, cards, onSave, onClose }) {
  const col = COLS.find(c => c.id === colId);
  const isWaiting = colId === "waiting";
  const returningTechKey = card?.originalTech || null;

  const analysis = dispatchAnalysis(cards, { isWaiting, returningTechKey });
  const suggestedKey = analysis[0]?.tech.key;
  const rec = getRecommendationText(analysis, isWaiting);

  const [name,     setName]     = useState(card?.name     || "");
  const [vehicle,  setVehicle]  = useState(card?.vehicle  || "");
  const [ro,       setRo]       = useState(card?.ro       || "");
  const [hours,    setHours]    = useState(card?.hours    || "");
  const [deadline, setDeadline] = useState(card?.deadline || "");
  const [selTech,  setSelTech]  = useState(card?.tech || (col.needsDispatch ? suggestedKey : "") || "");
  const [errors,   setErrors]   = useState({});

  function handleSave() {
    const errs = {};
    if (!name.trim())    errs.name    = true;
    if (!vehicle.trim()) errs.vehicle = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSave({
      ...(card || {}),
      id:           card?.id || uid(),
      col:          colId,
      name:         name.trim(),
      vehicle:      vehicle.trim(),
      ro:           ro.trim(),
      hours:        parseFloat(hours) || 0,
      deadline:     deadline.trim(),
      tech:         col.needsDispatch ? selTech : (card?.tech || ""),
      addedAt:      card?.addedAt || Date.now(),
      originalTech: card?.originalTech || (col.needsDispatch ? selTech : ""),
    });
  }

  const inputStyle = (hasErr) => ({
    width: "100%", border: `1.5px solid ${hasErr ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: 8, padding: "7px 10px", fontSize: "0.82rem", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 18, padding: 22,
        width: 420, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 70px rgba(0,0,0,0.7)", color: "#0f172a",
      }}>
        <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 2 }}>
          {card ? "Edit Vehicle" : "Add Vehicle"}
        </div>
        <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 14 }}>
          {col.label.replace("\n", " ")}
        </div>

        {/* Name */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", margin: "0 0 3px" }}>
          Customer Last Name *
        </label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Martinez"
          style={inputStyle(errors.name)} maxLength={20}
          onKeyDown={e => e.key === "Enter" && handleSave()} />

        {/* Vehicle */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", margin: "9px 0 3px" }}>
          Vehicle *
        </label>
        <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. 2019 Honda Civic"
          style={inputStyle(errors.vehicle)} maxLength={30}
          onKeyDown={e => e.key === "Enter" && handleSave()} />

        {/* RO + Hours */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", margin: "9px 0 3px" }}>RO #</label>
            <input value={ro} onChange={e => setRo(e.target.value)} placeholder="4821"
              style={inputStyle(false)} maxLength={10} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", margin: "9px 0 3px" }}>Est. Hours</label>
            <input value={hours} onChange={e => setHours(e.target.value)} placeholder="2.5"
              type="number" min={0.5} max={12} step={0.5} style={inputStyle(false)} />
          </div>
        </div>

        {/* Deadline */}
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", margin: "9px 0 3px" }}>
          Committed Time (if customer has a deadline)
        </label>
        <input value={deadline} onChange={e => setDeadline(e.target.value)}
          placeholder='e.g. "by 3:00 PM" or leave blank' style={inputStyle(false)} />

        {/* Dispatch section */}
        {col.needsDispatch && (
          <>
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "12px 0" }} />

            {/* Recommendation box */}
            <div style={{
              padding: "10px 14px", borderRadius: 12,
              border: `2px solid ${rec.accent}20`,
              background: `${rec.accent}10`,
              marginBottom: 10,
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: rec.accent, marginBottom: 4 }}>
                {rec.title}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#374151", lineHeight: 1.5 }}>
                {rec.body}
              </div>
            </div>

            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", margin: "0 0 6px" }}>
              Select Technician
            </label>

            {/* Tech option rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {analysis.map(({ tech, tag, tier, hours: tHours, available, jobs }) => {
                const isSuggested = tech.key === suggestedKey;
                const isSelected  = tech.key === selTech;
                const pct = Math.min(100, (tHours / MAX_HOURS) * 100);
                const barColor = tHours >= MAX_HOURS ? "#ef4444" : tHours > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";

                const tagBg   = tag === "full" || tag === "overloaded" ? "#fee2e2"
                              : isSuggested ? "#dcfce7"
                              : tag === "deadline" || tag === "busy" ? "#fef9c3"
                              : "#dcfce7";
                const tagText = tag === "full" || tag === "overloaded" ? "#991b1b"
                              : isSuggested ? "#166534"
                              : tag === "deadline" || tag === "busy" ? "#854d0e"
                              : "#166534";
                const tagLabel = isSuggested ? "✓ Best match"
                               : tag === "free" ? "Free"
                               : tag === "full" ? "Full"
                               : tag === "overloaded" ? "2+ jobs"
                               : tag === "deadline" ? "Has deadline"
                               : tag === "busy" ? `${jobs.length} job`
                               : "Available";

                const jobSummary = jobs.length > 0
                  ? jobs.map(j => `${j.name}${j.hours ? ` (${j.hours}h)` : ""}${j.deadline ? ` ⏱️ ${j.deadline}` : ""}`).join(", ")
                  : "No active jobs";

                return (
                  <div
                    key={tech.key}
                    onClick={() => setSelTech(tech.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8,
                      border: `1.5px solid ${isSelected ? (isSuggested ? "#16a34a" : "#6366f1") : isSuggested ? "#86efac" : "#e2e8f0"}`,
                      background: isSelected ? (isSuggested ? "#f0fdf4" : "#eef2ff") : isSuggested ? "#f0fdf4" : "#fff",
                      cursor: "pointer", transition: "border 0.15s, background 0.15s",
                      opacity: tag === "full" || tag === "overloaded" ? 0.6 : 1,
                    }}
                  >
                    {/* Badge */}
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", background: tech.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, fontSize: "0.75rem", color: "#fff", flexShrink: 0,
                    }}>{tech.num}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>{tech.name}</span>
                        <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600 }}>
                          {tHours > 0 ? `${tHours}h / ${MAX_HOURS}h` : "0h — free"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {jobSummary}
                      </div>
                      <div style={{ height: 3, background: "#e2e8f0", borderRadius: 3, marginTop: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3 }} />
                      </div>
                    </div>

                    {/* Tag */}
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                      background: tagBg, color: tagText, flexShrink: 0, whiteSpace: "nowrap" }}>
                      {tagLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 9, border: "1.5px solid #e2e8f0", borderRadius: 8,
            background: "#fff", color: "#64748b", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem",
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: 9, border: "none", borderRadius: 8,
            background: "#6366f1", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.82rem",
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function KeyBoardPage() {
  const { user } = useOutletContext() || {};
  const role = (user?.role || "").toLowerCase().replace(/\s/g, "");
  const canEdit = CAN_EDIT_ROLES.includes(role) || role === "admin";

  const [cards, setCards]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const [modal,   setModal]   = useState(null);  // { colId, card? }
  const [clock,   setClock]   = useState("");

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  // Clock + timer refresh
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

  const handleSaveCard = useCallback((cardData) => {
    setCards(prev => {
      const exists = prev.find(c => c.id === cardData.id);
      return exists
        ? prev.map(c => c.id === cardData.id ? cardData : c)
        : [...prev, cardData];
    });
    setModal(null);
  }, []);

  const handleDeleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 0px)", background: "#0f172a", color: "#e2e8f0",
      margin: "-16px",   // cancel the page padding from Layout
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 16px", background: "#1e293b",
        borderBottom: "1px solid #334155", flexShrink: 0, gap: 10,
      }}>
        <h1 style={{ color: "#f1f5f9", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
          🔑 Key Board
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!canEdit && (
            <span style={{ fontSize: "0.65rem", color: "#64748b", background: "#1e293b",
              border: "1px solid #334155", padding: "2px 8px", borderRadius: 20 }}>
              👁 View only
            </span>
          )}
          <span style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600 }}>{clock}</span>
        </div>
      </div>

      {/* Workspace */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Tech Panel */}
        <TechPanel cards={cards} />

        {/* Board */}
        <div style={{
          flex: 1, display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 8, padding: 10, overflow: "hidden",
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
            />
          ))}
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
        />
      )}
    </div>
  );
}
