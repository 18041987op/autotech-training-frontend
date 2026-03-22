/**
 * KeyBoardPage — Smart Shop Key Board v5 (Technician Lanes)
 *
 * REDESIGN: From status columns → technician lanes with sub-sections
 *   Each tech has: 📅 Appointments, ⏳ Waiting, 🚗 Drop Off, ✅ Ready
 *   Plus: 🛍️ Shop Cars column for internal vehicles
 *
 * FEATURES:
 *   - Tekmetric appointment fetching (every 15s poll)
 *   - Tekmetric RO auto-sync: WAITING_FOR_PICKUP → ready, INVOICE → delete
 *   - Unassigned cards shown at top with warning color
 *   - State Inspection appointments highlighted in red
 *   - 8 OVERRIDE RULES  (see dispatch logic section)
 *
 * Designed for large-screen display — readable from 10+ feet.
 * Dark theme with high-contrast column colors.
 * Data synced to Supabase; polls every 15 s.
 * Bilingual: English / Spanish via react-i18next.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { getAppointments, getActiveRepairOrders } from "../lib/tekmetric";

// ─── i18n context (avoids prop-drilling t() into every sub-component) ─────────
const TCtx = React.createContext((k) => k);
const useT = () => React.useContext(TCtx);

// ─── Constants ────────────────────────────────────────────────────────────────

const TECHS = [
  { key: "romel",    num: 1, name: "Romel",    color: "#7c3aed" },
  { key: "juan",     num: 2, name: "Juan",     color: "#1d4ed8" },
  { key: "eluzahin", num: 3, name: "Eluzahin", color: "#0369a1" },
  { key: "kevin",    num: 4, name: "Kevin",    color: "#ea580c" },
  { key: "ivan",     num: 5, name: "Ivan",     color: "#475569" },
];

const COLS = [
  { id: "waiting", color: "#dc2626", darkColor: "#7f1d1d", needsDispatch: true  },
  { id: "dropoff", color: "#ea580c", darkColor: "#7c2d12", needsDispatch: true  },
  { id: "repair",  color: "#ca8a04", darkColor: "#78350f", needsDispatch: true  },
  { id: "ready",   color: "#16a34a", darkColor: "#14532d", needsDispatch: false },
  { id: "shop",    color: "#475569", darkColor: "#1e293b", needsDispatch: false },
];

// "Active" columns where Done/Hold/Resume buttons are relevant
const ACTIVE_COLS = new Set(["waiting", "dropoff", "repair"]);

const MAX_HOURS = 8;

const CAN_EDIT_ROLES = ["admin", "service_advisor", "service advisor", "sa", "serviceadvisor"];

// Dark theme palette matching training app dark surfaces
const D = {
  bg:        "#0f172a",
  surface:   "#1e293b",
  surface2:  "#263348",
  border:    "#334155",
  text:      "#f1f5f9",
  textMed:   "#94a3b8",
  textLight: "#64748b",
  primary:   "#818cf8",
  primaryBg: "#1e1b4b",
  danger:    "#f87171",
  dangerBg:  "#450a0a",
  warn:      "#fbbf24",
  warnBg:    "#451a03",
  success:   "#4ade80",
  successBg: "#14532d",
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
  if (colId === "shop")                   return { bg: "#14532d", text: "#4ade80" };
  if (colId === "waiting" && h > 0.5)     return { bg: "#450a0a", text: "#f87171" };
  if (colId === "ready"   && h > 2)       return { bg: "#450a0a", text: "#f87171" };
  if (h > 2.5)                            return { bg: "#451a03", text: "#fbbf24" };
  return { bg: "#14532d", text: "#4ade80" };
}

/**
 * Parse a deadline string into a Date object.
 * Handles:
 *   - datetime-local ISO: "2025-12-15T14:00"
 *   - Legacy same-day:    "9 AM", "3:30 PM", "14:00"
 */
function parseDeadline(str) {
  if (!str) return null;
  const s = str.trim();
  // ISO from datetime-local input
  if (s.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  // Legacy: "9 AM", "3:30 PM", "14:00"
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
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

/** Human-readable deadline label — uses t() for "Tomorrow" translation */
function formatDeadline(str, t) {
  if (!str) return "";
  const d = parseDeadline(str);
  if (!d) return str; // fallback: show raw string
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (isToday)    return time;           // same day → just show time
  if (isTomorrow) return `${t ? t("keyboard.tomorrow") : "Tomorrow"} ${time}`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " " + time;
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
  overdue:  { color: "#f87171", bg: "#450a0a" },
  critical: { color: "#fb923c", bg: "#431407" },
  warning:  { color: "#fbbf24", bg: "#451a03" },
  ok:       { color: "#4ade80", bg: "#14532d" },
};

const URGENCY_RANK = { overdue: 4, critical: 3, warning: 2, ok: 1 };

// ─── DB Mapping ───────────────────────────────────────────────────────────────

function toDbRow(card) {
  return {
    id:            card.id,
    col:           card.col,
    status:        card.status       || "repairing",
    name:          card.name         || "",
    vehicle:       card.vehicle      || "",
    ro:            card.ro           || "",
    hours:         card.hours        || 0,
    deadline:      card.deadline     || "",
    tech:          card.tech         || "",
    original_tech: card.originalTech || "",
    added_at:      card.addedAt      || Date.now(),
    override_note: card.overrideNote || "",
    skill:         card.skill        || "",
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
      hours: 0, jobs: [], hasDeadline: false,
      worstUrgency: null, unavailable: unavailableTechs.has(t.key),
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
  // R5: Tech absent → skip
  if (l.unavailable) return { tech, tag: "unavailable", tier: 99, hours: l.hours, available: 0, jobs: l.jobs, worstUrgency: null };
  const available = MAX_HOURS - l.hours;
  const u = l.worstUrgency;
  let tag, tier;
  if (l.jobs.length === 0)                        { tag = "free";       tier = 1; }
  else if (u === "critical" || u === "overdue")   { tag = "finishing";  tier = 2; }
  else if (l.jobs.length === 1 && !l.hasDeadline) { tag = "busy";       tier = 3; }
  else if (u === "warning")                       { tag = "warning";    tier = 4; }
  else if (l.hasDeadline)                         { tag = "deadline";   tier = 4; }
  else if (l.jobs.length >= 2)                    { tag = "overloaded"; tier = 5; }
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

function getRecommendationText(analysis, isWaiting, t) {
  const eligible = analysis.filter(a => a.tag !== "unavailable");
  const best = eligible[0];
  if (!best) return {
    title: t("keyboard.dispatch.allUnavailableTitle"),
    body:  t("keyboard.dispatch.allUnavailableBody"),
    accent: D.danger,
  };
  if (best.tag === "return") return {
    title: t("keyboard.dispatch.returnTitle"),
    body:  t("keyboard.dispatch.returnBody", { name: best.tech.name }),
    accent: D.warn,
  };
  if (best.tier >= 6) return {
    title: t("keyboard.dispatch.allFullTitle"),
    body:  t("keyboard.dispatch.allFullBody"),
    accent: D.danger,
  };
  if (best.tag === "finishing") {
    const status = best.worstUrgency === "overdue"
      ? t("keyboard.dispatch.finishingOverdueLabel")
      : t("keyboard.dispatch.finishingCriticalLabel");
    return isWaiting
      ? { title: t("keyboard.dispatch.waitingFinishingTitle"), body: t("keyboard.dispatch.waitingFinishingBody", { name: best.tech.name, num: best.tech.num, status }), accent: "#f97316" }
      : { title: t("keyboard.dispatch.finishingTitle"),        body: t("keyboard.dispatch.finishingBody",        { name: best.tech.name, num: best.tech.num, status }), accent: "#f97316" };
  }
  if (isWaiting && best.tag === "free") return {
    title: t("keyboard.dispatch.waitingFreeTitle"),
    body:  t("keyboard.dispatch.waitingFreeBody", { name: best.tech.name, num: best.tech.num }),
    accent: D.warn,
  };
  if (isWaiting) return {
    title: t("keyboard.dispatch.waitingBusyTitle"),
    body:  t("keyboard.dispatch.waitingBusyBody", { name: best.tech.name, num: best.tech.num, hours: best.hours }),
    accent: D.warn,
  };
  if (best.tag === "free") return {
    title: t("keyboard.dispatch.nextFreeTitle"),
    body:  t("keyboard.dispatch.nextFreeBody", { name: best.tech.name, num: best.tech.num }),
    accent: D.success,
  };
  if (best.tag === "warning") return {
    title: t("keyboard.dispatch.warningTitle"),
    body:  t("keyboard.dispatch.warningBody", { name: best.tech.name, num: best.tech.num }),
    accent: D.warn,
  };
  return {
    title: t("keyboard.dispatch.nextBusyTitle"),
    body:  t("keyboard.dispatch.nextBusyBody", { name: best.tech.name, num: best.tech.num, hours: best.hours, available: best.available.toFixed(1) }),
    accent: D.success,
  };
}

/** R4 + R6 + R7: detect rule violations when assigning newCard to techKey */
function detectConflicts(newCard, techKey, cards, t) {
  if (!techKey) return [];
  const tech = TECHS.find(te => te.key === techKey);
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
      rule: 6, severity: "danger", icon: "⚠️",
      message: t("keyboard.dispatch.r6Overload", {
        name: tech.name,
        total: totalHours.toFixed(1),
        max: MAX_HOURS,
        over: (totalHours - MAX_HOURS).toFixed(1),
      }),
    });
  }

  // R4: Deadline conflict
  techJobs.forEach(existing => {
    if (!existing.deadline) return;
    const dl = parseDeadline(existing.deadline);
    if (!dl) return;
    const hoursUntilDeadline = (dl - Date.now()) / 3600000;
    if (hoursUntilDeadline > 0 && totalHours > hoursUntilDeadline) {
      conflicts.push({
        rule: 4, severity: "danger", icon: "⏱️",
        message: t("keyboard.dispatch.r4Deadline", {
          new: newHours,
          name: tech.name,
          total: totalHours.toFixed(1),
          job: existing.name,
          dl: formatDeadline(existing.deadline, t),
          away: hoursUntilDeadline.toFixed(1),
        }),
        conflictingCard: existing,
      });
    }
  });

  // R7: Skill gap
  if (newCard.skill && newCard.skill.trim()) {
    conflicts.push({
      rule: 7, severity: "warning", icon: "🔧",
      message: t("keyboard.dispatch.r7Skill", { skill: newCard.skill, name: tech.name }),
    });
  }

  return conflicts;
}

// ─── TechPanel ────────────────────────────────────────────────────────────────

function TechPanel({ cards, unavailableTechs, canEdit, onToggleUnavailable }) {
  const t = useT();
  const load = computeTechLoad(cards, unavailableTechs);
  const analysis = dispatchAnalysis(cards, { unavailableTechs });
  const suggestedKey = analysis.find(a => a.tag !== "unavailable")?.tech.key;

  return (
    <div style={{
      width: 220, flexShrink: 0, background: D.surface,
      borderRight: `1px solid ${D.border}`,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ padding: "8px 12px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: D.textLight, borderBottom: `1px solid ${D.border}`, flexShrink: 0, background: D.bg }}>
        {t("keyboard.techPanel.title")}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {TECHS.map(tech => {
          const l = load[tech.key];
          const result = buildTechResult(tech, l);
          const isOff = unavailableTechs.has(tech.key);
          const isSuggested = tech.key === suggestedKey && !isOff;
          const pct = Math.min(100, (l.hours / MAX_HOURS) * 100);
          const barColor = l.hours >= MAX_HOURS ? "#ef4444" : l.hours > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";

          const pill = isOff ? { bg: D.surface2, text: D.textLight, label: t("keyboard.techPanel.off") }
            : result.tag === "free"      ? { bg: D.successBg, text: D.success,  label: t("keyboard.techPanel.free")      }
            : result.tag === "finishing" ? { bg: "#431407",   text: "#fb923c",  label: t("keyboard.techPanel.finishing")  }
            : result.tag === "warning"   ? { bg: D.warnBg,    text: D.warn,     label: t("keyboard.techPanel.dueSoon")    }
            : result.tag === "full"      ? { bg: D.dangerBg,  text: D.danger,   label: t("keyboard.techPanel.full")       }
            : result.tag === "overloaded"? { bg: D.dangerBg,  text: D.danger,   label: t("keyboard.techPanel.manyJobs")   }
            :                              { bg: D.primaryBg,  text: D.primary,  label: t("keyboard.techPanel.busy")       };

          return (
            <div key={tech.key} style={{
              padding: "9px 10px", borderBottom: `1px solid ${D.border}`,
              background: isOff ? D.bg : isSuggested ? "#0d2d1a" : D.surface,
              borderLeft: `3px solid ${isOff ? D.border : isSuggested ? "#22c55e" : "transparent"}`,
              opacity: isOff ? 0.7 : 1,
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isOff ? D.textLight : tech.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem", color: "#fff", flexShrink: 0 }}>
                  {tech.num}
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: D.text, flex: 1 }}>{tech.name}</span>
                <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: pill.bg, color: pill.text, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  {pill.label}
                </span>
              </div>

              {!isOff && (
                <>
                  <div style={{ fontSize: "0.62rem", color: D.textLight, display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span>{l.hours}{t("keyboard.techPanel.hOf")}{MAX_HOURS}h</span>
                    <span>{Math.max(0, MAX_HOURS - l.hours).toFixed(1)}{t("keyboard.techPanel.hFree")}</span>
                  </div>
                  <div style={{ height: 5, background: D.border, borderRadius: 5, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 5, transition: "width 0.4s" }} />
                  </div>
                  {l.jobs.length === 0
                    ? <div style={{ fontSize: "0.65rem", color: D.textLight }}>{t("keyboard.techPanel.noJobs")}</div>
                    : l.jobs.map((j, i) => {
                      const ju = deadlineUrgency(j.deadline);
                      const jus = ju ? URGENCY_STYLE[ju] : null;
                      return (
                        <div key={i} style={{ fontSize: "0.65rem", color: D.textMed, display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: jus ? jus.color : D.border, flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {j.name} · {j.hours || "?"}h
                          </span>
                          {j.deadline && (
                            <span style={{ color: jus ? jus.color : D.warn, fontWeight: 700, fontSize: "0.58rem", flexShrink: 0 }}>
                              ⏱️ {formatDeadline(j.deadline, t)}
                            </span>
                          )}
                        </div>
                      );
                    })
                  }
                  {result.tag === "finishing" && (
                    <div style={{ marginTop: 5, padding: "3px 7px", borderRadius: 5, background: "#431407", fontSize: "0.6rem", fontWeight: 700, color: "#fb923c" }}>
                      {result.worstUrgency === "overdue" ? t("keyboard.techPanel.deadlinePassed") : t("keyboard.techPanel.finishingUp")}
                    </div>
                  )}
                  {result.tag === "warning" && (
                    <div style={{ marginTop: 5, padding: "3px 7px", borderRadius: 5, background: D.warnBg, fontSize: "0.6rem", fontWeight: 700, color: D.warn }}>
                      {t("keyboard.techPanel.deadlineHour")}
                    </div>
                  )}
                  {isSuggested && (
                    <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#22c55e", marginTop: 4 }}>
                      {result.tag === "finishing" ? t("keyboard.techPanel.assignNext") : t("keyboard.techPanel.nextUp")}
                    </div>
                  )}
                </>
              )}

              {/* R5: Toggle unavailable — SA/admin only */}
              {canEdit && (
                <button onClick={() => onToggleUnavailable(tech.key)}
                  style={{ marginTop: 5, width: "100%", padding: "3px 0", border: `1px solid ${isOff ? "#22c55e" : D.border}`, borderRadius: 5, cursor: "pointer", background: isOff ? D.successBg : D.bg, color: isOff ? D.success : D.textLight, fontSize: "0.6rem", fontWeight: 700 }}>
                  {isOff ? t("keyboard.techPanel.markAvailable") : t("keyboard.techPanel.markAbsent")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Rules legend */}
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${D.border}`, flexShrink: 0, background: D.bg }}>
        <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: D.textLight, marginBottom: 4 }}>{t("keyboard.rules.title")}</div>
        <div style={{ fontSize: "0.62rem", color: D.textMed, lineHeight: 1.9 }}>
          {t("keyboard.rules.r1")}<br />
          {t("keyboard.rules.r2")}<br />
          {t("keyboard.rules.r3")}<br />
          {t("keyboard.rules.r4")}<br />
          {t("keyboard.rules.r5")}<br />
          {t("keyboard.rules.r6")}<br />
          {t("keyboard.rules.r7")}<br />
          {t("keyboard.rules.r8")}
        </div>
      </div>
    </div>
  );
}

// ─── Key Card ─────────────────────────────────────────────────────────────────

function KeyCard({ card, col, canEdit, onEdit, onDelete, onQuickAction }) {
  const t = useT();
  const [confirmAction, setConfirmAction] = useState(null);
  const tech   = TECHS.find(te => te.key === card.tech);
  const ms     = Date.now() - card.addedAt;
  const tc     = timerColor(ms, col.id);
  const isUrgent  = col.id === "waiting";
  const isOnHold  = ACTIVE_COLS.has(card.col) && card.status === "onhold";
  const isActive  = ACTIVE_COLS.has(card.col);

  function handleAction(action) {
    // Always confirm Done and Hold to prevent accidental taps on large screen.
    // Resume is fine to execute instantly for SA/admin (reversible).
    if (!canEdit || action === "done" || action === "hold") {
      setConfirmAction(action);
    } else {
      onQuickAction(card.id, action);
    }
  }

  // Deadline display
  const dlLabel   = card.deadline ? formatDeadline(card.deadline, t) : null;
  const dlUrgency = card.deadline ? deadlineUrgency(card.deadline) : null;
  const dlStyle   = dlUrgency ? URGENCY_STYLE[dlUrgency] : null;

  return (
    <div
      onClick={() => canEdit && !confirmAction && onEdit(card)}
      style={{
        background: isOnHold ? "#1c1a07" : "#ffffff",
        borderRadius: 10, padding: "9px 10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        position: "relative", userSelect: "none",
        borderLeft: `4px solid ${isOnHold ? "#ca8a04" : tech ? tech.color : isUrgent ? "#dc2626" : "#334155"}`,
        cursor: canEdit ? "pointer" : "default",
        transition: "transform 0.12s, box-shadow 0.12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 5px 14px rgba(0,0,0,0.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)"; }}
    >
      {/* Confirmation overlay — shown for all users on Done/Hold, and for non-SA on all actions */}
      {confirmAction && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.94)", borderRadius: 10, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, gap: 6 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {!canEdit
              ? t("keyboard.card.confirmWarning")
              : confirmAction === "done"   ? t("keyboard.card.confirmDone")
              : confirmAction === "hold"   ? t("keyboard.card.confirmHold")
              :                              t("keyboard.card.confirmResume")}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
            <button onClick={() => setConfirmAction(null)}
              style={{ fontSize: "0.7rem", padding: "5px 12px", border: `1px solid ${D.border}`, borderRadius: 6, cursor: "pointer", background: D.surface, color: D.textMed, fontWeight: 600 }}>
              {t("keyboard.card.cancel")}
            </button>
            <button onClick={() => { onQuickAction(card.id, confirmAction); setConfirmAction(null); }}
              style={{ fontSize: "0.7rem", padding: "5px 12px", border: "none", borderRadius: 6, cursor: "pointer",
                background: confirmAction === "done" ? "#14532d" : confirmAction === "hold" ? "#451a03" : "#1e1b4b",
                color: confirmAction === "done" ? "#bbf7d0" : confirmAction === "hold" ? "#fbbf24" : D.primary,
                fontWeight: 800 }}>
              {t("keyboard.card.confirm")}
            </button>
          </div>
        </div>
      )}

      {/* Customer name */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: "1.0rem" }}>🔑</span>
        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: isOnHold ? "#fbbf24" : "#0f172a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {card.name}
        </span>
      </div>

      {/* Vehicle */}
      <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {card.vehicle}
      </div>

      {/* Hours */}
      {card.hours > 0 && (
        <div style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 700, marginTop: 3 }}>
          ⏳ {card.hours}h est.
        </div>
      )}

      {/* Deadline */}
      {dlLabel && (
        <div style={{
          fontSize: "0.75rem", fontWeight: 700, marginTop: 3,
          color: dlStyle ? dlStyle.color : "#d97706",
          ...(dlUrgency === "overdue" || dlUrgency === "critical"
            ? { background: dlStyle.bg, padding: "2px 6px", borderRadius: 5, display: "inline-block" }
            : {}),
        }}>
          ⏱️ {dlLabel}{dlUrgency === "overdue" ? ` ${t("keyboard.card.overdue")}` : dlUrgency === "critical" ? ` ${t("keyboard.card.soon")}` : ""}
        </div>
      )}

      {/* Skill */}
      {card.skill && (
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "1px 5px", borderRadius: 4, display: "inline-block", marginTop: 3 }}>
          🔧 {card.skill}
        </div>
      )}

      {/* Tech badge */}
      {tech ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 5, padding: "3px 8px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, color: "#fff", background: tech.color }}>
          #{tech.num} {tech.name}
        </div>
      ) : col.needsDispatch ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 5, fontSize: "0.72rem", fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "3px 8px", borderRadius: 20 }}>
          {t("keyboard.card.assignTech")}
        </div>
      ) : null}

      {/* On-hold badge */}
      {isOnHold && (
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24", background: "#451a03", padding: "2px 7px", borderRadius: 5, display: "inline-block", marginTop: 4 }}>
          {t("keyboard.card.onHold")}
        </div>
      )}

      {/* Override note (R8) */}
      {card.overrideNote && (
        <div style={{ fontSize: "0.65rem", color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", padding: "4px 7px", borderRadius: 5, marginTop: 5, lineHeight: 1.4 }}>
          {t("keyboard.card.override")} {card.overrideNote}
        </div>
      )}

      {/* Footer: RO + elapsed */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
        <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>{card.ro ? `${t("keyboard.modal.roLabel")} ${card.ro}` : ""}</span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px", borderRadius: 5, background: tc.bg, color: tc.text }} title="Time on board">
          🕐 {elapsedLabel(ms)}
        </span>
      </div>

      {/* Quick action buttons — ALL active columns, ALL users */}
      {isActive && (
        <div style={{ display: "flex", gap: 5, marginTop: 6 }} onClick={e => e.stopPropagation()}>
          {/* On Hold / Resume available on ALL active columns */}
          {isOnHold
            ? <button onClick={() => handleAction("resume")} style={btnStyle("#14532d", "#4ade80")}>{t("keyboard.card.resume")}</button>
            : <button onClick={() => handleAction("hold")}   style={btnStyle("#451a03", "#fbbf24")}>{t("keyboard.card.onHoldBtn")}</button>
          }
          <button onClick={() => handleAction("done")} style={btnStyle("#14532d", "#bbf7d0", true)}>{t("keyboard.card.done")}</button>
        </div>
      )}

      {/* Delete (editor only) */}
      {canEdit && (
        <button onClick={e => { e.stopPropagation(); onDelete(card.id); }}
          style={{ position: "absolute", top: 5, right: 6, background: "none", border: "none", color: "#cbd5e0", fontSize: "0.75rem", cursor: "pointer", padding: "1px 3px", borderRadius: 3 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e0")}>
          ✕
        </button>
      )}
    </div>
  );
}

function btnStyle(bg, color, flex1 = false) {
  return {
    flex: flex1 ? 1 : undefined,
    fontSize: "0.68rem", fontWeight: 700, padding: "4px 8px",
    borderRadius: 6, border: "none", cursor: "pointer",
    background: bg, color,
  };
}

// ─── Card Modal ───────────────────────────────────────────────────────────────

function CardModal({ colId, card, cards, onSave, onClose, unavailableTechs }) {
  const t = useT();
  const col = COLS.find(c => c.id === colId);
  const isWaiting = colId === "waiting";
  const returningTechKey = card?.originalTech || null;
  const analysis = dispatchAnalysis(cards, { isWaiting, returningTechKey, unavailableTechs });
  const suggestedKey = analysis.find(a => a.tag !== "unavailable")?.tech.key;
  const rec = getRecommendationText(analysis, isWaiting, t);

  const [name,         setName]         = useState(card?.name     || "");
  const [vehicle,      setVehicle]      = useState(card?.vehicle  || "");
  const [ro,           setRo]           = useState(card?.ro       || "");
  const [hours,        setHours]        = useState(card?.hours    || "");
  const [deadline,     setDeadline]     = useState(card?.deadline || "");
  const [skill,        setSkill]        = useState(card?.skill    || "");
  const [selTech,      setSelTech]      = useState(card?.tech || (col.needsDispatch ? suggestedKey : "") || "");
  const [overrideNote, setOverrideNote] = useState("");
  const [errors,       setErrors]       = useState({});

  const conflicts = col.needsDispatch && selTech
    ? detectConflicts({ ...card, hours: parseFloat(hours) || 0, skill, id: card?.id || "__new__" }, selTech, cards, t)
    : [];
  const hasConflict = conflicts.length > 0;

  function handleSave() {
    const errs = {};
    if (!name.trim())    errs.name    = true;
    if (!vehicle.trim()) errs.vehicle = true;
    if (hasConflict && !overrideNote.trim()) errs.overrideNote = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...(card || {}),
      id: card?.id || uid(), col: colId, status: card?.status || "repairing",
      name: name.trim(), vehicle: vehicle.trim(), ro: ro.trim(),
      hours: parseFloat(hours) || 0, deadline: deadline.trim(), skill: skill.trim(),
      tech: col.needsDispatch ? selTech : (card?.tech || ""),
      addedAt: card?.addedAt || Date.now(),
      originalTech: card?.originalTech || (col.needsDispatch ? selTech : ""),
      overrideNote: overrideNote.trim(),
    });
  }

  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: 8, padding: "8px 10px", fontSize: "0.9rem", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  });

  const colLabel = t(`keyboard.cols.${col.id}`).replace("\n", " ");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, width: 460, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 70px rgba(0,0,0,0.5)", color: "#0f172a" }}>

        <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 2 }}>
          {card ? t("keyboard.modal.editTitle") : t("keyboard.modal.addTitle")}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 16 }}>{colLabel}</div>

        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "0 0 4px" }}>{t("keyboard.modal.customerLabel")}</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Martinez" style={inp(errors.name)} maxLength={20} onKeyDown={e => e.key === "Enter" && handleSave()} />

        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "10px 0 4px" }}>{t("keyboard.modal.vehicleLabel")}</label>
        <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. 2019 Honda Civic" style={inp(errors.vehicle)} maxLength={30} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "10px 0 4px" }}>{t("keyboard.modal.roLabel")}</label>
            <input value={ro} onChange={e => setRo(e.target.value)} placeholder="4821" style={inp(false)} maxLength={10} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "10px 0 4px" }}>{t("keyboard.modal.hoursLabel")}</label>
            <input value={hours} onChange={e => setHours(e.target.value)} placeholder="2.5" type="number" min={0.5} max={12} step={0.5} style={inp(false)} />
          </div>
        </div>

        {/* Deadline — datetime-local for multi-day support */}
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "10px 0 4px" }}>
          {t("keyboard.modal.deadlineLabel")}
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{ ...inp(false), colorScheme: "light" }}
        />
        <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 3 }}>
          {t("keyboard.modal.deadlineHint")}
        </div>

        {/* Skill (R7) */}
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "10px 0 4px" }}>
          {t("keyboard.modal.skillLabel")}
        </label>
        <input value={skill} onChange={e => setSkill(e.target.value)} placeholder='e.g. "alignment", "diagnostic"' style={inp(false)} maxLength={30} />

        {/* Dispatch section */}
        {col.needsDispatch && (
          <>
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />

            <div style={{ padding: "10px 14px", borderRadius: 10, border: `2px solid ${rec.accent}33`, background: `${rec.accent}12`, marginBottom: 12 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: rec.accent, marginBottom: 3 }}>{rec.title}</div>
              <div style={{ fontSize: "0.78rem", color: "#374151", lineHeight: 1.5 }}>{rec.body}</div>
            </div>

            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", margin: "0 0 8px" }}>{t("keyboard.modal.selectTech")}</label>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {analysis.map(({ tech, tag, tier, hours: tH, available, jobs }) => {
                const isUnavail   = tag === "unavailable";
                const isSuggested = tech.key === suggestedKey;
                const isSelected  = tech.key === selTech;
                const pct = Math.min(100, (tH / MAX_HOURS) * 100);
                const barColor = tH >= MAX_HOURS ? "#ef4444" : tH > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";

                const tagBg = isUnavail ? "#f1f5f9"
                  : tag === "full" || tag === "overloaded" ? "#fee2e2"
                  : tag === "finishing" ? "#ffedd5"
                  : tag === "warning"   ? "#fef9c3"
                  : isSuggested ? "#dcfce7" : "#eef2ff";
                const tagText = isUnavail ? "#94a3b8"
                  : tag === "full" || tag === "overloaded" ? "#991b1b"
                  : tag === "finishing" ? "#9a3412"
                  : tag === "warning"   ? "#854d0e"
                  : isSuggested ? "#166534" : "#4338ca";
                const tagLabel = isUnavail ? t("keyboard.techPanel.off")
                  : isSuggested ? t("keyboard.modal.tagBestMatch")
                  : tag === "free"       ? t("keyboard.modal.tagFree")
                  : tag === "finishing"  ? t("keyboard.modal.tagFinishing")
                  : tag === "warning"    ? t("keyboard.modal.tagDueSoon")
                  : tag === "full"       ? t("keyboard.modal.tagFull")
                  : tag === "overloaded" ? t("keyboard.modal.tagManyJobs")
                  : tag === "deadline"   ? t("keyboard.modal.tagDeadline")
                  : tag === "busy"       ? t("keyboard.modal.tagBusy", { n: jobs.length })
                  : t("keyboard.modal.tagAvailable");

                const jobSummary = jobs.length > 0
                  ? jobs.map(j => `${j.name}${j.hours ? ` (${j.hours}h)` : ""}${j.deadline ? ` ⏱️${formatDeadline(j.deadline, t)}` : ""}`).join(", ")
                  : isUnavail ? t("keyboard.modal.markedAbsent") : t("keyboard.techPanel.noJobs");

                return (
                  <div key={tech.key}
                    onClick={() => !isUnavail && setSelTech(tech.key)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${isSelected ? (isSuggested ? "#22c55e" : "#6366f1") : isSuggested ? "#86efac" : "#e2e8f0"}`, background: isSelected ? (isSuggested ? "#f0fdf4" : "#eef2ff") : isSuggested ? "#f0fdf4" : "#fff", cursor: isUnavail ? "not-allowed" : "pointer", opacity: isUnavail || tier >= 6 ? 0.5 : 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isUnavail ? "#cbd5e1" : tech.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.82rem", color: "#fff", flexShrink: 0 }}>{tech.num}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{tech.name}</span>
                        <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{tH > 0 ? `${tH}h / ${MAX_HOURS}h` : t("keyboard.modal.free")}</span>
                      </div>
                      <div style={{ fontSize: "0.67rem", color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jobSummary}</div>
                      <div style={{ height: 3, background: "#e2e8f0", borderRadius: 3, marginTop: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: tagBg, color: tagText, flexShrink: 0, whiteSpace: "nowrap" }}>{tagLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Conflict warnings */}
            {conflicts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {conflicts.map((c, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 6, background: c.severity === "danger" ? "#fee2e2" : "#fef9c3", border: `1px solid ${c.severity === "danger" ? "#fca5a5" : "#fde68a"}`, fontSize: "0.75rem", color: c.severity === "danger" ? "#7f1d1d" : "#78350f", lineHeight: 1.5 }}>
                    {c.icon} {c.message}
                  </div>
                ))}
              </div>
            )}

            {/* R8: Override reason */}
            {hasConflict && (
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>
                  {t("keyboard.modal.overrideLabel")}
                </label>
                <textarea value={overrideNote} onChange={e => setOverrideNote(e.target.value)}
                  placeholder={t("keyboard.modal.overridePlaceholder")}
                  rows={2}
                  style={{ width: "100%", border: `1.5px solid ${errors.overrideNote ? "#ef4444" : "#fbbf24"}`, borderRadius: 8, padding: "8px 10px", fontSize: "0.82rem", color: "#0f172a", outline: "none", boxSizing: "border-box", resize: "vertical", background: "#fffbeb" }}
                />
                {errors.overrideNote && <div style={{ fontSize: "0.68rem", color: "#dc2626", marginTop: 2 }}>{t("keyboard.modal.overrideRequired")}</div>}
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#64748b", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>{t("keyboard.modal.cancel")}</button>
          <button onClick={handleSave} style={{ flex: 2, padding: 10, border: "none", borderRadius: 8, background: hasConflict ? "#f59e0b" : "#6366f1", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.9rem" }}>
            {hasConflict ? t("keyboard.modal.overrideSave") : t("keyboard.modal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Card ────────────────────────────────────────────────────────

function AppointmentCard({ appt }) {
  const isStateInspection = /inspection|state inspection/i.test(appt.title);
  const startTime = appt.start_time ? new Date(appt.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "TBD";
  const typeLabel = appt.appointment_type === "DROP_OFF" ? "Drop Off" : "Customer Waiting";

  return (
    <div
      style={{
        background: isStateInspection ? "#fee2e2" : "#e0f2fe",
        borderRadius: 8,
        padding: "8px 9px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        position: "relative",
        borderLeft: `4px solid ${isStateInspection ? "#dc2626" : "#0369a1"}`,
        ...(isStateInspection ? { animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" } : {}),
      }}
    >
      <style>
        {`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`}
      </style>

      {/* Time */}
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: isStateInspection ? "#991b1b" : "#0c4a6e" }}>
        ⏰ {startTime}
      </div>

      {/* Customer name */}
      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: isStateInspection ? "#7f1d1d" : "#164e63", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {appt.customer_name}
      </div>

      {/* Vehicle */}
      <div style={{ fontSize: "0.7rem", color: isStateInspection ? "#991b1b" : "#0c4a6e", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {appt.vehicle_description}
      </div>

      {/* Title */}
      <div style={{ fontSize: "0.7rem", color: isStateInspection ? "#7f1d1d" : "#164e63", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
        {appt.title}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
        {isStateInspection && (
          <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#dc2626", color: "#fff" }}>
            🔍 STATE INSPECTION
          </span>
        )}
        <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: isStateInspection ? "#991b1b" : "#0369a1", color: "#fff" }}>
          {typeLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function KeyBoardPage() {
  const { t } = useTranslation();
  const { user } = useOutletContext() || {};
  const rawRole = (user?.role || "").toLowerCase();
  const canEdit = CAN_EDIT_ROLES.includes(rawRole) ||
                  CAN_EDIT_ROLES.includes(rawRole.replace(/[\s_]/g, "")) ||
                  rawRole === "admin";

  const [cards,            setCards]            = useState([]);
  const [appointments,     setAppointments]     = useState([]);
  const [tekmetricROs,     setTekmetricROs]     = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [syncErr,          setSyncErr]          = useState(null);
  const [modal,            setModal]            = useState(null);
  const [clock,            setClock]            = useState("");
  const [unavailableTechs, setUnavailableTechs] = useState(new Set());
  const pollRef = useRef(null);

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

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("[Tekmetric] Appointment fetch failed:", e);
      setAppointments([]);
    }
  }, []);

  const fetchActiveROs = useCallback(async () => {
    try {
      const data = await getActiveRepairOrders();
      setTekmetricROs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("[Tekmetric] Active RO fetch failed:", e);
      setTekmetricROs([]);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiFetch("/api/keyboard/config/tech_status");
      setUnavailableTechs(new Set(data?.unavailable || []));
    } catch { /* ignore */ }
  }, []);

  // Auto-sync with Tekmetric ROs
  useEffect(() => {
    if (tekmetricROs.length === 0) return;
    setCards(prev => {
      let updated = [...prev];
      const toDelete = [];

      tekmetricROs.forEach(ro => {
        const idx = updated.findIndex(c => c.ro === ro.repair_order_number);
        if (idx === -1) return;

        if (ro.status === "WAITING_FOR_PICKUP") {
          console.log(`[AutoSync] Moving card RO ${ro.repair_order_number} to READY`);
          updated[idx] = { ...updated[idx], col: "ready" };
        } else if (ro.status === "INVOICE") {
          console.log(`[AutoSync] Deleting card RO ${ro.repair_order_number} (INVOICE)`);
          toDelete.push(updated[idx].id);
        }
      });

      updated = updated.filter(c => !toDelete.includes(c.id));
      return updated;
    });
  }, [tekmetricROs]);

  useEffect(() => {
    fetchCards(); fetchConfig(); fetchAppointments(); fetchActiveROs();
    pollRef.current = setInterval(() => {
      fetchCards(); fetchConfig(); fetchAppointments(); fetchActiveROs();
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchCards, fetchConfig, fetchAppointments, fetchActiveROs]);

  useEffect(() => {
    function update() {
      const n = new Date();
      setClock(
        n.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
        "  " + n.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const handleToggleUnavailable = useCallback(async (techKey) => {
    if (!canEdit) return;
    setUnavailableTechs(prev => {
      const next = new Set(prev);
      if (next.has(techKey)) next.delete(techKey); else next.add(techKey);
      apiFetch("/api/keyboard/config/tech_status", { method: "PUT", body: { unavailable: [...next] } }).catch(() => {});
      return next;
    });
  }, [canEdit]);

  const handleSaveCard = useCallback(async (cardData) => {
    const exists = cards.find(c => c.id === cardData.id);
    setCards(prev => exists ? prev.map(c => c.id === cardData.id ? cardData : c) : [...prev, cardData]);
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

  const handleDeleteCard = useCallback(async (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    try { await apiFetch(`/api/keyboard/cards/${id}`, { method: "DELETE" }); }
    catch (e) { setSyncErr("Delete failed — " + e.message); fetchCards(); }
  }, [fetchCards]);

  const handleQuickAction = useCallback(async (id, action) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const patch = action === "done"   ? { col: "ready", status: "repairing" }
                : action === "hold"   ? { status: "onhold" }
                : action === "resume" ? { status: "repairing" }
                : null;
    if (!patch) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    try { await apiFetch(`/api/keyboard/cards/${id}`, { method: "PATCH", body: patch }); }
    catch (e) { setSyncErr("Action failed — " + e.message); fetchCards(); }
  }, [cards, fetchCards]);

  // Match appointments to technicians (by first name, case-insensitive)
  const appointmentsByTech = {};
  TECHS.forEach(t => { appointmentsByTech[t.key] = []; });
  appointments.forEach(appt => {
    const matchedTech = TECHS.find(t => t.name.toLowerCase() === (appt.technician_name || "").toLowerCase());
    if (matchedTech) {
      appointmentsByTech[matchedTech.key].push(appt);
    }
  });

  // Unassigned cards (no tech selected)
  const unassignedCards = cards.filter(c => !c.tech);

  return (
    <TCtx.Provider value={t}>
      <div style={{
        display: "flex", flexDirection: "column",
        background: D.bg, color: D.text,
        flex: 1,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", background: D.surface, borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          <h1 style={{ color: D.text, fontSize: "1.1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            🔑 {t("keyboard.title")}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {syncErr && <span style={{ fontSize: "0.65rem", color: D.danger, background: D.dangerBg, border: `1px solid #7f1d1d`, padding: "2px 8px", borderRadius: 20 }}>⚠️ {syncErr}</span>}
            {loading && <span style={{ fontSize: "0.65rem", color: D.textLight }}>{t("keyboard.loading")}</span>}
            {!canEdit && <span style={{ fontSize: "0.68rem", color: D.textLight, background: D.surface2, border: `1px solid ${D.border}`, padding: "2px 8px", borderRadius: 20 }}>{t("keyboard.viewOnly")}</span>}
            <span style={{ color: D.textMed, fontSize: "0.85rem", fontWeight: 600 }}>{clock}</span>
            {canEdit && (
              <button
                onClick={() => setModal({ colId: "waiting", card: null })}
                style={{
                  background: D.primary, color: "#fff", border: "none", borderRadius: 6,
                  padding: "5px 12px", fontSize: "0.85rem", fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                + {t("keyboard.cols.add")}
              </button>
            )}
          </div>
        </div>

        {/* Workspace */}
        <div style={{ display: "flex", flex: 1, overflow: "auto", minHeight: 0 }}>
          {/* Tech Panel */}
          <div style={{ flexShrink: 0, overflowY: "auto" }}>
            <TechPanel cards={cards} unavailableTechs={unavailableTechs} canEdit={canEdit} onToggleUnavailable={handleToggleUnavailable} />
          </div>

          {/* Board — Technician Lanes */}
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
            <div style={{
              display: "flex", flexDirection: "column",
              padding: 12,
              minHeight: "100%",
              boxSizing: "border-box",
              gap: 12,
            }}>
              {/* Unassigned cards section */}
              {unassignedCards.length > 0 && (
                <div style={{
                  padding: "10px 12px",
                  background: `linear-gradient(160deg, #7c2d12, #451a03)`,
                  borderRadius: 12,
                  border: `2px solid #ea580c`,
                  minHeight: 80,
                }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                    ⚠️ Unassigned ({unassignedCards.length})
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {unassignedCards.map(card => (
                      <div key={card.id} style={{ flex: "0 0 calc(20% - 5px)", minWidth: 150 }}>
                        <KeyCard card={card} col={{ id: card.col, needsDispatch: true }} canEdit={canEdit}
                          onEdit={(c) => setModal({ colId: c.col, card: c })}
                          onDelete={handleDeleteCard}
                          onQuickAction={handleQuickAction} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments Banner */}
              <div style={{
                padding: "10px 12px",
                background: "#1e293b",
                borderRadius: 12,
                border: `1px solid ${D.border}`,
              }}>
                <div style={{ color: D.text, fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  📅 Today's Appointments ({appointments.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  {appointments.length === 0 ? (
                    <div style={{ fontSize: "0.75rem", color: D.textLight }}>No appointments scheduled</div>
                  ) : (
                    appointments.map((appt, i) => (
                      <AppointmentCard key={i} appt={appt} />
                    ))
                  )}
                </div>
              </div>

              {/* Tech Lanes */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${TECHS.length}, minmax(200px, 1fr)) minmax(200px, 1fr)`,
                gap: 12,
                minWidth: `${(TECHS.length + 1) * 220}px`,
              }}>
                {/* Each tech's column */}
                {TECHS.map(tech => {
                  const isUnavail = unavailableTechs.has(tech.key);
                  const load = computeTechLoad(cards, unavailableTechs);
                  const l = load[tech.key];
                  const pct = Math.min(100, (l.hours / MAX_HOURS) * 100);
                  const barColor = l.hours >= MAX_HOURS ? "#ef4444" : l.hours > MAX_HOURS * 0.6 ? "#f59e0b" : "#22c55e";
                  const techAppts = appointmentsByTech[tech.key] || [];

                  // Cards for this tech in each status
                  const techWaitingCards = cards.filter(c => c.tech === tech.key && c.col === "waiting");
                  const techDropoffCards = cards.filter(c => c.tech === tech.key && c.col === "dropoff");
                  const techRepairCards = cards.filter(c => c.tech === tech.key && c.col === "repair");
                  const techReadyCards = cards.filter(c => c.tech === tech.key && c.col === "ready");

                  return (
                    <div key={tech.key} style={{
                      display: "flex", flexDirection: "column", gap: 10,
                      opacity: isUnavail ? 0.5 : 1,
                      pointerEvents: isUnavail ? "none" : "auto",
                    }}>
                      {/* Tech Header */}
                      <div style={{
                        padding: "10px 12px",
                        background: tech.color,
                        borderRadius: 10,
                        color: "#fff",
                        textAlign: "center",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(255,255,255,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 900, fontSize: "0.95rem",
                          }}>
                            {tech.num}
                          </div>
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, flex: 1 }}>{tech.name}</span>
                        </div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, marginBottom: 5 }}>
                          {l.hours.toFixed(1)}h / {MAX_HOURS}h
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4 }} />
                        </div>
                      </div>

                      {/* Appointments Sub-section */}
                      <div style={{
                        background: "#1e3a5f",
                        borderRadius: 10,
                        padding: "8px",
                        minHeight: 60,
                      }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", marginBottom: 6 }}>
                          📅 Appts ({techAppts.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 150, overflowY: "auto" }}>
                          {techAppts.length === 0 ? (
                            <div style={{ fontSize: "0.65rem", color: "#64748b" }}>None</div>
                          ) : (
                            techAppts.map((appt, i) => (
                              <AppointmentCard key={i} appt={appt} />
                            ))
                          )}
                        </div>
                      </div>

                      {/* Waiting Sub-section */}
                      <div style={{
                        background: `linear-gradient(160deg, #dc2626, #7f1d1d)`,
                        borderRadius: 10,
                        padding: "8px",
                        minHeight: 80,
                      }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", marginBottom: 6 }}>
                          ⏳ Waiting ({techWaitingCards.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
                          {techWaitingCards.map(card => (
                            <KeyCard key={card.id} card={card} col={{ id: "waiting", needsDispatch: true }} canEdit={canEdit}
                              onEdit={(c) => setModal({ colId: c.col, card: c })}
                              onDelete={handleDeleteCard}
                              onQuickAction={handleQuickAction} />
                          ))}
                        </div>
                      </div>

                      {/* Drop Off + In Progress Sub-section */}
                      <div style={{
                        background: `linear-gradient(160deg, #ea580c, #7c2d12)`,
                        borderRadius: 10,
                        padding: "8px",
                        minHeight: 80,
                      }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", marginBottom: 6 }}>
                          🚗 Drop Off / In Progress ({techDropoffCards.length + techRepairCards.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 250, overflowY: "auto" }}>
                          {/* Drop Off cards */}
                          {techDropoffCards.map(card => (
                            <KeyCard key={card.id} card={card} col={{ id: "dropoff", needsDispatch: true }} canEdit={canEdit}
                              onEdit={(c) => setModal({ colId: c.col, card: c })}
                              onDelete={handleDeleteCard}
                              onQuickAction={handleQuickAction} />
                          ))}
                          {/* In Progress cards — with working badge */}
                          {techRepairCards.map(card => (
                            <div key={card.id} style={{ position: "relative" }}>
                              <KeyCard card={card} col={{ id: "repair", needsDispatch: true }} canEdit={canEdit}
                                onEdit={(c) => setModal({ colId: c.col, card: c })}
                                onDelete={handleDeleteCard}
                                onQuickAction={handleQuickAction} />
                              <div style={{
                                position: "absolute", top: 8, right: 8,
                                fontSize: "0.65rem", fontWeight: 700,
                                background: "#ca8a04", color: "#000",
                                padding: "2px 6px", borderRadius: 4,
                              }}>
                                ⚙️ WORKING
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ready For Pick Up Sub-section */}
                      <div style={{
                        background: `linear-gradient(160deg, #16a34a, #14532d)`,
                        borderRadius: 10,
                        padding: "8px",
                        minHeight: 80,
                      }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", marginBottom: 6 }}>
                          ✅ Ready ({techReadyCards.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
                          {techReadyCards.map(card => (
                            <KeyCard key={card.id} card={card} col={{ id: "ready", needsDispatch: false }} canEdit={canEdit}
                              onEdit={(c) => setModal({ colId: c.col, card: c })}
                              onDelete={handleDeleteCard}
                              onQuickAction={handleQuickAction} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Shop Cars Column */}
                <div style={{
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{
                    padding: "10px 12px",
                    background: "#475569",
                    borderRadius: 10,
                    color: "#fff",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>🛍️</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: 4 }}>Shop Cars</div>
                  </div>

                  <div style={{
                    background: `linear-gradient(160deg, #475569, #1e293b)`,
                    borderRadius: 10,
                    padding: "8px",
                    minHeight: 200,
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                      {cards.filter(c => c.col === "shop").map(card => (
                        <KeyCard key={card.id} card={card} col={{ id: "shop", needsDispatch: false }} canEdit={canEdit}
                          onEdit={(c) => setModal({ colId: c.col, card: c })}
                          onDelete={handleDeleteCard}
                          onQuickAction={handleQuickAction} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modal && (
          <CardModal colId={modal.colId} card={modal.card} cards={cards}
            onSave={handleSaveCard} onClose={() => setModal(null)}
            unavailableTechs={unavailableTechs} />
        )}
      </div>
    </TCtx.Provider>
  );
}
