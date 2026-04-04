import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wrench, Plus, Pencil, Trash2, Search,
  Package, Settings,
} from "lucide-react";
import {
  getTools, createTool, updateTool, deleteTool,
  updateToolStatus, getToolStats,
} from "../lib/toolsApi";

const CATEGORIES = [
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

const STATUS_OPTIONS = ["available", "borrowed", "maintenance", "damaged"];

const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-700",
  borrowed: "bg-amber-100 text-amber-700",
  maintenance: "bg-blue-100 text-blue-700",
  damaged: "bg-red-100 text-red-700",
};

export function AdminToolsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(null); // null | 'new' | tool object
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: toolsData, isLoading } = useQuery({
    queryKey: ["tools", { search }],
    queryFn: () => getTools(search ? { search } : {}),
  });

  const { data: statsData } = useQuery({
    queryKey: ["toolStats"],
    queryFn: getToolStats,
  });

  const tools = toolsData?.data || [];
  const stats = statsData?.data || {};

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTool(id),
    onSuccess: () => {
      toast.success("Tool deleted");
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["toolStats"] });
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateToolStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["toolStats"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-sky-600" />
            Tool Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total || 0} tools · ${Number(stats.total_value || 0).toLocaleString()} inventory value
          </p>
        </div>
        <button
          onClick={() => setEditModal("new")}
          className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> Add Tool
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tool</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Location</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Cost</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No tools found
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tool.image_url ? (
                          <img src={tool.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Wrench className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{tool.name}</p>
                          {tool.serial_number && (
                            <p className="text-xs text-slate-400">SN: {tool.serial_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                      {CATEGORIES.find((c) => c.value === tool.category)?.label || tool.category}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={tool.status}
                        onChange={(e) => statusMutation.mutate({ id: tool.id, status: e.target.value })}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[tool.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">{tool.location}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-right text-slate-600">
                      ${Number(tool.cost || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditModal(tool)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(tool)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {editModal && (
        <ToolFormModal
          tool={editModal === "new" ? null : editModal}
          onClose={() => setEditModal(null)}
          onSuccess={() => {
            setEditModal(null);
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            queryClient.invalidateQueries({ queryKey: ["toolStats"] });
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Tool?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolFormModal({ tool, onClose, onSuccess }) {
  const isNew = !tool;
  const [form, setForm] = useState({
    name: tool?.name || "",
    category: tool?.category || "otros",
    serial_number: tool?.serial_number || "",
    location: tool?.location || "Shop",
    description: tool?.description || "",
    cost: tool?.cost || "",
    part_number: tool?.part_number || "",
    purchase_date: tool?.purchase_date || "",
    image_url: tool?.image_url || "",
    comments: tool?.comments || "",
  });

  const mutation = useMutation({
    mutationFn: (data) => isNew ? createTool(data) : updateTool(tool.id, data),
    onSuccess: () => {
      toast.success(isNew ? "Tool created" : "Tool updated");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {isNew ? "Add New Tool" : `Edit: ${tool.name}`}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={set("name")} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
              <select value={form.category} onChange={set("category")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Location *</label>
              <input type="text" value={form.location} onChange={set("location")} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Serial #</label>
              <input type="text" value={form.serial_number} onChange={set("serial_number")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Part #</label>
              <input type="text" value={form.part_number} onChange={set("part_number")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cost ($)</label>
              <input type="number" step="0.01" value={form.cost} onChange={set("cost")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Purchase Date</label>
              <input type="date" value={form.purchase_date} onChange={set("purchase_date")} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Image URL</label>
              <input type="url" value={form.image_url} onChange={set("image_url")} placeholder="https://..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} onChange={set("description")} rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending || !form.name} className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isNew ? "Create Tool" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
