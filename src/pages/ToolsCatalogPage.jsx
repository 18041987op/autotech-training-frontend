import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Wrench, Search, Plus, Package,
  X, Eye, Car, Sparkles, ShoppingCart, ChevronRight, AlertCircle,
} from "lucide-react";
import { getTools, getToolStats, borrowTool, getToolsUsers, getTool, getMyAssignedROs, getToolRecommendations, createPurchaseRequest } from "../lib/toolsApi";
import { QRScannerButton } from "../components/QRScanner";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "manuales", label: "Manuales" },
  { value: "electricas", label: "Eléctricas" },
  { value: "neumaticas", label: "Neumáticas" },
  { value: "electricas_neumaticas", label: "Eléctricas/Neumáticas" },
  { value: "medicion", label: "Medición" },
  { value: "motor_transmision", label: "Motor/Transmisión" },
  { value: "suspension_frenos", label: "Suspensión/Frenos" },
  { value: "aire_acondicionado", label: "Aire Acondicionado" },
  { value: "neumaticos_ruedas", label: "Neumáticos/Ruedas" },
  { value: "manejo_fluidos", label: "Manejo de Fluidos" },
  { value: "elevacion_soporte", label: "Elevación/Soporte" },
  { value: "otros", label: "Otros" },
];

const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-700",
  borrowed: "bg-amber-100 text-amber-700",
  maintenance: "bg-blue-100 text-blue-700",
  damaged: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  available: "Available",
  borrowed: "Borrowed",
  maintenance: "Maintenance",
  damaged: "Damaged",
};

export function ToolsCatalogPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // QR scan handler — QR code contains the tool UUID
  const handleQRScan = async (text) => {
    try {
      // The QR code might be a UUID directly, or a URL containing the UUID
      const toolId = text.includes("/") ? text.split("/").pop() : text;
      // Validate it's a real tool
      const data = await getTool(toolId);
      if (data?.data) {
        toast.success(`Found: ${data.data.name}`);
        navigate(`/tools/${toolId}`);
      } else {
        toast.error("Tool not found for this QR code");
      }
    } catch {
      toast.error("Could not find a tool with this QR code");
    }
  };
  const [statusFilter, setStatusFilter] = useState("");
  const [borrowModal, setBorrowModal] = useState(null); // tool to borrow

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
            Tool Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and borrow shop tools
          </p>
        </div>
        <QRScannerButton onScan={handleQRScan} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total || 0} color="slate" />
        <StatCard label="Available" value={stats.available || 0} color="emerald" />
        <StatCard label="Borrowed" value={stats.borrowed || 0} color="amber" />
        <StatCard label="Maintenance" value={(stats.maintenance || 0) + (stats.damaged || 0)} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools..."
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
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="borrowed">Borrowed</option>
          <option value="maintenance">Maintenance</option>
          <option value="damaged">Damaged</option>
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
          <p className="text-slate-500 text-sm">No tools found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onBorrow={() => setBorrowModal(tool)}
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

function ToolCard({ tool, onBorrow }) {
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
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[tool.status]}`}>
              {STATUS_LABELS[tool.status]}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {CATEGORIES.find((c) => c.value === tool.category)?.label || tool.category}
          </p>
          {tool.serial_number && (
            <p className="text-xs text-slate-400 mt-0.5">SN: {tool.serial_number}</p>
          )}
          <p className="text-xs text-slate-400">📍 {tool.location}</p>
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
          {tool.status === "available" && (
            <button
              onClick={onBorrow}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Borrow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BorrowModal({ tool, onClose, onSuccess }) {
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
  );
  const assignedROs = rosData?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => borrowTool(data),
    onSuccess: () => {
      toast.success(`Borrowed ${tool.name}`);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  // When user selects an RO, auto-fill purpose/vehicle and fetch recommendations
  const handleSelectRO = async (ro) => {
    setSelectedRO(ro);
    setPurpose(ro.jobsDisplay);
    setVehicle(ro.vehicleDisplay);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentToolsUser) {
      toast.error("Your account is not linked to a tools user. Contact admin.");
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
      toast.success(`Purchase request sent for ${rec.toolName}`);
    } catch (err) {
      toast.error("Failed to submit request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Borrow: {tool.name}
          </h3>

          {/* ── Step 1: Select RO or Manual ────────────────────────────── */}
          {step === "select-ro" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-500">Select the vehicle you're working on:</p>

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
                  No assigned vehicles found
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
                    <p className="text-sm font-semibold text-slate-700">Other / Manual Entry</p>
                    <p className="text-xs text-slate-400">Vehicle not listed or not yet assigned</p>
                  </div>
                </div>
              </button>

              <button type="button" onClick={onClose} className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          )}

          {/* ── Step 2: Manual entry form ──────────────────────────────── */}
          {step === "manual" && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Purpose *</label>
                <input
                  type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} required
                  placeholder="e.g., Brake diagnostics"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Vehicle</label>
                <input
                  type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
                  placeholder="e.g., 2020 Honda Civic"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Return in</label>
                <select value={hours} onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours (1 shift)</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep("select-ro")}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Back
                </button>
                <button type="submit" disabled={mutation.isPending || !purpose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {mutation.isPending ? "Borrowing..." : "Confirm Borrow"}
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
                <p className="text-xs text-sky-700">RO #{selectedRO?.repairOrderNumber} — {selectedRO?.jobsDisplay}</p>
              </div>

              {/* Duration selector */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Return in</label>
                <select value={hours} onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours (1 shift)</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                </select>
              </div>

              {/* Tool recommendations section */}
              {loadingRecs && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Looking up recommended tools...
                </div>
              )}

              {recommendations && (
                <div className="space-y-3">
                  {/* In inventory */}
                  {recommendations.inInventory?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Recommended tools (in stock)
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
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Available</span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">In Use</span>
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
                        Recommended but not in stock
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
                              <span className="text-[10px] font-semibold text-emerald-600">Requested</span>
                            ) : (
                              <button
                                onClick={() => handleRequestPurchase(rec)}
                                className="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                              >
                                <ShoppingCart className="h-2.5 w-2.5" /> Request
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
                  Back
                </button>
                <button onClick={handleSubmit} disabled={mutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
                  {mutation.isPending ? "Borrowing..." : "Confirm Borrow"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
