import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarOff, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getMyTimeOff, requestTimeOff, getTimeOffBalance } from "../lib/hrApi";

const REQUEST_TYPES = [
  { value: "vacation", label: "Vacation" },
  { value: "sick", label: "Sick" },
  { value: "personal", label: "Personal" },
  { value: "unpaid", label: "Unpaid" },
];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export function TimeOffPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["myTimeOff", user?.email],
    queryFn: () => getMyTimeOff(user?.email),
    enabled: !!user?.email,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["timeOffBalance", user?.email],
    queryFn: () => getTimeOffBalance(user?.email),
    enabled: !!user?.email,
  });

  const requests = requestsData?.data || [];
  const balance = balanceData?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarOff className="h-6 w-6 text-sky-600" />
            Time Off
          </h1>
          <p className="text-sm text-slate-500 mt-1">Request and track your time off</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> Request Time Off
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">Vacation</p>
          <p className="text-2xl font-bold text-sky-700">{balance.vacation_remaining ?? "—"}</p>
          <p className="text-[10px] text-slate-400">of {balance.vacation_total ?? "—"} days</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">Sick</p>
          <p className="text-2xl font-bold text-amber-700">{balance.sick_remaining ?? "—"}</p>
          <p className="text-[10px] text-slate-400">of {balance.sick_total ?? "—"} days</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">Personal</p>
          <p className="text-2xl font-bold text-purple-700">{balance.personal_remaining ?? "—"}</p>
          <p className="text-[10px] text-slate-400">of {balance.personal_total ?? "—"} days</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">Used YTD</p>
          <p className="text-2xl font-bold text-slate-700">{balance.used_ytd ?? "—"}</p>
          <p className="text-[10px] text-slate-400">days total</p>
        </div>
      </div>

      {/* Requests list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Dates</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Days</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Reason</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No time-off requests yet
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900 capitalize">{req.type}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{req.days}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell truncate max-w-[200px]">{req.reason || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[req.status] || ""}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request form modal */}
      {showForm && (
        <TimeOffRequestModal
          email={user?.email}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["myTimeOff"] });
            queryClient.invalidateQueries({ queryKey: ["timeOffBalance"] });
            toast.success("Time-off request submitted!");
          }}
        />
      )}
    </div>
  );
}

function TimeOffRequestModal({ email, onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const mutation = useMutation({
    mutationFn: (data) => requestTimeOff(email, data),
    onSuccess,
    onError: (err) => toast.error(err.message),
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Request Time Off</h3>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.type} onChange={set("type")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
              {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={set("start_date")} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={set("end_date")} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason (optional)</label>
            <textarea value={form.reason} onChange={set("reason")} rows={2} placeholder="Brief description..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !form.start_date || !form.end_date} className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {mutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
