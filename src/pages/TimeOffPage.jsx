import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CalendarOff, Plus } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getMyTimeOff, requestTimeOff, getTimeOffBalance } from "../lib/hrApi";

const REQUEST_TYPES = [
  { value: "vacation", label: "PTO (Paid)", paid: true },
  { value: "unpaid", label: "Unpaid Leave", paid: false },
];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export function TimeOffPage() {
  const { t } = useTranslation();
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
            {t("hr.timeOff.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("hr.timeOff.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> {t("hr.timeOff.requestTimeOff")}
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timeOff.pto")}</p>
          <p className="text-2xl font-bold text-sky-700">{balance.vacation_remaining ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{t("hr.timeOff.of")} {balance.vacation_total ?? "—"} {t("hr.timeOff.days")}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{t("hr.timeOff.accruedGradually")}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timeOff.usedYTD")}</p>
          <p className="text-2xl font-bold text-slate-700">{balance.used_ytd ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{t("hr.timeOff.daysTotal")}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timeOff.unpaidLeave")}</p>
          <p className="text-2xl font-bold text-amber-700">{balance.unpaid_used ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{t("hr.timeOff.daysThisYear")}</p>
        </div>
      </div>

      {/* Requests list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">{t("hr.timeOff.type")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">{t("hr.timeOff.dates")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">{t("hr.timeOff.days")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">{t("hr.timeOff.reason")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">{t("hr.timeOff.status")}</th>
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
                    {t("hr.timeOff.noRequests")}
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
  const { t } = useTranslation();
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
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t("hr.timeOff.requestTimeOff")}</h3>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.type")}</label>
            <select value={form.type} onChange={set("type")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
              {REQUEST_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
            {(() => {
              const selected = REQUEST_TYPES.find(rt => rt.value === form.type);
              return selected?.paid ? (
                <p className="text-xs text-emerald-600 mt-1">✅ This time off will be paid when approved (hours × your rate).</p>
              ) : (
                <p className="text-xs text-amber-600 mt-1">⚠️ Unpaid leave — no pay will be calculated. This is recorded as an absence.</p>
              );
            })()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.startDate")}</label>
              <input type="date" value={form.start_date} onChange={set("start_date")} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.endDate")}</label>
              <input type="date" value={form.end_date} onChange={set("end_date")} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.reasonOptional")}</label>
            <textarea value={form.reason} onChange={set("reason")} rows={2} placeholder={t("hr.timeOff.reasonPlaceholder")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">{t("hr.timeOff.cancel")}</button>
            <button type="submit" disabled={mutation.isPending || !form.start_date || !form.end_date} className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {mutation.isPending ? t("hr.timeOff.submitting") : t("hr.timeOff.submitRequest")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
