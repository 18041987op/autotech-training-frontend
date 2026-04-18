import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Play, Square, Coffee, Camera,
} from "lucide-react";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { getMyTimesheet, clockIn, clockOut, takeBreak, endBreak } from "../lib/hrApi";
import { QRScanner } from "./QRScanner";
import { getTool } from "../lib/toolsApi";

/**
 * QuickActions — persistent action strip at the top of the app.
 * Shows timesheet state-machine button + QR scanner button.
 * Always visible so employees don't have to navigate to the Timesheet page.
 */
export function QuickActions() {
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [qrOpen, setQrOpen] = useState(false);

  // Fetch current timesheet status (lightweight — just need activeEntry + onBreak)
  // Wait for auth hydration so `user.email` is available on first render after navigation.
  const { data } = useQuery({
    queryKey: ["myTimesheet", user?.email, "week"],
    queryFn: () => getMyTimesheet(user?.email, "week"),
    enabled: authReady && !!user?.email,
    refetchInterval: 60_000, // refresh every minute to keep state fresh
  });

  const activeEntry = data?.data?.activeEntry || null;
  const onBreak = data?.data?.onBreak || false;
  const status = !activeEntry ? "idle" : onBreak ? "break" : "working";

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

  // Elapsed time display
  const elapsed = activeEntry
    ? getElapsed(activeEntry.clock_in)
    : null;

  // QR scan handler — handles both tool QR codes and cabinet door QR codes
  const handleQRScan = async (text) => {
    setQrOpen(false);
    try {
      // Cabinet door QR: URL contains /cabinet/door/{doorCode}/access
      const cabinetMatch = text.match(/\/cabinet\/door\/([^/]+)\/access/);
      if (cabinetMatch) {
        const doorCode = cabinetMatch[1];
        navigate(`/cabinet/door/${doorCode}/access`);
        return;
      }

      // Tool QR: UUID directly or URL ending in a UUID
      const toolId = text.includes("/") ? text.split("/").pop() : text;
      const data = await getTool(toolId);
      if (data?.data) {
        toast.success(`Found: ${data.data.name}`);
        navigate(`/tools/${toolId}`);
      } else {
        toast.error("Tool not found");
      }
    } catch {
      toast.error("Could not find that tool");
    }
  };

  const anyPending =
    clockInMut.isPending || clockOutMut.isPending ||
    takeBreakMut.isPending || endBreakMut.isPending;

  // Show a shimmer placeholder while auth is hydrating from localStorage.
  // Without this, the component would flash "Clock In" for users who are
  // actually on break or clocked in, because user is null → query disabled → status defaults to "idle".
  // Also show shimmer while the timesheet query is still loading for the first time.
  const isHydrating = !authReady;

  return (
    <>
      <div className="sticky top-0 z-[19] border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between gap-2 px-3 py-2">

          {/* ── Timesheet actions ─────────────────────── */}
          <div className="flex items-center gap-2 min-w-0">
            {isHydrating && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-medium animate-pulse">
                <span className="w-3 h-3 rounded-full bg-slate-300" />
                Loading...
              </span>
            )}

            {!isHydrating && status === "idle" && (
              <button
                onClick={() => clockInMut.mutate()}
                disabled={anyPending}
                className="qa-btn bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{clockInMut.isPending ? "..." : "Clock In"}</span>
              </button>
            )}

            {!isHydrating && status === "working" && (
              <>
                {/* Elapsed badge */}
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {elapsed}
                </span>

                <button
                  onClick={() => takeBreakMut.mutate()}
                  disabled={anyPending}
                  className="qa-btn bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>{takeBreakMut.isPending ? "..." : "Break"}</span>
                </button>

                <button
                  onClick={() => clockOutMut.mutate()}
                  disabled={anyPending}
                  className="qa-btn bg-red-600 hover:bg-red-700 text-white"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>{clockOutMut.isPending ? "..." : "Clock Out"}</span>
                </button>
              </>
            )}

            {!isHydrating && status === "break" && (
              <>
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  <Coffee className="h-3 w-3" />
                  On Break
                </span>

                <button
                  onClick={() => endBreakMut.mutate()}
                  disabled={anyPending}
                  className="qa-btn bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{endBreakMut.isPending ? "..." : "End Break"}</span>
                </button>

                <button
                  onClick={() => clockOutMut.mutate()}
                  disabled={anyPending}
                  className="qa-btn bg-red-600 hover:bg-red-700 text-white"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>{clockOutMut.isPending ? "..." : "Clock Out"}</span>
                </button>
              </>
            )}
          </div>

          {/* ── QR Scanner button ─────────────────────── */}
          <button
            onClick={() => setQrOpen(true)}
            className="qa-btn bg-sky-600 hover:bg-sky-700 text-white flex-shrink-0"
            title="Scan Tool QR"
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        </div>
      </div>

      {/* QR Scanner overlay */}
      {qrOpen && <QRScanner onScan={handleQRScan} onClose={() => setQrOpen(false)} />}
    </>
  );
}

/** Calculate elapsed HH:MM from a clock-in timestamp */
function getElapsed(clockInStr) {
  const diff = Date.now() - new Date(clockInStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
