/**
 * MyProductionPage — day-by-day production breakdown so a tech/SA can spot
 * missing work BEFORE the Sunday payroll cron runs.
 *
 * - Default range: current week + previous week (Sun-Sat)
 * - Filters: this week, last week, both, this month, last month, custom
 * - Per-day card: scheduled vs worked, billed hrs, revenue, commission est, jobs list, "Report" button
 * - Admin/Administrative: employee selector to view any teammate
 */

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, CalendarDays, ChevronDown, ChevronUp, AlertCircle,
  Clock, DollarSign, Wrench, Car, FileText, Send, X,
} from "lucide-react";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { getDailyProduction, reportProductionIssue } from "../lib/productionApi";
import { getTeamDirectory } from "../lib/hrApi";
import { PageHero } from "../components/PageHero";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

// ── Date helpers (Sunday-anchored, matches payroll week) ─────────────────

function startOfWeek(d, weekOffset = 0) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay() + weekOffset * 7);
  return x;
}
function endOfWeek(d, weekOffset = 0) {
  const s = startOfWeek(d, weekOffset);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return e;
}
function startOfMonth(d, monthOffset = 0) {
  const x = new Date(d.getFullYear(), d.getMonth() + monthOffset, 1);
  return x;
}
function endOfMonth(d, monthOffset = 0) {
  const x = new Date(d.getFullYear(), d.getMonth() + monthOffset + 1, 0);
  return x;
}
function fmtISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtHuman(d, opts = {}) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", ...opts,
  });
}
function fmt$(n) {
  if (n == null || isNaN(n)) return "—";
  return "$" + Math.round(Number(n)).toLocaleString();
}
function fmtH(n) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toFixed(1) + " hrs";
}

// ── Range presets ────────────────────────────────────────────────────────

const PRESETS = [
  { key: "default", labelKey: "production.range.default" },   // this week + last week
  { key: "this_week", labelKey: "production.range.thisWeek" },
  { key: "last_week", labelKey: "production.range.lastWeek" },
  { key: "this_month", labelKey: "production.range.thisMonth" },
  { key: "last_month", labelKey: "production.range.lastMonth" },
  { key: "custom", labelKey: "production.range.custom" },
];

function rangeFor(preset, customStart, customEnd) {
  const now = new Date();
  switch (preset) {
    case "this_week":  return { start: fmtISO(startOfWeek(now, 0)),  end: fmtISO(endOfWeek(now, 0)) };
    case "last_week":  return { start: fmtISO(startOfWeek(now, -1)), end: fmtISO(endOfWeek(now, -1)) };
    case "this_month": return { start: fmtISO(startOfMonth(now, 0)),  end: fmtISO(endOfMonth(now, 0)) };
    case "last_month": return { start: fmtISO(startOfMonth(now, -1)), end: fmtISO(endOfMonth(now, -1)) };
    case "custom":
      return {
        start: customStart || fmtISO(startOfWeek(now, -1)),
        end:   customEnd   || fmtISO(endOfWeek(now, 0)),
      };
    case "default":
    default:
      return { start: fmtISO(startOfWeek(now, -1)), end: fmtISO(endOfWeek(now, 0)) };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

export function MyProductionPage() {
  const { t } = useTranslation();
  const ready = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const hasElevated = useAuthStore((s) => s.hasElevatedAccess());

  const [preset, setPreset] = useState("default");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [targetEmail, setTargetEmail] = useState(""); // admin can pick any teammate

  const range = useMemo(() => rangeFor(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const effectiveEmail = (hasElevated && targetEmail) ? targetEmail : user?.email;

  const enabled = !!effectiveEmail && !!range.start && !!range.end;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["production-daily", effectiveEmail, range.start, range.end],
    queryFn: () => getDailyProduction(effectiveEmail, range.start, range.end),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  // Admin: load team directory for the employee picker
  const { data: teamData } = useQuery({
    queryKey: ["team-directory"],
    queryFn: () => getTeamDirectory(),
    enabled: hasElevated,
    staleTime: 5 * 60 * 1000,
  });

  if (!ready) return <LoadingSkeleton />;

  if (!user?.email) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        {t("production.notLoggedIn", "Sign in to see your production.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("nav2.production", "Production")}
        title={t("production.title", "My Production")}
        subtitle={t(
          "production.subtitle",
          "Day-by-day production from Tekmetric — review before payroll closes."
        )}
      />

      <FilterBar
        preset={preset} setPreset={setPreset}
        customStart={customStart} setCustomStart={setCustomStart}
        customEnd={customEnd} setCustomEnd={setCustomEnd}
        showEmployeePicker={hasElevated}
        team={teamData?.data || teamData?.employees || []}
        targetEmail={targetEmail}
        setTargetEmail={setTargetEmail}
        currentUserEmail={user.email}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error?.message || t("production.errorLoad", "Could not load production data")}
          <button onClick={() => refetch()} className="ml-3 btn-outline-sm">
            {t("common.retry", "Retry")}
          </button>
        </div>
      ) : data ? (
        <>
          <TotalsSummary data={data} t={t} />
          <DaysList
            days={data.days || []}
            roleKind={data.role_kind}
            employeeEmail={effectiveEmail}
            t={t}
          />
        </>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────────────────

function FilterBar({
  preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd,
  showEmployeePicker, team, targetEmail, setTargetEmail, currentUserEmail,
}) {
  const { t } = useTranslation();
  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="h-4 w-4 text-slate-500" />
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border
              ${preset === p.key
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
              }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-slate-100">
          <label className="text-xs font-medium text-slate-500">
            {t("production.range.from", "From")}
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="ml-2 border border-slate-200 rounded-lg px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-500">
            {t("production.range.to", "To")}
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="ml-2 border border-slate-200 rounded-lg px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}

      {showEmployeePicker && (
        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-slate-100">
          <label className="text-xs font-medium text-slate-500">
            {t("production.viewing", "Viewing")}:
            <select
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="ml-2 border border-slate-200 rounded-lg px-2 py-1 text-sm min-w-[220px]"
            >
              <option value="">{t("production.myProduction", "My production")} ({currentUserEmail})</option>
              {(team || [])
                .filter((m) => m.work_email && m.work_email !== currentUserEmail)
                .sort((a, b) => (a.employee_name || "").localeCompare(b.employee_name || ""))
                .map((m) => (
                  <option key={m.emp_id} value={m.work_email}>
                    {m.employee_name} {m.role ? `(${m.role})` : ""}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Totals summary
// ─────────────────────────────────────────────────────────────────────────

function TotalsSummary({ data, t }) {
  const tot = data.totals || {};
  const isTech = data.role_kind === "technician";
  const isSA = data.role_kind === "service_advisor";

  const tiles = [];
  if (isTech) {
    tiles.push(
      { label: t("production.totals.billedHours", "Billed Hours"), value: fmtH(tot.billed_hours), icon: Clock, color: "sky" },
      { label: t("production.totals.laborRevenue", "Labor Revenue"), value: fmt$(tot.labor_revenue), icon: DollarSign, color: "emerald" },
      { label: t("production.totals.commissionEst", "Commission (est)"), value: fmt$(tot.commission_estimate), icon: TrendingUp, color: "violet" }
    );
  }
  if (isSA) {
    tiles.push(
      { label: t("production.totals.totalSold", "Total Sold"), value: fmt$(tot.sa_total_sold), icon: DollarSign, color: "emerald" },
      { label: t("production.totals.roCount", "RO Count"), value: tot.sa_ro_count ?? "—", icon: FileText, color: "sky" }
    );
  }
  tiles.push(
    { label: t("production.totals.scheduled", "Scheduled"), value: fmtH(tot.scheduled_hours), icon: CalendarDays, color: "slate" }
  );
  if (!isTech) {
    tiles.push({ label: t("production.totals.worked", "Worked"), value: fmtH(tot.worked_hours), icon: Clock, color: "amber" });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`h-4 w-4 text-${tile.color}-500`} />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {tile.label}
              </span>
            </div>
            <p className="text-xl font-extrabold text-slate-900">{tile.value}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Days list
// ─────────────────────────────────────────────────────────────────────────

function DaysList({ days, roleKind, employeeEmail, t }) {
  const [expanded, setExpanded] = useState({}); // date -> bool
  const [reportingFor, setReportingFor] = useState(null); // date or null

  // Hide "empty" days unless they're scheduled or part of the current week
  const visibleDays = useMemo(() => {
    return (days || []).filter((d) => {
      const hasWork = (d.jobs?.length || 0) > 0 || (d.posted_ros?.length || 0) > 0;
      const hasHours = (d.billed_hours || 0) > 0 || (d.worked_hours || 0) > 0;
      const hasSched = (d.scheduled_hours || 0) > 0;
      return hasWork || hasHours || hasSched;
    });
  }, [days]);

  if (visibleDays.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500 text-sm">
        {t("production.empty", "No production data in this range.")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {visibleDays.map((d) => (
          <DayCard
            key={d.date}
            day={d}
            roleKind={roleKind}
            expanded={!!expanded[d.date]}
            onToggle={() => setExpanded((s) => ({ ...s, [d.date]: !s[d.date] }))}
            onReport={() => setReportingFor(d.date)}
            t={t}
          />
        ))}
      </div>

      {reportingFor && (
        <ReportIssueModal
          date={reportingFor}
          email={employeeEmail}
          onClose={() => setReportingFor(null)}
        />
      )}
    </>
  );
}

function DayCard({ day, roleKind, expanded, onToggle, onReport, t }) {
  const isTech = roleKind === "technician";
  const isSA = roleKind === "service_advisor";

  const hasJobs = (day.jobs?.length || 0) > 0;
  const hasROs  = (day.posted_ros?.length || 0) > 0;
  const canExpand = hasJobs || hasROs;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50"
           onClick={canExpand ? onToggle : undefined}>
        {/* Date & day name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold uppercase">
              {new Date(day.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className="text-base font-extrabold leading-none">
              {new Date(day.date + "T12:00:00").getDate()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{fmtHuman(day.date)}</p>
            <p className="text-xs text-slate-500">
              {day.scheduled_hours != null
                ? `${t("production.scheduled", "Scheduled")}: ${fmtH(day.scheduled_hours)}`
                : t("production.notScheduled", "Not scheduled")}
              {day.worked_hours != null && day.worked_hours > 0 ? ` · ${t("production.worked", "Worked")}: ${fmtH(day.worked_hours)}` : ""}
            </p>
          </div>
        </div>

        {/* Day stats */}
        <div className="flex items-center gap-3 sm:gap-5 text-xs text-slate-700">
          {isTech && (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-[10px] uppercase font-semibold text-slate-400">{t("production.totals.billedHours", "Billed")}</p>
                <p className="font-bold text-slate-900">{fmtH(day.billed_hours)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-slate-400">{t("production.totals.laborRevenue", "Revenue")}</p>
                <p className="font-bold text-slate-900">{fmt$(day.labor_revenue)}</p>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[10px] uppercase font-semibold text-slate-400">{t("production.totals.commissionEst", "Comm")}</p>
                <p className="font-bold text-violet-700">{fmt$(day.commission_estimate)}</p>
              </div>
            </>
          )}
          {isSA && (
            <>
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-slate-400">{t("production.totals.totalSold", "Sold")}</p>
                <p className="font-bold text-slate-900">{fmt$(day.sa_total_sold)}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[10px] uppercase font-semibold text-slate-400">{t("production.totals.roCount", "ROs")}</p>
                <p className="font-bold text-slate-900">{day.sa_ro_count ?? "—"}</p>
              </div>
            </>
          )}
        </div>

        {/* Right side: expand chevron */}
        <div className="flex items-center gap-2">
          {canExpand ? (
            expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <span className="text-[10px] uppercase text-slate-400">{t("production.noJobs", "No jobs")}</span>
          )}
        </div>
      </div>

      {expanded && canExpand && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4 space-y-3">
          {hasJobs && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                {t("production.jobsCompleted", "Jobs completed")} ({day.jobs.length})
              </p>
              <div className="space-y-2">
                {day.jobs.map((j) => <JobRow key={`j-${j.ro_id}-${j.description || j.category}`} job={j} t={t} />)}
              </div>
            </div>
          )}

          {hasROs && (
            <div className={hasJobs ? "pt-3 border-t border-slate-200" : ""}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                {isTech
                  ? t("production.postedROs", "Posted ROs (commission paid)")
                  : t("production.invoicedROs", "Invoiced ROs")} ({day.posted_ros.length})
              </p>
              <div className="space-y-2">
                {day.posted_ros.map((r) => <PostedRORow key={`r-${r.ro_id}`} ro={r} isTech={isTech} t={t} />)}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onReport}
              className="btn-outline-sm flex items-center gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
              type="button"
            >
              <AlertCircle className="h-4 w-4" />
              {t("production.reportIssue", "Report missing/incorrect work")}
            </button>
          </div>
        </div>
      )}

      {/* Always show Report button on collapsed cards too (for days with no data) */}
      {!canExpand && (
        <div className="border-t border-slate-100 px-4 py-2 flex justify-end">
          <button
            onClick={onReport}
            className="text-[11px] text-amber-700 hover:underline flex items-center gap-1"
            type="button"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {t("production.reportIssue", "Report missing/incorrect work")}
          </button>
        </div>
      )}
    </div>
  );
}

function JobRow({ job, t }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 text-sm">
      <Wrench className="h-4 w-4 text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">
          {job.description || t("production.unnamedJob", "Job")} <span className="text-slate-400 font-normal">· {job.category}</span>
        </p>
        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
          {job.ro_number != null && <span className="font-mono font-semibold text-slate-700">RO {job.ro_number}</span>}
          {job.vehicle && (
            <>
              <span className="text-slate-300">·</span>
              <Car className="h-3 w-3" /> {job.vehicle}
            </>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-slate-900">{fmtH(job.hours)}</p>
        <p className="text-[11px] text-slate-500">{fmt$(job.labor_revenue)}</p>
      </div>
    </div>
  );
}

function PostedRORow({ ro, isTech, t }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 text-sm">
      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
          <span className="font-mono">RO {ro.ro_number ?? "?"}</span>
          {ro.vehicle && (
            <>
              <span className="text-slate-300">·</span>
              <Car className="h-3 w-3" /> <span className="font-normal text-slate-600">{ro.vehicle}</span>
            </>
          )}
        </p>
        <p className="text-xs text-slate-500">
          {t("production.totals.totalSold", "Total Sold")}: {fmt$(ro.total_amount)}
        </p>
      </div>
      {isTech && (
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] uppercase font-semibold text-slate-400">{t("production.totals.commissionEst", "Comm")}</p>
          <p className="text-sm font-bold text-violet-700">{fmt$(ro.commission)}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Report Issue modal
// ─────────────────────────────────────────────────────────────────────────

function ReportIssueModal({ date, email, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [issueType, setIssueType] = useState("missing_job");
  const [description, setDescription] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      reportProductionIssue({
        email,
        report_date: date,
        description: description.trim(),
        issue_type: issueType,
      }),
    onSuccess: () => {
      toast.success(t("production.reportSent", "Report sent — Osman will review before payroll"));
      queryClient.invalidateQueries({ queryKey: ["production-daily"] });
      onClose();
    },
    onError: (e) => {
      toast.error(e?.message || t("production.reportError", "Could not send the report"));
    },
  });

  const onSubmit = () => {
    if (description.trim().length < 5) {
      toast.error(t("production.reportTooShort", "Please describe what's wrong (at least 5 characters)"));
      return;
    }
    submit.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            {t("production.reportTitle", "Report production issue")}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100" type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            {t("production.reportFor", "Reporting issue for")}: <strong>{fmtHuman(date, { year: "numeric" })}</strong>
          </p>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              {t("production.issueType", "Type")}
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="missing_job">{t("production.issueTypes.missing_job", "Missing job(s)")}</option>
              <option value="wrong_hours">{t("production.issueTypes.wrong_hours", "Wrong hours")}</option>
              <option value="wrong_ro">{t("production.issueTypes.wrong_ro", "Wrong RO assignment")}</option>
              <option value="other">{t("production.issueTypes.other", "Other")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              {t("production.description", "What's wrong?")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t(
                "production.descriptionPlaceholder",
                "e.g. I completed RO #12345 (brakes) on this day but it doesn't appear in my list."
              )}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-y"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{description.length}/1000</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t border-slate-200 px-5 py-3 bg-slate-50">
          <button onClick={onClose} className="btn-outline-sm" type="button" disabled={submit.isPending}>
            {t("common.cancel", "Cancel")}
          </button>
          <button
            onClick={onSubmit}
            disabled={submit.isPending || description.trim().length < 5}
            className="btn-primary-sm flex items-center gap-1.5 disabled:opacity-50"
            type="button"
          >
            <Send className="h-4 w-4" />
            {submit.isPending ? t("common.sending", "Sending...") : t("production.sendReport", "Send report")}
          </button>
        </div>
      </div>
    </div>
  );
}
