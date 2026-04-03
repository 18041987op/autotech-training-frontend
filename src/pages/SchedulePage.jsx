import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getMySchedule } from "../lib/hrApi";

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
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);

  const startDate = weekDates[0].toISOString().slice(0, 10);
  const endDate = weekDates[6].toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ["mySchedule", user?.email, startDate, endDate],
    queryFn: () => getMySchedule(user?.email, startDate, endDate),
    enabled: !!user?.email,
  });

  const shifts = data?.data || [];

  const getShiftForDate = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return shifts.find((s) => s.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-sky-600" />
          Schedule
        </h1>
        <p className="text-sm text-slate-500 mt-1">Your weekly work schedule</p>
      </div>

      {/* Week navigator */}
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
          <button onClick={() => setWeekOffset(0)} className="text-xs text-sky-600 hover:underline">
            Today
          </button>
        )}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const shift = getShiftForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className={`card p-3 text-center ${isToday ? "ring-2 ring-sky-500/30" : ""}`}
            >
              <p className={`text-xs font-bold ${isToday ? "text-sky-600" : "text-slate-400"}`}>
                {DAYS[i]}
              </p>
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
