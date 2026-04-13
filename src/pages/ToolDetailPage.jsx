import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft, Wrench, Clock,
  AlertTriangle, CheckCircle, ArrowRightLeft,
  ThumbsUp, ThumbsDown, Plus, Car, ChevronRight,
  Sparkles, AlertCircle, ShoppingCart,
} from "lucide-react";
import {
  getTool, getLoans, returnTool, transferTool, getToolsUsers,
  borrowTool, getMyAssignedROs, getToolRecommendations, createPurchaseRequest,
} from "../lib/toolsApi";
import { useAuthStore } from "../stores/authStore";

const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-700",
  borrowed: "bg-amber-100 text-amber-700",
  maintenance: "bg-blue-100 text-blue-700",
  damaged: "bg-red-100 text-red-700",
};

export function ToolDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [returnModal, setReturnModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [borrowModal, setBorrowModal] = useState(false);

  const { data: toolData, isLoading } = useQuery({
    queryKey: ["tool", id],
    queryFn: () => getTool(id),
  });

  const { data: loansData } = useQuery({
    queryKey: ["toolLoans", id],
    queryFn: () => getLoans({ tool_id: id }),
  });

  const user = useAuthStore((s) => s.user);

  // Resolve current user's tools_users ID
  const { data: usersData } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
    enabled: !!user?.email,
  });
  const currentToolsUser = (usersData?.data || []).find(
    (u) => u.email === user?.email || u.work_email === user?.email
  ) || (usersData?.data || []).find(
    (u) => user?.name && u.name?.toLowerCase() === user.name.toLowerCase()
  );

  const tool = toolData?.data;
  const loans = loansData?.data || [];
  const activeLoan = loans.find((l) => l.status === "active");
  const isMyLoan = currentToolsUser && activeLoan?.technician_id === currentToolsUser.id;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">{t("tools.detail.notFound")}</p>
        <Link to="/tools" className="text-sm text-sky-600 hover:underline mt-2 inline-block">
          {t("tools.detail.backToCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/tools")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600"
      >
        <ArrowLeft className="h-4 w-4" /> {t("tools.detail.backToCatalog")}
      </button>

      {/* Tool header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {tool.image_url ? (
            <img
              src={tool.image_url}
              alt={tool.name}
              className="w-32 h-32 rounded-2xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Wrench className="h-10 w-10 text-slate-300" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-slate-900">{tool.name}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[tool.status]}`}>
                  {tool.status}
                </span>
                {tool.status === "available" && !activeLoan && (
                  <button
                    onClick={() => setBorrowModal(true)}
                    className="px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> {t("tools.catalog.borrow")}
                  </button>
                )}
              </div>
            </div>
            {tool.description && (
              <p className="text-sm text-slate-600 mt-2">{tool.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <InfoRow label={t("tools.detail.category")} value={tool.category} />
              <InfoRow label={t("tools.detail.location")} value={tool.location} />
              <InfoRow label={t("tools.detail.serialNumber")} value={tool.serial_number || "—"} />
              <InfoRow label={t("tools.detail.partNumber")} value={tool.part_number || "—"} />
              <InfoRow label={t("tools.detail.cost")} value={`$${Number(tool.cost || 0).toFixed(2)}`} />
              <InfoRow label={t("tools.detail.purchaseDate")} value={tool.purchase_date || "—"} />
            </div>
          </div>
          {/* QR Code */}
          {tool.qr_code_url && (
            <div className="flex flex-col items-center gap-1">
              <img
                src={tool.qr_code_url}
                alt="QR Code"
                className="w-24 h-24 rounded-lg border border-slate-200"
              />
              <span className="text-xs text-slate-400">{t("tools.detail.scanQR")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active loan info */}
      {activeLoan && (
        <div className="card p-5 border-l-4 border-l-amber-400 bg-amber-50/50">
          <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> {t("tools.detail.currentlyBorrowed")}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Technician" value={activeLoan.technician?.name || activeLoan.technician_name || activeLoan.technician_id} />
            <InfoRow label={t("tools.detail.purpose")} value={activeLoan.purpose} />
            <InfoRow label="Vehicle" value={activeLoan.vehicle || "—"} />
            <InfoRow label={t("tools.detail.borrowedOn")} value={new Date(activeLoan.borrowed_at).toLocaleDateString()} />
            <InfoRow
              label={t("tools.detail.due")}
              value={new Date(activeLoan.expected_return).toLocaleString()}
            />
            <InfoRow
              label="Status"
              value={
                new Date(activeLoan.expected_return) < new Date()
                  ? "⚠️ OVERDUE"
                  : "On Time"
              }
            />
          </div>
          {isMyLoan && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReturnModal(activeLoan)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5" /> {t("tools.detail.returnTool")}
              </button>
              <button
                onClick={() => setTransferModal(activeLoan)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> {t("tools.detail.transferTool")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loan history */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 text-sm p-4 border-b border-slate-100">
          {t("tools.detail.loanHistory")}
        </h3>
        {loans.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">{t("tools.detail.noLoans")}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <div key={loan.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {loan.technician?.name || loan.technician_name || "Unknown"} — {loan.purpose}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(loan.borrowed_at).toLocaleDateString()}
                    {loan.actual_return && ` → ${new Date(loan.actual_return).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  loan.status === "active" ? "bg-amber-100 text-amber-700" :
                  loan.status === "returned" ? "bg-emerald-100 text-emerald-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {loan.status === "active" ? t("tools.detail.active") :
                   loan.status === "returned" ? t("tools.detail.returned") :
                   loan.status === "transferred" ? t("tools.detail.transferred") :
                   loan.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return modal */}
      {returnModal && (
        <ReturnModal
          loan={returnModal}
          onClose={() => setReturnModal(null)}
          onSuccess={() => {
            setReturnModal(null);
            queryClient.invalidateQueries({ queryKey: ["tool", id] });
            queryClient.invalidateQueries({ queryKey: ["toolLoans", id] });
          }}
        />
      )}

      {/* Transfer modal */}
      {transferModal && (
        <TransferModal
          loan={transferModal}
          onClose={() => setTransferModal(null)}
          onSuccess={() => {
            setTransferModal(null);
            queryClient.invalidateQueries({ queryKey: ["tool", id] });
            queryClient.invalidateQueries({ queryKey: ["toolLoans", id] });
          }}
        />
      )}

      {/* Borrow modal */}
      {borrowModal && (
        <BorrowModal
          tool={tool}
          onClose={() => setBorrowModal(false)}
          onSuccess={() => {
            setBorrowModal(false);
            queryClient.invalidateQueries({ queryKey: ["tool", id] });
            queryClient.invalidateQueries({ queryKey: ["toolLoans", id] });
          }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-700">{value}</p>
    </div>
  );
}

function ReturnModal({ loan, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [condition, setCondition] = useState("good");
  const [damageDesc, setDamageDesc] = useState("");
  const [wasNeeded, setWasNeeded] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => returnTool(loan.id, data),
    onSuccess: () => {
      toast.success(t("tools.detail.returnSuccess"));
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      returnCondition: {
        status: condition,
        hasDamage: condition === "damaged",
        description: condition === "damaged" ? damageDesc : undefined,
      },
      ...(wasNeeded !== null && { was_needed: wasNeeded }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t("tools.detail.returnTool")}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t("tools.detail.condition")}</label>
            <div className="flex gap-3">
              <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer text-center text-sm font-medium transition ${
                condition === "good" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"
              }`}>
                <input type="radio" value="good" checked={condition === "good"} onChange={() => setCondition("good")} className="sr-only" />
                <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                Good
              </label>
              <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer text-center text-sm font-medium transition ${
                condition === "damaged" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"
              }`}>
                <input type="radio" value="damaged" checked={condition === "damaged"} onChange={() => setCondition("damaged")} className="sr-only" />
                <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                Damaged
              </label>
            </div>
          </div>
          {condition === "damaged" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("tools.detail.damageDesc")}</label>
              <textarea
                value={damageDesc}
                onChange={(e) => setDamageDesc(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Describe the damage..."
              />
            </div>
          )}

          {/* Was this tool needed? feedback */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("tools.detail.wasNeeded")}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWasNeeded(true)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition ${
                  wasNeeded === true
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <ThumbsUp className="h-4 w-4" /> Yes
              </button>
              <button
                type="button"
                onClick={() => setWasNeeded(false)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition ${
                  wasNeeded === false
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <ThumbsDown className="h-4 w-4" /> No
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">{t("tools.detail.feedbackHint")}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {mutation.isPending ? "Returning..." : "Confirm Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BorrowModal({ tool, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState("select-ro"); // select-ro | manual | confirm
  const [selectedRO, setSelectedRO] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [hours, setHours] = useState("8");
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [purchaseRequested, setPurchaseRequested] = useState({});

  const user = window.__APP_USER__;

  const { data: usersData } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
  });

  const { data: rosData, isLoading: loadingROs } = useQuery({
    queryKey: ["myAssignedROs", user?.email],
    queryFn: () => getMyAssignedROs(user?.email),
    enabled: !!user?.email,
    retry: false,
  });

  const toolsUsers = usersData?.data || [];
  const currentToolsUser = toolsUsers.find(
    (u) => u.email === user?.email || u.work_email === user?.email
  ) || toolsUsers.find(
    (u) => user?.name && u.name?.toLowerCase() === user.name.toLowerCase()
  );
  const assignedROs = rosData?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => borrowTool(data),
    onSuccess: () => {
      toast.success(t("tools.catalog.borrowSuccess", { toolName: tool.name }));
      onSuccess();
    },
    onError: (err) => toast.error(err.message || t("tools.catalog.borrowError")),
  });

  const handleSelectRO = async (ro) => {
    setSelectedRO(ro);
    setPurpose(ro.jobsDisplay);
    setVehicle(ro.vehicleDisplay);
    setStep("confirm");

    if (ro.jobs && ro.jobs.length > 0) {
      setLoadingRecs(true);
      try {
        const res = await getToolRecommendations({
          job_name: ro.jobs[0].name,
          vehicle_make: ro.vehicle?.make || "",
          vehicle_model: ro.vehicle?.model || "",
          vehicle_year: ro.vehicle?.year?.toString() || "",
          canned_job_id: ro.jobs[0].cannedJobId?.toString() || "",
        });
        setRecommendations(res?.data || null);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoadingRecs(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentToolsUser) {
      toast.error(t("tools.catalog.accountNotLinked"));
      return;
    }
    mutation.mutate({
      toolId: tool.id,
      technicianId: currentToolsUser.id,
      purpose,
      vehicle,
      loanDuration: `${hours}h`,
      repair_order_tekmetric_id: selectedRO?.repairOrderId || null,
      job_tekmetric_id: selectedRO?.jobs?.[0]?.id || null,
    });
  };

  const handleRequestPurchase = async (rec) => {
    try {
      await createPurchaseRequest({
        tool_name: rec.toolName,
        tool_part_number: rec.toolPartNumber || rec.partNumber,
        tool_description: rec.description,
        job_name: selectedRO?.jobs?.[0]?.name,
        repair_order_tekmetric_id: selectedRO?.repairOrderId,
        vehicle_info: selectedRO?.vehicleDisplay,
        vehicle_make: selectedRO?.vehicle?.make,
        vehicle_model: selectedRO?.vehicle?.model,
        vehicle_year: selectedRO?.vehicle?.year,
        requested_by: currentToolsUser?.id,
        requested_by_name: user?.name || user?.email,
      });
      setPurchaseRequested((prev) => ({ ...prev, [rec.toolName]: true }));
      toast.success(t("tools.catalog.purchaseRequestSent", { toolName: rec.toolName }));
    } catch (err) {
      toast.error(t("tools.catalog.purchaseRequestError"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {t("tools.catalog.borrow")}: {tool.name}
          </h3>

          {/* Step 1: Select RO or Manual */}
          {step === "select-ro" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-500">{t("tools.catalog.selectVehicle")}</p>
              {loadingROs ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : assignedROs.length > 0 ? (
                <div className="space-y-2">
                  {assignedROs.map((ro) => (
                    <button
                      key={ro.repairOrderId}
                      onClick={() => handleSelectRO(ro)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                          <Car className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{ro.vehicleDisplay}</p>
                          <p className="text-xs text-slate-500 truncate">RO #{ro.repairOrderNumber} — {ro.jobsDisplay}</p>
                          {ro.customer && <p className="text-xs text-slate-400 truncate">{ro.customer.name}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-400">{t("tools.catalog.noVehiclesFound")}</div>
              )}
              <button
                onClick={() => setStep("manual")}
                className="w-full text-left p-3 rounded-xl border border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{t("tools.catalog.otherManualEntry")}</p>
                    <p className="text-xs text-slate-400">{t("tools.catalog.vehicleNotListed")}</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={onClose} className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                {t("common.cancel")}
              </button>
            </div>
          )}

          {/* Step 2: Manual entry */}
          {step === "manual" && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t("tools.catalog.purpose")} *</label>
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} required
                  placeholder={t("tools.catalog.purposePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t("tools.catalog.vehicle")}</label>
                <input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                  placeholder={t("tools.catalog.vehiclePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t("tools.catalog.returnIn")}</label>
                <select value={hours} onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                  <option value="1">{t("tools.catalog.duration1h")}</option>
                  <option value="2">{t("tools.catalog.duration2h")}</option>
                  <option value="4">{t("tools.catalog.duration4h")}</option>
                  <option value="8">{t("tools.catalog.duration8h")}</option>
                  <option value="24">{t("tools.catalog.duration24h")}</option>
                  <option value="48">{t("tools.catalog.duration48h")}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep("select-ro")}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  {t("common.back")}
                </button>
                <button type="submit" disabled={mutation.isPending || !purpose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {mutation.isPending ? t("tools.catalog.borrowing") : t("tools.catalog.confirmBorrow")}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Confirm (auto-filled from RO) + Recommendations */}
          {step === "confirm" && (
            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <p className="text-sm font-semibold text-sky-900">{selectedRO?.vehicleDisplay}</p>
                <p className="text-xs text-sky-700">RO #{selectedRO?.repairOrderNumber} — {selectedRO?.jobsDisplay}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t("tools.catalog.returnIn")}</label>
                <select value={hours} onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                  <option value="1">{t("tools.catalog.duration1h")}</option>
                  <option value="2">{t("tools.catalog.duration2h")}</option>
                  <option value="4">{t("tools.catalog.duration4h")}</option>
                  <option value="8">{t("tools.catalog.duration8h")}</option>
                  <option value="24">{t("tools.catalog.duration24h")}</option>
                  <option value="48">{t("tools.catalog.duration48h")}</option>
                </select>
              </div>
              {loadingRecs && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  {t("tools.catalog.lookingUpTools")}
                </div>
              )}
              {recommendations && (
                <div className="space-y-3">
                  {recommendations.inInventory?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t("tools.catalog.recommendedInStock")}</p>
                      <div className="space-y-1.5">
                        {recommendations.inInventory.map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                            <Wrench className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-emerald-900 truncate">{rec.toolName || rec.tool?.name}</p>
                              <p className="text-[10px] text-emerald-600 truncate">{rec.description}</p>
                            </div>
                            {rec.available !== false ? (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">{t("tools.catalog.statusAvailable")}</span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{t("tools.catalog.inUse")}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.notInInventory?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t("tools.catalog.recommendedNotInStock")}</p>
                      <div className="space-y-1.5">
                        {recommendations.notInInventory.map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-amber-900 truncate">{rec.toolName}</p>
                              <p className="text-[10px] text-amber-600 truncate">{rec.description}</p>
                            </div>
                            {purchaseRequested[rec.toolName] ? (
                              <span className="text-[10px] font-semibold text-emerald-600">{t("tools.catalog.requested")}</span>
                            ) : (
                              <button onClick={() => handleRequestPurchase(rec)}
                                className="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                                <ShoppingCart className="h-2.5 w-2.5" /> {t("tools.catalog.request")}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setStep("select-ro"); setSelectedRO(null); setRecommendations(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  {t("common.back")}
                </button>
                <button onClick={handleSubmit} disabled={mutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {mutation.isPending ? t("tools.catalog.borrowing") : t("tools.catalog.confirmBorrow")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransferModal({ loan, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: usersData } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
  });

  const users = (usersData?.data || []).filter((u) => u.id !== loan.technician_id);

  const mutation = useMutation({
    mutationFn: (data) => transferTool(loan.id, data),
    onSuccess: () => {
      toast.success(t("tools.detail.transferSuccess"));
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ targetTechnicianId: toId, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t("tools.detail.transferTool")}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t("tools.detail.transferTo")}</label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">Select technician...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending || !toId} className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {mutation.isPending ? "Transferring..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
