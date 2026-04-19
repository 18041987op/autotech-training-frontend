import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Wrench, Search, Plus, Package,
  X, Eye, Car, Sparkles, ShoppingCart, ChevronRight, AlertCircle,
  ArrowRightLeft, Check, XCircle, Bell,
} from "lucide-react";
import { getTools, getToolStats, borrowTool, getToolsUsers, getTool, getMyAssignedROs, getToolRecommendations, createPurchaseRequest, createTransferRequest, getTransferRequests, respondTransferRequest } from "../lib/toolsApi";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { QRScannerButton } from "../components/QRScanner";

// Category values are kept as API keys, labels will be translated in component
const CATEGORY_VALUES = [
  { value: "", key: "allCategories" },
  { value: "diagnostico", key: "diagnostico" },
  { value: "manuales", key: "manuales" },
  { value: "electricas", key: "electricas" },
  { value: "neumaticas", key: "neumaticas" },
  { value: "electricas_neumaticas", key: "electricasNeumaticas" },
  { value: "medicion", key: "medicion" },
  { value: "motor_transmision", key: "motorTransmision" },
  { value: "suspension_frenos", key: "suspensionFrenas" },
  { value: "aire_acondicionado", key: "aireAcondicionado" },
  { value: "neumaticos_ruedas", key: "neumaticosRuedas" },
  { value: "manejo_fluidos", key: "manejoFluidos" },
  { value: "elevacion_soporte", key: "elevacionSoporte" },
  { value: "otros", key: "otros" },
];

const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-700",
  borrowed: "bg-amber-100 text-amber-700",
  maintenance: "bg-blue-100 text-blue-700",
  damaged: "bg-red-100 text-red-700",
};

// STATUS_LABELS will be generated dynamically using t() in the component

export function ToolsCatalogPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // QR scan handler — handles both tool QR codes and cabinet door QR codes
  const handleQRScan = async (text) => {
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
        toast.success(`${t("tools.catalog.found")}: ${data.data.name}`);
        navigate(`/tools/${toolId}`);
      } else {
        toast.error(t("tools.catalog.toolNotFoundQR"));
      }
    } catch {
      toast.error(t("tools.catalog.toolNotFoundQR"));
    }
  };
  const [statusFilter, setStatusFilter] = useState("");
  const [borrowModal, setBorrowModal] = useState(null); // tool to borrow
  const [transferRequestModal, setTransferRequestModal] = useState(null); // tool to request transfer for
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);

  // Fetch tools users to find current user's tools_users id
  const { data: usersData } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
    enabled: authReady && !!user?.email,
  });
  const toolsUsers = usersData?.data || [];
  const currentToolsUser = toolsUsers.find(
    (u) => u.email === user?.email || u.work_email === user?.email
  ) || toolsUsers.find(
    (u) => user?.name && u.name?.toLowerCase() === user.name.toLowerCase()
  );

  // Fetch incoming transfer requests (pending requests where I'm the current holder)
  const { data: incomingRequestsData } = useQuery({
    queryKey: ["transferRequests", currentToolsUser?.id],
    queryFn: () => getTransferRequests({ technician_id: currentToolsUser.id, role: "to", status: "pending" }),
    enabled: !!currentToolsUser?.id,
    refetchInterval: 30000, // poll every 30s
  });
  const incomingRequests = incomingRequestsData?.data || [];

  const handleRespondTransfer = async (requestId, action) => {
    try {
      await respondTransferRequest(requestId, action);
      toast.success(action === "accept" ? t("tools.catalog.toolTransferred") : t("tools.catalog.requestDeclined"));
      queryClient.invalidateQueries({ queryKey: ["transferRequests"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["myTools"] });
    } catch (err) {
      toast.error(err.message || t("tools.catalog.failedToRespond"));
    }
  };

  const { data: toolsData, isLoading } = useQuery({
    queryKey: ["tools", { search, category, status: statusFilter }],
    queryFn: () => {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (statusFilter) params.status = statusFilter;
      return getTools(params);
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["toolStats"],
    queryFn: getToolStats,
  });

  const tools = toolsData?.data || [];
  const stats = statsData?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-sky-600" />
            {t("tools.catalog.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("tools.catalog.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/my-tools"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5" /> {t("tools.catalog.goToMyTools")}
          </Link>
          <QRScannerButton onScan={handleQRScan} />
        </div>
      </div>

      {/* Incoming transfer requests banner */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2">
          {incomingRequests.map((req) => (
            <div key={req.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {req.requested_by_name} wants "{req.tool_name}"
                </p>
                {req.reason && (
                  <p className="text-xs text-amber-600 truncate">{req.reason}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleRespondTransfer(req.id, "accept")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Accept
                </button>
                <button
                  onClick={() => handleRespondTransfer(req.id, "decline")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("tools.catalog.statsTotal")} value={stats.total || 0} color="slate" />
        <StatCard label={t("tools.catalog.statusAvailable")} value={stats.available || 0} color="emerald" />
        <StatCard label={t("tools.catalog.statusBorrowed")} value={stats.borrowed || 0} color="amber" />
        <StatCard label={t("tools.catalog.statsMaintenance")} value={(stats.maintenance || 0) + (stats.damaged || 0)} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("tools.catalog.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {CATEGORY_VALUES.map((c) => (
            <option key={c.value} value={c.value}>{t(`tools.catalog.categories.${c.key}`)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          <option value="">{t("tools.catalog.allStatus")}</option>
          <option value="available">{t("tools.catalog.statusAvailable")}</option>
          <option value="borrowed">{t("tools.catalog.statusBorrowed")}</option>
          <option value="maintenance">{t("tools.catalog.statusMaintenance")}</option>
          <option value="damaged">{t("tools.catalog.statusDamaged")}</option>
        </select>
      </div>

      {/* Tools grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">{t("tools.catalog.noToolsFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              currentUserId={currentToolsUser?.id}
              onBorrow={() => setBorrowModal(tool)}
              onRequestTransfer={(t) => setTransferRequestModal(t)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Borrow modal */}
      {borrowModal && (
        <BorrowModal
          tool={borrowModal}
          onClose={() => setBorrowModal(null)}
          onSuccess={() => {
            setBorrowModal(null);
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            queryClient.invalidateQueries({ queryKey: ["toolStats"] });
          }}
        />
      )}

      {/* Transfer request modal */}
      {transferRequestModal && (
        <TransferRequestModal
          tool={transferRequestModal}
          currentToolsUser={currentToolsUser}
          userName={user?.name || user?.email}
          onClose={() => setTransferRequestModal(null)}
          onSuccess={() => {
            setTransferRequestModal(null);
            toast.success(t("tools.catalog.transferRequestSent"));
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ToolCard({ tool, currentUserId, onBorrow, onRequestTransfer, t }) {
  const activeLoans = tool.active_loans || [];
  const quantity = tool.quantity || 1;
  const availableCount = tool.available_count ?? (quantity - activeLoans.length);
  const canBorrow = availableCount > 0 && tool.status !== "maintenance" && tool.status !== "damaged";

  // Check if current user already has this tool borrowed
  const currentUserHasTool = currentUserId && activeLoans.some(
    (loan) => loan.technician_id === currentUserId
  );

  // Derive real status from active loans (more reliable than DB status field)
  const realStatus = tool.status === "maintenance" || tool.status === "damaged"
    ? tool.status
    : activeLoans.length > 0
      ? (availableCount > 0 ? "available" : "borrowed")
      : "available";

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {tool.image_url ? (
          <img
            src={tool.image_url}
            alt={tool.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
            <Wrench className="h-6 w-6 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/tools/${tool.id}`}
              className="text-sm font-semibold text-slate-900 hover:text-sky-600 truncate block"
            >
              {tool.name}
            </Link>
            {quantity > 1 ? (
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                availableCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {availableCount}/{quantity} {t("tools.catalog.available")}
              </span>
            ) : (
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[realStatus]}`}>
                {activeLoans.length > 0 ? t("tools.catalog.statusBorrowed") : t(`tools.catalog.status${realStatus.charAt(0).toUpperCase()}${realStatus.slice(1)}`)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {CATEGORY_VALUES.find((c) => c.value === tool.category)
              ? t(`tools.catalog.categories.${CATEGORY_VALUES.find((c) => c.value === tool.category).key}`)
              : tool.category}
          </p>
          {tool.serial_number && (
            <p className="text-xs text-slate-400 mt-0.5">SN: {tool.serial_number}</p>
          )}
          <p className="text-xs text-slate-400">📍 {tool.location}</p>
          {/* Show who has the tool(s) */}
          {activeLoans.length > 0 && (
            <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 space-y-0.5">
              {activeLoans.map((loan, i) => (
                <p key={i} className="text-xs text-amber-700">
                  <span className="font-semibold">{loan.technician_name}</span>
                  {loan.purpose && <span className="text-amber-600"> — {loan.purpose}</span>}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          ${Number(tool.cost || 0).toFixed(2)}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/tools/${tool.id}`}
            className="text-xs font-medium text-slate-500 hover:text-sky-600 flex items-center gap-1"
          >
            <Eye className="h-3 w-3" /> Details
          </Link>
          {canBorrow && (
            <button
              onClick={onBorrow}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> {t("tools.catalog.borrow")}
            </button>
          )}
          {!canBorrow && activeLoans.length > 0 && currentUserId && !currentUserHasTool && (
            <button
              onClick={() => onRequestTransfer(tool)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
            >
              <ArrowRightLeft className="h-3 w-3" /> {t("tools.catalog.request")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BorrowModal({ tool, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState("select-ro"); // select-ro | recommendations | manual | confirm
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

  // When user selects an RO, auto-fill purpose/vehicle and fetch recommendations
  const [selectedJob, setSelectedJob] = useState(null);

  const handleSelectRO = async (ro) => {
    setSelectedRO(ro);
    setVehicle(ro.vehicleDisplay);

    // If RO has multiple jobs → show job selection step
    // If only 1 job → auto-select and go to confirm
    if (ro.jobs && ro.jobs.length > 1) {
      setStep("select-job");
      return;
    }

    // Single job or no jobs → auto-select first
    const job = ro.jobs?.[0] || null;
    setSelectedJob(job);
    setPurpose(job?.name || ro.jobsDisplay);
    setStep("confirm");

    // Fetch tool recommendations in background
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

  const handleManualEntry = () => {
    setSelectedRO(null);
    setStep("manual");
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setPurpose(job.name);
    setStep("confirm");

    // Fetch tool recommendations for this specific job
    setLoadingRecs(true);
    try {
      const res = await getToolRecommendations({
        job_name: job.name,
        vehicle_make: selectedRO?.vehicle?.make || "",
        vehicle_model: selectedRO?.vehicle?.model || "",
        vehicle_year: selectedRO?.vehicle?.year?.toString() || "",
        canned_job_id: job.cannedJobId?.toString() || "",
      });
      setRecommendations(res?.data || null);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoadingRecs(false);
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
      job_tekmetric_id: selectedJob?.id || selectedRO?.jobs?.[0]?.id || null,
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

          {/* ── Step 1: Select RO or Manual ────────────────────────────── */}
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
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {ro.vehicleDisplay}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            RO #{ro.repairOrderNumber} — {ro.jobsDisplay}
                          </p>
                          {ro.customer && (
                            <p className="text-xs text-slate-400 truncate">{ro.customer.name}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-400">
                  {t("tools.catalog.noVehiclesFound")}
                </div>
              )}

              {/* "Otro" option — always shown */}
              <button
                onClick={handleManualEntry}
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

          {/* ── Step 1b: Select Job (when RO has multiple jobs) ────────── */}
          {step === "select-job" && selectedRO && (
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 mb-2">
                <p className="text-sm font-semibold text-sky-900">{selectedRO.vehicleDisplay}</p>
                <p className="text-xs text-sky-700">RO #{selectedRO.repairOrderNumber} — {selectedRO.customer?.name || ""}</p>
              </div>
              <p className="text-sm text-slate-500">{t("tools.catalog.selectJob") || "Select the job you need this tool for:"}</p>
              <div className="space-y-2">
                {selectedRO.jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-base">🔧</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{job.name}</p>
                        <p className="text-xs text-slate-500">
                          {job.category ? `${job.category} — ` : ""}{job.laborHours ? `${job.laborHours}h labor` : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep("select-ro")}
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                {t("common.back")}
              </button>
            </div>
          )}

          {/* ── Step 2: Manual entry form ──────────────────────────────── */}
          {step === "manual" && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t("tools.catalog.purpose")} *</label>
                <input
                  type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} required
                  placeholder={t("tools.catalog.purposePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t("tools.catalog.vehicle")}</label>
                <input
                  type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                  placeholder={t("tools.catalog.vehiclePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
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

          {/* ── Step 3: Confirm (auto-filled from RO) + Recommendations ── */}
          {step === "confirm" && (
            <div className="mt-4 space-y-4">
              {/* Selected RO summary */}
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <p className="text-sm font-semibold text-sky-900">{selectedRO?.vehicleDisplay}</p>
                <p className="text-xs text-sky-700">RO #{selectedRO?.repairOrderNumber} — {selectedJob?.name || selectedRO?.jobsDisplay}</p>
                {selectedJob?.category && <p className="text-xs text-sky-500">{selectedJob.category}</p>}
              </div>

              {/* Duration selector */}
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

              {/* Tool recommendations section */}
              {loadingRecs && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  {t("tools.catalog.lookingUpTools")}
                </div>
              )}

              {recommendations && (
                <div className="space-y-3">
                  {/* In inventory */}
                  {recommendations.inInventory?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {t("tools.catalog.recommendedInStock")}
                      </p>
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

                  {/* Not in inventory */}
                  {recommendations.notInInventory?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {t("tools.catalog.recommendedNotInStock")}
                      </p>
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
                              <button
                                onClick={() => handleRequestPurchase(rec)}
                                className="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                              >
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

              {/* Action buttons */}
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

/* ─── Transfer Request Modal ───────────────────────────────────────────────── */

function TransferRequestModal({ tool, currentToolsUser, userName, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const activeLoan = tool.active_loan;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentToolsUser) {
      toast.error(t("tools.catalog.accountNotLinked"));
      return;
    }
    if (!activeLoan?.loan_id) {
      toast.error(t("tools.catalog.noActiveLoan"));
      return;
    }

    setSending(true);
    try {
      await createTransferRequest({
        loan_id: activeLoan.loan_id,
        requested_by: currentToolsUser.id,
        requested_by_name: userName,
        reason,
      });
      onSuccess();
    } catch (err) {
      toast.error(err.message || t("tools.catalog.transferRequestError"));
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {t("tools.catalog.requestTransfer")}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {t("tools.catalog.askToTransfer", {
            technician: activeLoan?.technician_name,
            tool: tool.name
          })}
        </p>

        {/* Current holder info */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-amber-800">
              {t("tools.catalog.currentlyWith", { technician: activeLoan?.technician_name })}
            </span>
          </div>
          {activeLoan?.purpose && (
            <p className="text-xs text-amber-600 mt-1 ml-6">{activeLoan.purpose}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              {t("tools.catalog.reasonOptional")}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("tools.catalog.reasonPlaceholder")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <p className="text-xs text-slate-400">
            {t("tools.catalog.notificationText", { technician: activeLoan?.technician_name })}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={sending} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
              {sending ? t("tools.catalog.sending") : t("tools.catalog.sendRequest")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
