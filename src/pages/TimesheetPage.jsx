import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Clock, Play, Square, Pause, CalendarDays, Coffee,
  ChevronDown, ChevronRight, ChevronLeft, Users, AlertCircle,
  Search,
} from "lucide-react";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import {
  getMyTimesheet, getAllTimesheets, clockIn, clockOut, takeBreak, endBreak,
} from "../lib/hrApi";

// ─── Date helpers ──────────────────────────────────────────────────────────
function getWeekRange(offset = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
  };
}

function getDayDates(startStr, endStr) {
  const days = [];
  const d = new Date(startStr + "T12:00:00");
  const end = new Date(endStr + "T12:00:00");
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// ─── Main page ─────────────────────────────────────────────────────────────
export function TimesheetPage() {
  const { t } = useTranslation();
  const hasElevated = useAuthStore((s) => s.hasElevatedAccess());
  const [activeTab, setActiveTab] = useState(hasElevated ? "review" : "my");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-sky-600" />
          {t("hr.timesheet.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t("hr.timesheet.subtitle")}</p>
      </div>

      {/* Tab switcher */}
      {hasElevated && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "my" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t("hr.timesheet.myTimesheet", "My Timesheet")}
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === "review" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {t("hr.timesheet.payPeriodReview", "Pay Period Review")}
          </button>
        </div>
      )}

      {activeTab === "my" ? <MyTimesheetView /> : <TeamTimesheetReview />}
    </div>
  );
}

// ─── MY TIMESHEET (personal clock in/out) ──────────────────────────────────
function MyTimesheetView() {
  const { t } = useTranslation();
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("week");

  const { data, isLoading } = useQuery({
    queryKey: ["myTimesheet", user?.email, dateRange],
    queryFn: () => getMyTimesheet(user?.email, dateRange),
    enabled: authReady && !!user?.email,
  });

  const entries = data?.data?.entries || [];
  const activeEntry = data?.data?.activeEntry || null;
  const onBreak = data?.data?.onBreak || false;
  const summary = data?.data?.summary || {};

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["myTimesheet"] });

  const clockInMut = useMutation({
    mutationFn: () => clockIn(user?.email),
    onSuccess: () => { toast.success("Clocked in!"); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const clockOutMut = useMutation({
    mutationFn: () => clockOut(user?.email),
    onSuccess: () => { toast.success("Clocked out!"); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const takeBreakMut = useMutation({
    mutationFn: () => takeBreak(user?.email),
    onSuccess: () => { toast.success("Break started"); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const endBreakMut = useMutation({
    mutationFn: () => endBreak(user?.email),
    onSuccess: () => { toast.success("Break ended"); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const status = !activeEntry ? "not_clocked_in" : onBreak ? "on_break" : "working";

  return (
    <>
      {/* Status banner + action buttons */}
      <div className={`card p-5 border-l-4 ${
        status === "on_break"
          ? "border-l-amber-500 bg-amber-50/50"
          : status === "working"
            ? "border-l-emerald-500 bg-emerald-50/50"
            : "border-l-slate-300 bg-slate-50"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {status === "not_clocked_in" && (
              <p className="text-sm font-semibold text-slate-600">{t("hr.timesheet.notClockedIn")}</p>
            )}
            {status === "working" && (
              <>
                <p className="text-sm font-semibold text-emerald-800">
                  {t("hr.timesheet.workingSince")} {new Date(activeEntry.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {activeEntry.timesheet_breaks?.length > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeEntry.timesheet_breaks.length} {t("hr.timesheet.breaksTaken")}
                  </p>
                )}
              </>
            )}
            {status === "on_break" && (
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                <Coffee className="h-4 w-4" />
                {t("hr.timesheet.onBreak")}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {status === "not_clocked_in" && (
              <ActionBtn onClick={() => clockInMut.mutate()} loading={clockInMut.isPending} icon={Play} label={t("hr.timesheet.clockIn")} className="bg-emerald-600 hover:bg-emerald-700 text-white" />
            )}
            {status === "working" && (
              <>
                <ActionBtn onClick={() => takeBreakMut.mutate()} loading={takeBreakMut.isPending} icon={Pause} label={t("hr.timesheet.startBreak")} className="bg-amber-500 hover:bg-amber-600 text-white" />
                <ActionBtn onClick={() => clockOutMut.mutate()} loading={clockOutMut.isPending} icon={Square} label={t("hr.timesheet.clockOut")} className="bg-red-600 hover:bg-red-700 text-white" />
              </>
            )}
            {status === "on_break" && (
              <ActionBtn onClick={() => endBreakMut.mutate()} loading={endBreakMut.isPending} icon={Play} label={t("hr.timesheet.endBreak")} className="bg-sky-600 hover:bg-sky-700 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timesheet.thisWeek")}</p>
          <p className="text-2xl font-bold text-slate-900">{summary.weekHours || 0}h</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timesheet.payPeriod")}</p>
          <p className="text-2xl font-bold text-slate-900">{summary.periodHours || 0}h</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timesheet.breaks")}</p>
          <p className="text-2xl font-bold text-slate-500">{summary.breakMinutes || 0}m</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timesheet.overtime")}</p>
          <p className="text-2xl font-bold text-amber-700">{summary.overtimeHours || 0}h</p>
        </div>
      </div>

      {/* Date range toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ value: "week", label: t("hr.timesheet.thisWeekLabel") }, { value: "month", label: t("hr.timesheet.thisMonth") }].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setDateRange(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              dateRange === tab.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entries table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600"><CalendarDays className="h-4 w-4 inline mr-1" /> Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Clock In</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Clock Out</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Breaks</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Net Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 bg-slate-100 animate-pulse rounded" /></td></tr>
                ))
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">{t("hr.timesheet.noEntries")}</td></tr>
              ) : (
                entries.map((entry, i) => {
                  const breaks = entry.timesheet_breaks || [];
                  const breakMin = Number(entry.break_minutes || 0);
                  const netH = entry.net_hours != null ? Number(entry.net_hours) : (entry.hours != null ? Number(entry.hours) - breakMin / 60 : null);
                  return (
                    <tr key={entry.id || i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{fmtDate(entry.clock_in)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtTime(entry.clock_in)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {entry.clock_out ? fmtTime(entry.clock_out) : <span className="text-emerald-600 font-semibold">{t("hr.timesheet.active")}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">
                        {breaks.length > 0 ? <span className="text-xs">{breaks.length}x ({Math.round(breakMin)}m)</span> : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{netH != null ? `${netH.toFixed(1)}h` : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── TEAM TIMESHEET REVIEW (Homebase-style) ────────────────────────────────
function TeamTimesheetReview() {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedEmp, setExpandedEmp] = useState({});
  const [search, setSearch] = useState("");
  const [needsReviewFilter, setNeedsReviewFilter] = useState(false);

  const week = getWeekRange(weekOffset);

  const { data, isLoading } = useQuery({
    queryKey: ["allTimesheets", week.start, week.end],
    queryFn: () => getAllTimesheets(week.start, week.end),
  });

  const employees = useMemo(() => data?.data?.employees || [], [data]);
  const grandTotal = data?.data?.grandTotal || {};
  const days = getDayDates(week.start, week.end);

  const toggleExpand = (empId) => {
    setExpandedEmp((prev) => ({ ...prev, [empId]: !prev[empId] }));
  };

  // Filter employees
  const filtered = useMemo(() => {
    let list = employees;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => (e.employee_name || "").toLowerCase().includes(s));
    }
    if (needsReviewFilter) {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((e) => {
        // "Needs review" = has a No-Show day (scheduled PAST day but no timecard) or missing clock-out
        return e.entries.some((en) => !en.clock_out) ||
               e.schedules.some((s) => {
                 const dayStr = s.date;
                 return dayStr < today && !e.entries.some((en) => en.clock_in?.startsWith(dayStr));
               });
      });
    }
    return list;
  }, [employees, search, needsReviewFilter]);

  // Count needs-review
  const needsReviewCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return employees.filter((e) => {
      return e.entries.some((en) => !en.clock_out) ||
             e.schedules.some((s) => {
               const dayStr = s.date;
               return dayStr < today && !e.entries.some((en) => en.clock_in?.startsWith(dayStr));
             });
    }).length;
  }, [employees]);

  return (
    <>
      {/* Week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">{week.label}</span>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={weekOffset >= 0}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("hr.timesheet.filterByName", "Filter by name...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-48"
            />
          </div>
          {needsReviewCount > 0 && (
            <button
              onClick={() => setNeedsReviewFilter((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                needsReviewFilter
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {t("hr.timesheet.needsReview", "Needs review")}
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                {needsReviewCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Grand totals bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: t("hr.timesheet.timeCards", "Time Cards"), value: grandTotal.timeCards || 0, color: "text-slate-900" },
          { label: t("hr.timesheet.scheduledLabel", "Scheduled"), value: `${grandTotal.scheduledHours || 0}h`, color: "text-slate-600" },
          { label: t("hr.timesheet.totalPaid", "Total Paid"), value: `${grandTotal.totalHours || 0}h`, color: "text-slate-900" },
          { label: t("hr.timesheet.regularLabel", "Regular"), value: `${grandTotal.regularHours || 0}h`, color: "text-slate-900" },
          { label: t("hr.timesheet.unpaidBreaks", "Unpaid Breaks"), value: `${grandTotal.breakMinutes || 0}m`, color: "text-slate-500" },
          { label: t("hr.timesheet.otHours", "OT Hours"), value: `${grandTotal.overtimeHours || 0}h`, color: "text-amber-700" },
        ].map((item, i) => (
          <div key={i} className="card px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Employee accordion table */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_repeat(6,1fr)] gap-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 bg-slate-50 px-4 py-2.5 hidden md:grid">
          <div>{t("hr.timesheet.employeeCol", "Employee")}</div>
          <div className="text-center">{t("hr.timesheet.scheduledLabel", "Scheduled")}</div>
          <div className="text-center">{t("hr.timesheet.totalPaid", "Total Paid")}</div>
          <div className="text-center">{t("hr.timesheet.regularLabel", "Regular")}</div>
          <div className="text-center">{t("hr.timesheet.unpaidBreaks", "Breaks")}</div>
          <div className="text-center">{t("hr.timesheet.otHours", "OT")}</div>
          <div className="text-center">{t("hr.timesheet.timeCards", "Cards")}</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">{t("status.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {t("hr.timesheet.noEmployees", "No employees found")}
          </div>
        ) : (
          filtered.map((emp) => {
            const isOpen = expandedEmp[emp.emp_id];
            const noShows = emp.schedules.filter((s) => {
              const dayStr = s.date;
              return !emp.entries.some((en) => en.clock_in?.startsWith(dayStr));
            });
            const hasIssues = noShows.length > 0 || emp.entries.some((en) => !en.clock_out);
            const initials = (emp.employee_name || "??").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

            return (
              <div key={emp.emp_id} className="border-b border-slate-100 last:border-b-0">
                {/* Employee summary row */}
                <button
                  onClick={() => toggleExpand(emp.emp_id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="grid grid-cols-[2fr_repeat(6,1fr)] gap-0 items-center hidden md:grid">
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate flex items-center gap-1.5">
                          {emp.employee_name}
                          {hasIssues && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                          {emp.activeEntry && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {emp.summary.timeCards} {t("hr.timesheet.timeCards", "Time Cards")}
                        </p>
                      </div>
                    </div>
                    <div className="text-center text-sm text-slate-600">{emp.summary.scheduledHours}h</div>
                    <div className="text-center text-sm font-semibold text-slate-900">{emp.summary.totalHours}h</div>
                    <div className="text-center text-sm text-slate-900">{emp.summary.regularHours}h</div>
                    <div className="text-center text-sm text-slate-500">{emp.summary.breakMinutes}m</div>
                    <div className="text-center text-sm text-amber-700">{emp.summary.overtimeHours}h</div>
                    <div className="text-center text-sm text-slate-600">{emp.summary.timeCards}</div>
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate flex items-center gap-1.5">
                        {emp.employee_name}
                        {hasIssues && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                      </p>
                      <p className="text-xs text-slate-500">
                        {emp.summary.totalHours}h paid · {emp.summary.timeCards} cards
                      </p>
                    </div>
                  </div>
                </button>

                {/* Expanded: day-by-day breakdown */}
                {isOpen && (
                  <div className="bg-slate-50/50 border-t border-slate-100">
                    <EmployeeDayBreakdown emp={emp} days={days} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Grand totals row */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-[2fr_repeat(6,1fr)] gap-0 items-center px-4 py-3 bg-slate-100 border-t border-slate-200 hidden md:grid">
            <div className="font-bold text-sm text-slate-900 pl-11">Totals</div>
            <div className="text-center text-sm font-bold text-slate-700">{grandTotal.scheduledHours}h</div>
            <div className="text-center text-sm font-bold text-slate-900">{grandTotal.totalHours}h</div>
            <div className="text-center text-sm font-bold text-slate-900">{grandTotal.regularHours}h</div>
            <div className="text-center text-sm font-bold text-slate-500">{grandTotal.breakMinutes}m</div>
            <div className="text-center text-sm font-bold text-amber-700">{grandTotal.overtimeHours}h</div>
            <div className="text-center text-sm font-bold text-slate-600">{grandTotal.timeCards}</div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Day-by-day breakdown for an employee ──────────────────────────────────
function EmployeeDayBreakdown({ emp, days }) {
  const { t } = useTranslation();

  return (
    <div className="divide-y divide-slate-100">
      {days.map((day) => {
        const dayStr = day.toISOString().slice(0, 10);
        const dayEntries = emp.entries.filter((e) => e.clock_in?.startsWith(dayStr));
        const schedule = emp.schedules.find((s) => s.date === dayStr);
        const isScheduled = !!schedule;
        const today = new Date().toISOString().slice(0, 10);
        const hasNoShow = isScheduled && dayEntries.length === 0 && dayStr < today;

        // Calculate scheduled hours for this day
        let scheduledH = 0;
        if (schedule?.start_time && schedule?.end_time) {
          const [sh, sm] = schedule.start_time.split(":").map(Number);
          const [eh, em] = schedule.end_time.split(":").map(Number);
          scheduledH = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        }

        const dayTotalH = dayEntries.reduce((s, e) => s + (Number(e.net_hours || e.hours) || 0), 0);
        const dayBreakMin = dayEntries.reduce((s, e) => s + (Number(e.break_minutes) || 0), 0);

        if (dayEntries.length === 0 && !isScheduled) {
          return null; // Skip days with no activity and no schedule
        }

        return (
          <div key={dayStr} className="px-4 py-2.5">
            {/* Day header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                {hasNoShow && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> No-Show
                  </span>
                )}
                {isScheduled && dayEntries.length === 0 && !hasNoShow && dayStr >= today && (
                  <span className="text-[10px] font-medium text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                    {t("hr.timesheet.upcoming", "Upcoming")}
                  </span>
                )}
                {isScheduled && (
                  <span className="text-[10px] text-slate-400">
                    {t("hr.timesheet.scheduled", "Scheduled")}: {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                    {scheduledH > 0 && ` (${scheduledH.toFixed(1)}h)`}
                  </span>
                )}
              </div>
              {dayTotalH > 0 && (
                <span className="text-xs font-bold text-slate-900">
                  {dayTotalH.toFixed(1)}h
                  {dayBreakMin > 0 && <span className="text-slate-400 font-normal"> · {dayBreakMin}m break</span>}
                </span>
              )}
            </div>

            {/* Time card entries for this day */}
            {dayEntries.length > 0 ? (
              <div className="space-y-1.5 ml-2">
                {dayEntries.map((entry, idx) => {
                  const breaks = entry.timesheet_breaks || [];
                  const netH = entry.net_hours != null ? Number(entry.net_hours) : (entry.hours != null ? Number(entry.hours) - (Number(entry.break_minutes) || 0) / 60 : null);
                  const isActive = !entry.clock_out;

                  return (
                    <div
                      key={entry.id || idx}
                      className={`flex items-center gap-3 text-xs rounded-lg px-3 py-2 ${
                        isActive ? "bg-emerald-50 border border-emerald-200" : "bg-white border border-slate-100"
                      }`}
                    >
                      <span className="text-slate-600 min-w-[80px]">
                        {fmtTime(entry.clock_in)} – {isActive ? <span className="text-emerald-600 font-semibold">{t("hr.timesheet.active")}</span> : fmtTime(entry.clock_out)}
                      </span>

                      {breaks.length > 0 && (
                        <span className="text-slate-400">
                          {breaks.length}x break ({Math.round(Number(entry.break_minutes) || 0)}m)
                        </span>
                      )}

                      <span className="ml-auto font-semibold text-slate-900">
                        {netH != null ? `${netH.toFixed(1)}h` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : hasNoShow ? (
              <div className="ml-2 text-xs text-red-500 italic py-1">
                {t("hr.timesheet.noShowMsg", "Scheduled but did not clock in")}
              </div>
            ) : isScheduled && dayStr >= today ? (
              <div className="ml-2 text-xs text-slate-400 italic py-1">
                {t("hr.timesheet.upcomingShift", "Upcoming shift")}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared action button ──────────────────────────────────────────────────
function ActionBtn({ onClick, loading, icon: Icon, label, className }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition ${className}`}
    >
      <Icon className="h-4 w-4" />
      {loading ? "..." : label}
    </button>
  );
}
