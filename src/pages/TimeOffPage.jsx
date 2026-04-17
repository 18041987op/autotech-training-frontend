import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CalendarOff, Plus, Clock, AlertCircle, ShieldCheck } from "lucide-react";
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

  const ptoEligible = balance.pto_eligible === true;
  const hasStartDate = !!balance.start_date;

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

      {/* Eligibility banner */}
      {!hasStartDate && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t("hr.timeOff.noStartDate")}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t("hr.timeOff.noStartDateDesc")}</p>
          </div>
        </div>
      )}
      {hasStartDate && !ptoEligible && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-200">
          <Clock className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-800">{t("hr.timeOff.notYetEligible")}</p>
            <p className="text-xs text-sky-600 mt-0.5">
              {t("hr.timeOff.eligibleAfter", { date: balance.pto_eligible_date || "—" })}
              {balance.days_until_eligible ? ` (${balance.days_until_eligible} ${t("hr.timeOff.daysRemaining")})` : ""}
            </p>
          </div>
        </div>
      )}
      {ptoEligible && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-emerald-800">{t("hr.timeOff.eligible")}</p>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timeOff.ptoAvailable")}</p>
          <p className="text-2xl font-bold text-sky-700">{balance.pto_hours_remaining ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{t("hr.timeOff.of")} {balance.pto_hours_total ?? "—"} {t("hr.timeOff.hours")}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{t("hr.timeOff.accruedGradually")}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timeOff.ptoUsed")}</p>
          <p className="text-2xl font-bold text-slate-700">{balance.pto_hours_used ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{t("hr.timeOff.hoursThisYear")}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">{t("hr.timeOff.unpaidLeave")}</p>
          <p className="text-2xl font-bold text-amber-700">{balance.unpaid_used ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{t("hr.timeOff.hoursThisYear")}</p>
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
                <th className="text-left px-4 py-3 font-semibold text-slate-600">{t("hr.timeOff.hours")}</th>
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
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {req.type === "vacation" ? "PTO" : req.type === "unpaid" ? t("hr.timeOff.unpaidLeave") : req.type}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">
                      {req.hours ? `${req.hours}h` : req.days ? `${req.days}d` : "—"}
                    </td>
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
          ptoEligible={ptoEligible}
          ptoHoursRemaining={balance.pto_hours_remaining || 0}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["myTimeOff"] });
            queryClient.invalidateQueries({ queryKey: ["timeOffBalance"] });
            toast.success(t("hr.timeOff.requestSubmitted"));
          }}
        />
      )}
    </div>
  );
}

function TimeOffRequestModal({ email, ptoEligible, ptoHoursRemaining, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    type: ptoEligible ? "vacation" : "unpaid",
    start_date: "",
    end_date: "",
    hours: "",
    reason: "",
  });

  const mutation = useMutation({
    mutationFn: (data) => requestTimeOff(email, data),
    onSuccess,
    onError: (err) => toast.error(err.message),
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const isPTO = form.type === "vacation";
  const hoursNum = Number(form.hours) || 0;
  const exceedsBalance = isPTO && hoursNum > ptoHoursRemaining;

  // Available type options: only show PTO if eligible
  const availableTypes = ptoEligible
    ? REQUEST_TYPES
    : REQUEST_TYPES.filter((rt) => rt.value !== "vacation");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t("hr.timeOff.requestTimeOff")}</h3>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.type")}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value, hours: "" })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              {availableTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
            {isPTO ? (
              <p className="text-xs text-emerald-600 mt-1">
                {t("hr.timeOff.ptoPaidNote")}
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-1">
                {t("hr.timeOff.unpaidNote")}
              </p>
            )}
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

          {/* Hours input for PTO */}
          {isPTO && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.hoursToUse")}</label>
              <input
                type="number"
                min="0.5"
                max={ptoHoursRemaining}
                step="0.5"
                value={form.hours}
                onChange={set("hours")}
                required
                placeholder={`${t("hr.timeOff.available")}: ${ptoHoursRemaining}h`}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  exceedsBalance ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
              />
              {exceedsBalance && (
                <p className="text-xs text-red-600 mt-1">{t("hr.timeOff.exceedsBalance")}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {t("hr.timeOff.remainingHours", { hours: ptoHoursRemaining })}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t("hr.timeOff.reasonOptional")}</label>
            <textarea value={form.reason} onChange={set("reason")} rows={2} placeholder={t("hr.timeOff.reasonPlaceholder")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">{t("hr.timeOff.cancel")}</button>
            <button
              type="submit"
              disabled={mutation.isPending || !form.start_date || !form.end_date || (isPTO && (!form.hours || exceedsBalance))}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
            >
              {mutation.isPending ? t("hr.timeOff.submitting") : t("hr.timeOff.submitRequest")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
