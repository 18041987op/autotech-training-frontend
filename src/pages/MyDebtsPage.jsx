import React, { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { getMyDebts, getDebtDetail, signDebt } from "../lib/debtApi";

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

/* ── Signature Pad ────────────────────────────────────────────────── */

function SignaturePad({ onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    hasDrawn.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawing.current = false;
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    hasDrawn.current = false;
  };

  const handleSave = () => {
    if (!hasDrawn.current) return;
    const dataUrl = canvasRef.current?.toDataURL("image/png") || "";
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 font-medium">{t("debt.sign_below")}</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
        style={{ touchAction: "none" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2">
        <button
          onClick={clear}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          {t("debt.clear_signature")}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {saving ? t("debt.signing") : t("debt.confirm_signature")}
        </button>
      </div>
      <button
        onClick={onCancel}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}

/* ── Agreement Section (Bilingual) ───────────────────────────────── */

function AgreementSection({ debt, onSign, signing }) {
  const { t } = useTranslation();
  const [showSignPad, setShowSignPad] = useState(false);

  const handleSign = async (dataUrl) => {
    await onSign(dataUrl);
    setShowSignPad(false);
  };

  // Already signed
  if (debt.agreement_signature) {
    return (
      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">{t("debt.agreement_title")}</h4>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-lg">✓</span>
            <span className="text-sm font-medium text-green-700">{t("debt.agreement_signed")}</span>
          </div>
          <img
            src={debt.agreement_signature}
            alt="Your signature"
            className="max-h-16 border rounded bg-white p-1"
          />
          <p className="text-xs text-green-600 mt-1">
            {t("debt.signed_on")} {fmtDate(debt.agreement_signed_at)}
          </p>
        </div>
      </div>
    );
  }

  // Not yet signed — show agreement terms + sign button
  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">{t("debt.agreement_title")}</h4>

      {/* Standard Terms — English */}
      <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
        <p className="text-xs font-bold text-gray-700 uppercase">Payroll Deduction Agreement</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          I, <span className="font-semibold">{debt.debtor_name}</span>, acknowledge that I owe{" "}
          <span className="font-semibold">AutoRx Center</span> the amount of{" "}
          <span className="font-semibold">{fmt(debt.total_amount)}</span>
          {debt.description ? ` for: ${debt.description}` : ""}.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          I authorize AutoRx Center to deduct{" "}
          <span className="font-semibold">{fmt(debt.weekly_payment)}</span> per week from my paycheck
          (after taxes) until the balance is paid in full. This deduction will appear on each pay
          period until the remaining balance reaches $0.00.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          If my employment ends before the debt is fully repaid, the remaining balance will be
          deducted from my final paycheck. If the final paycheck is insufficient, I agree to
          arrange an alternative repayment plan.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          By signing below, I confirm that I understand and accept these terms.
        </p>
      </div>

      {/* Standard Terms — Spanish */}
      <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
        <p className="text-xs font-bold text-gray-700 uppercase">Acuerdo de Deducción de Nómina</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Yo, <span className="font-semibold">{debt.debtor_name}</span>, reconozco que debo a{" "}
          <span className="font-semibold">AutoRx Center</span> la cantidad de{" "}
          <span className="font-semibold">{fmt(debt.total_amount)}</span>
          {debt.description ? ` por: ${debt.description}` : ""}.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Autorizo a AutoRx Center a deducir{" "}
          <span className="font-semibold">{fmt(debt.weekly_payment)}</span> por semana de mi cheque
          de pago (después de impuestos) hasta que el saldo sea pagado en su totalidad. Esta
          deducción aparecerá en cada período de pago hasta que el saldo restante llegue a $0.00.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Si mi empleo termina antes de que la deuda sea pagada por completo, el saldo restante
          será deducido de mi último cheque de pago. Si el último cheque es insuficiente, me
          comprometo a establecer un plan de pago alternativo.
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Al firmar a continuación, confirmo que entiendo y acepto estos términos.
        </p>
      </div>

      {/* Custom notes from admin */}
      {debt.agreement_notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs font-bold text-yellow-800 uppercase mb-1">
            {t("debt.additional_conditions")}
          </p>
          <p className="text-xs text-yellow-700 whitespace-pre-wrap leading-relaxed">
            {debt.agreement_notes}
          </p>
        </div>
      )}

      {/* Signature area */}
      {showSignPad ? (
        <SignaturePad
          onSave={handleSign}
          onCancel={() => setShowSignPad(false)}
          saving={signing}
        />
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <p className="text-sm text-orange-700 mb-3">{t("debt.pending_signature")}</p>
          <button
            onClick={() => setShowSignPad(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
          >
            {t("debt.sign_agreement")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */

export function MyDebtsPage() {
  const { t } = useTranslation();
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [signing, setSigning] = useState(false);

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

  const handleSign = useCallback(async (dataUrl) => {
    if (!selectedDebt) return;
    setSigning(true);
    try {
      await signDebt(selectedDebt.id, dataUrl);
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["myDebts"] });
      queryClient.invalidateQueries({ queryKey: ["debtDetail", selectedDebt.id] });
      // Update local state so UI reflects signature immediately
      setSelectedDebt((prev) => prev ? {
        ...prev,
        agreement_signature: dataUrl,
        agreement_signed_at: new Date().toISOString(),
      } : null);
    } catch (err) {
      alert(err.message || "Failed to save signature");
    } finally {
      setSigning(false);
    }
  }, [selectedDebt, queryClient]);

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

  // Merge detail data into selectedDebt for the agreement section
  const displayDebt = selectedDebt
    ? { ...selectedDebt, ...(detailData?.debt || {}) }
    : null;

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
                    {!d.agreement_signature && (
                      <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        {t("debt.needs_signature")}
                      </span>
                    )}
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
      {displayDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{t("debt.detail_title")}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[displayDebt.status]}`}>
                    {t(`debt.status_${displayDebt.status}`)}
                  </span>
                  <span className="text-xs text-gray-500">{t(typeLabels[displayDebt.debt_type])}</span>
                </div>
              </div>
              <button onClick={() => setSelectedDebt(null)} className="text-gray-400 hover:text-gray-600 text-xl p-1">
                &times;
              </button>
            </div>

            {displayDebt.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{displayDebt.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{t("debt.total_amount")}</p>
                <p className="font-bold text-gray-900">{fmt(displayDebt.total_amount)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600">{t("debt.remaining")}</p>
                <p className="font-bold text-red-700">{fmt(displayDebt.remaining_balance)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600">{t("debt.total_paid_label")}</p>
                <p className="font-bold text-green-700">{fmt(displayDebt.total_paid)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">{t("debt.weekly_deduction")}</p>
                <p className="font-bold text-blue-700">{fmt(displayDebt.weekly_payment)}/{t("debt.per_week")}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${progressPct(displayDebt)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {progressPct(displayDebt)}% {t("debt.completed")}
              </p>
            </div>

            {/* Agreement & Signature */}
            <AgreementSection
              debt={displayDebt}
              onSign={handleSign}
              signing={signing}
            />

            {/* Payment History */}
            {detailData?.payments?.length > 0 && (
              <div className="border-t pt-4">
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
