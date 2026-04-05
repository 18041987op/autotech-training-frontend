import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Clock, Play, Square, Pause, CalendarDays, Coffee } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getMyTimesheet, clockIn, clockOut, takeBreak, endBreak } from "../lib/hrApi";

export function TimesheetPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("week");

  const { data, isLoading } = useQuery({
    queryKey: ["myTimesheet", user?.email, dateRange],
    queryFn: () => getMyTimesheet(user?.email, dateRange),
    enabled: !!user?.email,
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

  // State machine: not_clocked_in → working → on_break → working → ...
  const status = !activeEntry ? "not_clocked_in" : onBreak ? "on_break" : "working";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-sky-600" />
          {t("hr.timesheet.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t("hr.timesheet.subtitle")}</p>
      </div>

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
              <ActionBtn
                onClick={() => clockInMut.mutate()}
                loading={clockInMut.isPending}
                icon={Play}
                label={t("hr.timesheet.clockIn")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              />
            )}
            {status === "working" && (
              <>
                <ActionBtn
                  onClick={() => takeBreakMut.mutate()}
                  loading={takeBreakMut.isPending}
                  icon={Pause}
                  label={t("hr.timesheet.startBreak")}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                />
                <ActionBtn
                  onClick={() => clockOutMut.mutate()}
                  loading={clockOutMut.isPending}
                  icon={Square}
                  label={t("hr.timesheet.clockOut")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                />
              </>
            )}
            {status === "on_break" && (
              <ActionBtn
                onClick={() => endBreakMut.mutate()}
                loading={endBreakMut.isPending}
                icon={Play}
                label={t("hr.timesheet.endBreak")}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              />
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
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  <CalendarDays className="h-4 w-4 inline mr-1" /> Date
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Clock In</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Clock Out</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Breaks</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Net Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    {t("hr.timesheet.noEntries")}
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => {
                  const breaks = entry.timesheet_breaks || [];
                  const breakMin = Number(entry.break_minutes || 0);
                  const netH = entry.net_hours != null ? Number(entry.net_hours) : (entry.hours != null ? Number(entry.hours) - breakMin / 60 : null);
                  return (
                    <tr key={entry.id || i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {new Date(entry.clock_in).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(entry.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entry.clock_out
                          ? new Date(entry.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : <span className="text-emerald-600 font-semibold">{t("hr.timesheet.active")}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">
                        {breaks.length > 0
                          ? <span className="text-xs">{breaks.length}x ({Math.round(breakMin)}m)</span>
                          : <span className="text-xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {netH != null ? `${netH.toFixed(1)}` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
