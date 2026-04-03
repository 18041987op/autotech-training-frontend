import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Play, Square, CalendarDays } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getMyTimesheet, clockIn, clockOut } from "../lib/hrApi";

export function TimesheetPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState("week"); // week | month

  const { data, isLoading } = useQuery({
    queryKey: ["myTimesheet", user?.email, dateRange],
    queryFn: () => getMyTimesheet(user?.email, dateRange),
    enabled: !!user?.email,
  });

  const entries = data?.data?.entries || [];
  const activeEntry = data?.data?.activeEntry || null;
  const summary = data?.data?.summary || {};

  const clockInMutation = useMutation({
    mutationFn: () => clockIn(user?.email),
    onSuccess: () => {
      toast.success("Clocked in!");
      queryClient.invalidateQueries({ queryKey: ["myTimesheet"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => clockOut(user?.email),
    onSuccess: () => {
      toast.success("Clocked out!");
      queryClient.invalidateQueries({ queryKey: ["myTimesheet"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-sky-600" />
            Timesheet
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track your work hours</p>
        </div>

        {/* Clock in/out button */}
        <div>
          {activeEntry ? (
            <button
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              {clockOutMutation.isPending ? "..." : "Clock Out"}
            </button>
          ) : (
            <button
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {clockInMutation.isPending ? "..." : "Clock In"}
            </button>
          )}
        </div>
      </div>

      {/* Active shift indicator */}
      {activeEntry && (
        <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50">
          <p className="text-sm font-semibold text-emerald-800">
            Currently clocked in since {new Date(activeEntry.clock_in).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">This Week</p>
          <p className="text-2xl font-bold text-slate-900">{summary.weekHours || 0}h</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">This Pay Period</p>
          <p className="text-2xl font-bold text-slate-900">{summary.periodHours || 0}h</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">Overtime</p>
          <p className="text-2xl font-bold text-amber-700">{summary.overtimeHours || 0}h</p>
        </div>
      </div>

      {/* Date range toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ value: "week", label: "This Week" }, { value: "month", label: "This Month" }].map((tab) => (
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
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    No timesheet entries for this period
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {new Date(entry.date || entry.clock_in).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(entry.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.clock_out
                        ? new Date(entry.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : <span className="text-emerald-600 font-semibold">Active</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {entry.hours != null ? `${Number(entry.hours).toFixed(1)}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
