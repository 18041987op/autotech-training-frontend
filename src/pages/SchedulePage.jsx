import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, X, Save } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getMySchedule, getAllSchedules, getTeamDirectory, saveScheduleEntry, deleteScheduleEntry } from "../lib/hrApi";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function SchedulePage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCell, setEditingCell] = useState(null); // { empId, date }
  const [editForm, setEditForm] = useState({ start_time: "08:00", end_time: "17:00" });

  const weekDates = getWeekDates(weekOffset);
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);

  // Admin: fetch all employees' schedules + team list
  const { data: allSchedulesData, isLoading: loadingAll } = useQuery({
    queryKey: ["allSchedules", startDate, endDate],
    queryFn: () => getAllSchedules(startDate, endDate),
    enabled: isAdmin,
  });

  const { data: teamData } = useQuery({
    queryKey: ["teamDirectory", false],
    queryFn: () => getTeamDirectory(false),
    enabled: isAdmin,
  });

  // Employee: fetch own schedule
  const { data: myData, isLoading: loadingMy } = useQuery({
    queryKey: ["mySchedule", user?.email, startDate, endDate],
    queryFn: () => getMySchedule(user?.email, startDate, endDate),
    enabled: !isAdmin && !!user?.email,
  });

  const activeEmployees = teamData?.data || [];
  const allSchedules = useMemo(() => allSchedulesData?.data || [], [allSchedulesData]);
  const mySchedules = useMemo(() => myData?.data || [], [myData]);

  // Group schedules by emp_id → date
  const scheduleMap = useMemo(() => {
    const map = {};
    const src = isAdmin ? allSchedules : mySchedules;
    src.forEach((s) => {
      const key = `${s.emp_id}|${s.date}`;
      map[key] = s;
    });
    return map;
  }, [isAdmin, allSchedules, mySchedules]);

  const getShift = (empId, dateStr) => scheduleMap[`${empId}|${dateStr}`] || null;

  const saveMut = useMutation({
    mutationFn: (entry) => saveScheduleEntry(entry),
    onSuccess: () => {
      toast.success("Schedule saved");
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] });
      setEditingCell(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: ({ empId, date }) => deleteScheduleEntry(empId, date),
    onSuccess: () => {
      toast.success("Shift removed");
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCellClick = (empId, dateStr) => {
    if (!isAdmin) return;
    const existing = getShift(empId, dateStr);
    setEditForm({
      start_time: existing?.start_time || "08:00",
      end_time: existing?.end_time || "17:00",
    });
    setEditingCell({ empId, date: dateStr });
  };

  const handleSave = () => {
    if (!editingCell) return;
    saveMut.mutate({
      emp_id: editingCell.empId,
      date: editingCell.date,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
    });
  };

  const isLoading = isAdmin ? loadingAll : loadingMy;

  // ─── Employee view (own schedule only) ───────────────────────────
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-sky-600" />
            My Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">Your weekly work schedule</p>
        </div>
        <WeekNav weekDates={weekDates} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().slice(0, 10);
            const shift = mySchedules.find((s) => s.date === dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`card p-3 text-center ${isToday ? "ring-2 ring-sky-500/30" : ""}`}>
                <p className={`text-xs font-bold ${isToday ? "text-sky-600" : "text-slate-400"}`}>{DAYS[i]}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{date.getDate()}</p>
                {isLoading ? (
                  <div className="h-4 bg-slate-100 animate-pulse rounded mt-2" />
                ) : shift ? (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {shift.start_time} – {shift.end_time}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-300 mt-2">Off</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Admin view (all employees, inline editing) ──────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-sky-600" />
          Team Schedule
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Click any cell to assign or edit a shift
        </p>
      </div>

      <WeekNav weekDates={weekDates} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />

      {/* Schedule grid: rows = employees, cols = days */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[160px]">
                  Employee
                </th>
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <th key={i} className={`text-center px-2 py-3 font-semibold min-w-[110px] ${isToday ? "text-sky-600 bg-sky-50/50" : "text-slate-600"}`}>
                      <div className="text-[10px] uppercase">{DAYS[i]}</div>
                      <div className="text-sm">{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3"><div className="h-8 bg-slate-100 animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : activeEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">No active employees found</td>
                </tr>
              ) : (
                activeEmployees.map((emp) => (
                  <tr key={emp.emp_id} className="hover:bg-slate-50/30">
                    <td className="px-4 py-2 font-medium text-slate-900 sticky left-0 bg-white">
                      <div className="truncate max-w-[150px]">{emp.employee_name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{emp.role}</div>
                    </td>
                    {weekDates.map((date, i) => {
                      const dateStr = date.toISOString().slice(0, 10);
                      const shift = getShift(emp.emp_id, dateStr);
                      const isEditing = editingCell?.empId === emp.emp_id && editingCell?.date === dateStr;
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <td
                          key={i}
                          className={`px-1 py-1 text-center cursor-pointer transition-colors ${
                            isToday ? "bg-sky-50/30" : ""
                          } ${isEditing ? "bg-sky-100/50" : "hover:bg-slate-100"}`}
                          onClick={() => !isEditing && handleCellClick(emp.emp_id, dateStr)}
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="time"
                                value={editForm.start_time}
                                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                className="w-full text-xs px-1 py-0.5 rounded border border-slate-300 text-center"
                              />
                              <input
                                type="time"
                                value={editForm.end_time}
                                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                className="w-full text-xs px-1 py-0.5 rounded border border-slate-300 text-center"
                              />
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={handleSave}
                                  disabled={saveMut.isPending}
                                  className="p-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                  title="Save"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                {shift && (
                                  <button
                                    onClick={() => deleteMut.mutate({ empId: emp.emp_id, date: dateStr })}
                                    disabled={deleteMut.isPending}
                                    className="p-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                                    title="Remove shift"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingCell(null)}
                                  className="p-0.5 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : shift ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {shift.start_time}–{shift.end_time}
                            </span>
                          ) : (
                            <span className="text-slate-200 text-lg leading-none">+</span>
                          )}
                        </td>
                      );
                    })}
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

function WeekNav({ weekDates, weekOffset, setWeekOffset }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setWeekOffset((o) => o - 1)} className="btn-outline-sm px-2">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-slate-700">
        {weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </span>
      <button onClick={() => setWeekOffset((o) => o + 1)} className="btn-outline-sm px-2">
        <ChevronRight className="h-4 w-4" />
      </button>
      {weekOffset !== 0 && (
        <button onClick={() => setWeekOffset(0)} className="text-xs text-sky-600 hover:underline">Today</button>
      )}
    </div>
  );
}
