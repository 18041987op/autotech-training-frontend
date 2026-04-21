import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { getMyDebts, getDebtDetail } from "../lib/debtApi";

const fmt = (n) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const statusColors = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  paid_off: "bg-blue-100 text-blue-800",
  written_off: "bg-gray-100 text-gray-600",
};

const typeLabels = {
  loan: "debt.type_loan",
  advance: "debt.type_advance",
  damage: "debt.type_damage",
  other: "debt.type_other",
};

const methodLabels = {
  payroll_deduction: "debt.method_payroll",
  cash: "debt.method_cash",
  transfer: "debt.method_transfer",
  other: "debt.method_other",
};

export function MyDebtsPage() {
  const { t } = useTranslation();
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const [selectedDebt, setSelectedDebt] = useState(null);

  const { data: debtsData, isLoading } = useQuery({
    queryKey: ["myDebts", user?.email],
    queryFn: () => getMyDebts(user?.email),
    enabled: authReady && !!user?.email,
  });

  const { data: detailData } = useQuery({
    queryKey: ["debtDetail", selectedDebt?.id],
    queryFn: () => getDebtDetail(selectedDebt?.id),
    enabled: !!selectedDebt?.id,
  });

  const debts = debtsData?.debts || [];
  const activeDebts = debts.filter((d) => d.status === "active" || d.status === "paused");
  const pastDebts = debts.filter((d) => d.status === "paid_off" || d.status === "written_off");

  const totalOwed = activeDebts.reduce((s, d) => s + parseFloat(d.remaining_balance), 0);
  const weeklyTotal = activeDebts
    .filter((d) => d.auto_deduct)
    .reduce((s, d) => s + parseFloat(d.weekly_payment), 0);

  if (!authReady || isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">{t("common.loading")}</div>
    );
  }

  const progressPct = (d) => {
    const total = parseFloat(d.total_amount);
    if (total <= 0) return 100;
    return Math.min(100, Math.round((parseFloat(d.total_paid) / total) * 100));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">{t("debt.my_debts")}</h1>

      {/* Summary Cards */}
      {activeDebts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs text-red-600 uppercase">{t("debt.total_owed")}</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{fmt(totalOwed)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 uppercase">{t("debt.weekly_deduction")}</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(weeklyTotal)}/{t("debt.per_week")}</p>
          </div>
        </div>
      )}

      {/* No debts */}
      {debts.length === 0 && (
        <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
          <p className="text-green-700 font-medium">{t("debt.no_debts")}</p>
          <p className="text-sm text-green-600 mt-1">{t("debt.no_debts_desc")}</p>
        </div>
      )}

      {/* Active debts */}
      {activeDebts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">{t("debt.active_debts")}</h2>
          {activeDebts.map((d) => {
            const pct = progressPct(d);
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDebt(d)}
                className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status]}`}>
                      {t(`debt.status_${d.status}`)}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">{t(typeLabels[d.debt_type] || d.debt_type)}</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{fmt(d.remaining_balance)}</span>
                </div>
                {d.description && (
                  <p className="text-sm text-gray-600 mt-2">{d.description}</p>
                )}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{fmt(d.total_paid)} {t("debt.paid_of")} {fmt(d.total_amount)}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {fmt(d.weekly_payment)}/{t("debt.per_week")} &middot;{" "}
                  ~{Math.ceil(d.remaining_balance / d.weekly_payment)} {t("debt.weeks_remaining")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Past debts */}
      {pastDebts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">{t("debt.past_debts")}</h2>
          {pastDebts.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDebt(d)}
              className="bg-gray-50 rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status]}`}>
                    {t(`debt.status_${d.status}`)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{t(typeLabels[d.debt_type] || d.debt_type)}</span>
                </div>
                <span className="text-sm text-gray-500">{fmt(d.total_amount)}</span>
              </div>
              {d.description && <p className="text-sm text-gray-500 mt-1">{d.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{fmtDate(d.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{t("debt.detail_title")}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedDebt.status]}`}>
                    {t(`debt.status_${selectedDebt.status}`)}
                  </span>
                  <span className="text-xs text-gray-500">{t(typeLabels[selectedDebt.debt_type])}</span>
                </div>
              </div>
              <button onClick={() => setSelectedDebt(null)} className="text-gray-400 hover:text-gray-600 text-xl p-1">
                &times;
              </button>
            </div>

            {selectedDebt.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedDebt.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t("debt.total_amount")}</p>
                <p className="font-bold text-gray-900">{fmt(selectedDebt.total_amount)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600">{t("debt.remaining")}</p>
                <p className="font-bold text-red-700">{fmt(selectedDebt.remaining_balance)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600">{t("debt.total_paid_label")}</p>
                <p className="font-bold text-green-700">{fmt(selectedDebt.total_paid)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">{t("debt.weekly_deduction")}</p>
                <p className="font-bold text-blue-700">{fmt(selectedDebt.weekly_payment)}/{t("debt.per_week")}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${progressPct(selectedDebt)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {progressPct(selectedDebt)}% {t("debt.completed")}
              </p>
            </div>

            {/* Signature status */}
            {selectedDebt.agreement_signature && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-xs text-green-700 font-medium">{t("debt.signed_on")} {fmtDate(selectedDebt.agreement_signed_at)}</p>
              </div>
            )}

            {/* Payment History */}
            {detailData?.payments?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t("debt.payment_history")}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detailData.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-green-700">-{fmt(p.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {t(methodLabels[p.payment_method] || p.payment_method)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{fmtDate(p.created_at)}</p>
                        <p className="text-xs text-gray-400">
                          {fmt(p.balance_before)} &rarr; {fmt(p.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedDebt(null)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyDebtsPage;
