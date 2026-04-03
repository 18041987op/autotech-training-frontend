import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Wrench, Search, Plus, Package,
  X, Eye,
} from "lucide-react";
import { getTools, getToolStats, borrowTool, getToolsUsers, getTool } from "../lib/toolsApi";
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
      if (data?.tool) {
        toast.success(`Found: ${data.tool.name}`);
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

  const tools = toolsData?.tools || [];
  const stats = statsData?.stats || {};

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
  const [purpose, setPurpose] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [hours, setHours] = useState("8");

  const { data: usersData } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
  });

  const user = window.__APP_USER__;
  // Try to find the matching tools_user by email
  const toolsUsers = usersData?.users || [];
  const currentToolsUser = toolsUsers.find(
    (u) => u.email === user?.email || u.work_email === user?.email
  );

  const mutation = useMutation({
    mutationFn: (data) => borrowTool(data),
    onSuccess: () => {
      toast.success(`Borrowed ${tool.name}`);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentToolsUser) {
      toast.error("Your account is not linked to a tools user. Contact admin.");
      return;
    }
    mutation.mutate({
      tool_id: tool.id,
      technician_id: currentToolsUser.id,
      purpose,
      vehicle,
      expected_return: new Date(Date.now() + Number(hours) * 3600000).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Borrow: {tool.name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Purpose *</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              placeholder="e.g., Brake diagnostics"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle</label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g., 2020 Honda Civic"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Return in (hours)</label>
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours (1 shift)</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !purpose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
            >
              {mutation.isPending ? "Borrowing..." : "Confirm Borrow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
