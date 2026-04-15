import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  CalendarDays, ChevronLeft, ChevronRight, X, Save,
  CheckCircle, ShieldCheck, Lock
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
  getMySchedule, getAllSchedules, getTeamDirectory,
  saveScheduleEntry, deleteScheduleEntry, approveSchedules,
  getShopHours
} from "../lib/hrApi";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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

/** Build 15-min time slots between open and close */
function buildTimeOptions(open, close) {
  if (!open || !close) return [];
  const opts = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let t = oh * 60 + om;
  const end = ch * 60 + cm;
  while (t <= end) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    t += 15;
  }
  return opts;
}

/** Format "08:00" → "8:00 AM" */
function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function SchedulePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCell, setEditingCell] = useState(null); // { empId, date }
  const [editForm, setEditForm] = useState({ start_time: "", end_time: "" });

  const weekDates = getWeekDates(weekOffset);
  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);

  // ─── Shop hours ─────────────────────────────────────────────────
  const { data: shopData } = useQuery({
    queryKey: ["shopHours"],
    queryFn: getShopHours,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
  const shopHours = shopData?.data?.hours || {};

  // Helper: get shop open/close for a given day index (0=Sun..6=Sat)
  const getShopDay = (dayIndex) => {
    const key = DAY_KEYS[dayIndex];
    const h = shopHours[key];
    if (!h || !h.open || !h.close) return null; // closed
    return h;
  };

  // ─── Admin queries ──────────────────────────────────────────────
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

  // ─── Employee query ─────────────────────────────────────────────
  const { data: myData, isLoading: loadingMy } = useQuery({
    queryKey: ["mySchedule", user?.email, startDate, endDate],
    queryFn: () => getMySchedule(user?.email, startDate, endDate),
    enabled: !isAdmin && !!user?.email,
  });

  const activeEmployees = teamData?.data || [];
  const allSchedules = useMemo(() => allSchedulesData?.data || [], [allSchedulesData]);
  const mySchedules = useMemo(() => myData?.data || [], [myData]);

  // ─── Schedule map: empId|date → entry ───────────────────────────
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

  // ─── Count unapproved entries this week ─────────────────────────
  const unapprovedCount = useMemo(() => {
    if (!isAdmin) return 0;
    return allSchedules.filter((s) => !s.approved).length;
  }, [isAdmin, allSchedules]);

  // ─── Mutations ──────────────────────────────────────────────────
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

  const approveMut = useMutation({
    mutationFn: (payload) => approveSchedules(payload),
    onSuccess: (_, variables) => {
      const count = variables.ids?.length || "all";
      toast.success(`${count} schedule(s) approved`);
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCellClick = (empId, dateStr, dayIdx) => {
    if (!isAdmin) return;
    const shopDay = getShopDay(dayIdx);
    if (!shopDay) return; // can't schedule on closed day
    const existing = getShift(empId, dateStr);
    setEditForm({
      start_time: existing?.start_time || shopDay.open,
      end_time: existing?.end_time || shopDay.close,
    });
    setEditingCell({ empId, date: dateStr, dayIdx });
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

  const handleApproveWeek = () => {
    approveMut.mutate({
      approve_week: true,
      approved: true,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const isLoading = isAdmin ? loadingAll : loadingMy;

  // ─── EMPLOYEE VIEW (approved only, read-only) ──────────────────
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-sky-600" />
            {t("hr.schedule.mySchedule")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("hr.schedule.yourApprovedSchedule")}</p>
        </div>

        <WeekNav weekDates={weekDates} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().slice(0, 10);
            const shift = mySchedules.find((s) => s.date === dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            const shopDay = getShopDay(i);
            const isClosed = !shopDay;

            return (
              <div
                key={i}
                className={`card p-3 text-center transition-colors ${
                  isClosed
                    ? "bg-slate-100/70 opacity-50"
                    : isToday
                      ? "ring-2 ring-sky-500/30"
                      : ""
                }`}
              >
                <p className={`text-xs font-bold ${
                  isClosed ? "text-slate-300" : isToday ? "text-sky-600" : "text-slate-400"
                }`}>
                  {t(`hr.schedule.days.${DAY_KEYS[i]}`)}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${isClosed ? "text-slate-300" : "text-slate-900"}`}>
                  {date.getDate()}
                </p>
                {isClosed ? (
                  <p className="text-[10px] text-slate-300 mt-2 flex items-center justify-center gap-0.5">
                    <Lock className="h-2.5 w-2.5" /> {t("hr.schedule.closed")}
                  </p>
                ) : isLoading ? (
                  <div className="h-4 bg-slate-100 animate-pulse rounded mt-2" />
                ) : shift ? (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {fmt12(shift.start_time)} – {fmt12(shift.end_time)}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-300 mt-2">{t("hr.schedule.off")}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Shop hours legend */}
        <ShopHoursLegend shopHours={shopHours} />
      </div>
    );
  }

  // ─── ADMIN VIEW (all employees, inline editing, approval) ──────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-sky-600" />
            {t("hr.schedule.teamSchedule")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("hr.schedule.assignmentInstructions")}
          </p>
        </div>

        {/* Approve week button */}
        {unapprovedCount > 0 && (
          <button
            onClick={handleApproveWeek}
            disabled={approveMut.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                       bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            {approveMut.isPending ? t("hr.schedule.approving") : `${t("hr.schedule.approveWeek")} (${unapprovedCount})`}
          </button>
        )}
      </div>

      <WeekNav weekDates={weekDates} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />

      {/* Schedule grid */}
      <div className="card overflow-hidden border-2 border-slate-200 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-50">
                <th className="text-left px-5 py-4 font-bold text-slate-700 sticky left-0 bg-slate-50 min-w-[180px] z-10 border-r-2 border-slate-200 text-base">
                  Employee
                </th>
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const shopDay = getShopDay(i);
                  const isClosed = !shopDay;
                  return (
                    <th
                      key={i}
                      className={`text-center px-3 py-4 font-bold min-w-[140px] border-r border-slate-200 last:border-r-0 ${
                        isClosed
                          ? "bg-slate-100 text-slate-400"
                          : isToday
                            ? "text-sky-600 bg-sky-50/50"
                            : "text-slate-700"
                      }`}
                    >
                      <div className="text-xs uppercase font-extrabold tracking-wider">{t(`hr.schedule.days.${DAY_KEYS[i]}`)}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      {isClosed ? (
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Lock className="h-2.5 w-2.5" /> {t("hr.schedule.closed")}
                        </div>
                      ) : shopDay ? (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {fmt12(shopDay.open)}–{fmt12(shopDay.close)}
                        </div>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-8 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : activeEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No active employees found
                  </td>
                </tr>
              ) : (
                activeEmployees.map((emp) => (
                  <tr key={emp.emp_id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-semibold text-slate-900 sticky left-0 bg-white z-10 border-r-2 border-slate-200">
                      <div className="truncate max-w-[170px] text-base">{emp.employee_name}</div>
                      <div className="text-xs text-slate-400 capitalize">{emp.role}</div>
                    </td>
                    {weekDates.map((date, i) => {
                      const dateStr = date.toISOString().slice(0, 10);
                      const shift = getShift(emp.emp_id, dateStr);
                      const isEditing = editingCell?.empId === emp.emp_id && editingCell?.date === dateStr;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const shopDay = getShopDay(i);
                      const isClosed = !shopDay;

                      // Closed day cell
                      if (isClosed) {
                        return (
                          <td key={i} className="px-2 py-3 text-center bg-slate-100/60 border-r border-slate-200 last:border-r-0">
                            <span className="text-slate-300 text-base">—</span>
                          </td>
                        );
                      }

                      const timeOpts = buildTimeOptions(shopDay?.open, shopDay?.close);

                      return (
                        <td
                          key={i}
                          className={`px-2 py-3 text-center cursor-pointer transition-colors border-r border-slate-200 last:border-r-0 ${
                            isToday ? "bg-sky-50/40" : ""
                          } ${isEditing ? "bg-sky-100/50" : "hover:bg-slate-100"}`}
                          onClick={() => !isEditing && handleCellClick(emp.emp_id, dateStr, i)}
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                              <TimeSelect
                                value={editForm.start_time}
                                options={timeOpts}
                                onChange={(v) => setEditForm({ ...editForm, start_time: v })}
                                label="Start"
                              />
                              <TimeSelect
                                value={editForm.end_time}
                                options={timeOpts}
                                onChange={(v) => setEditForm({ ...editForm, end_time: v })}
                                label="End"
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
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-sm font-bold px-2 py-1 rounded-lg whitespace-nowrap ${
                                shift.approved
                                  ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                                  : "text-amber-700 bg-amber-100 border border-amber-200"
                              }`}>
                                {fmt12(shift.start_time)}–{fmt12(shift.end_time)}
                              </span>
                              {shift.approved ? (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <span className="text-[10px] text-amber-500 font-semibold">{t("hr.schedule.draft")}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-200 text-xl leading-none">+</span>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300" />
          {t("hr.schedule.approved")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300" />
          {t("hr.schedule.draftLegend")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-200/60 border border-slate-300" />
          {t("hr.schedule.shopClosedLegend")}
        </span>
      </div>

      <ShopHoursLegend shopHours={shopHours} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function WeekNav({ weekDates, weekOffset, setWeekOffset }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setWeekOffset((o) => o - 1)} className="btn-outline-sm px-2">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-slate-700">
        {weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
        {weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </span>
      <button onClick={() => setWeekOffset((o) => o + 1)} className="btn-outline-sm px-2">
        <ChevronRight className="h-4 w-4" />
      </button>
      {weekOffset !== 0 && (
        <button onClick={() => setWeekOffset(0)} className="text-xs text-sky-600 hover:underline">
          {t("hr.schedule.today")}
        </button>
      )}
    </div>
  );
}

/** Dropdown time selector with 15-min slots from shop hours */
function TimeSelect({ value, options, onChange, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-[11px] px-1 py-1 rounded border border-slate-300 bg-white text-center appearance-none"
      title={label}
    >
      {options.map((t) => (
        <option key={t} value={t}>{fmt12(t)}</option>
      ))}
    </select>
  );
}

/** Shows the shop's weekly operating hours at the bottom */
function ShopHoursLegend({ shopHours }) {
  const { t } = useTranslation();
  if (!shopHours || Object.keys(shopHours).length === 0) return null;
  const labels = { mon: t("hr.schedule.days.mon"), tue: t("hr.schedule.days.tue"), wed: t("hr.schedule.days.wed"), thu: t("hr.schedule.days.thu"), fri: t("hr.schedule.days.fri"), sat: t("hr.schedule.days.sat"), sun: t("hr.schedule.days.sun") };
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-slate-500 mb-2">{t("hr.schedule.shopHours")}</p>
      <div className="flex flex-wrap gap-3">
        {order.map((key) => {
          const h = shopHours[key];
          const isClosed = !h?.open || !h?.close;
          return (
            <div
              key={key}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isClosed ? "bg-slate-100 text-slate-400" : "bg-sky-50 text-sky-700"
              }`}
            >
              <span className="font-bold">{labels[key]}</span>{" "}
              {isClosed ? t("hr.schedule.closed") : `${fmt12(h.open)} – ${fmt12(h.close)}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
