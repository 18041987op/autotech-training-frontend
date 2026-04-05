import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Wrench, Clock,
  AlertTriangle, CheckCircle, ArrowRightLeft,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import {
  getTool, getLoans, returnTool, transferTool, getToolsUsers,
} from "../lib/toolsApi";

const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-700",
  borrowed: "bg-amber-100 text-amber-700",
  maintenance: "bg-blue-100 text-blue-700",
  damaged: "bg-red-100 text-red-700",
};

export function ToolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [returnModal, setReturnModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);

  const { data: toolData, isLoading } = useQuery({
    queryKey: ["tool", id],
    queryFn: () => getTool(id),
  });

  const { data: loansData } = useQuery({
    queryKey: ["toolLoans", id],
    queryFn: () => getLoans({ tool_id: id }),
  });

  const tool = toolData?.data;
  const loans = loansData?.data || [];
  const activeLoan = loans.find((l) => l.status === "active");

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
        <p className="text-slate-500">Tool not found</p>
        <Link to="/tools" className="text-sm text-sky-600 hover:underline mt-2 inline-block">
          Back to catalog
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
        <ArrowLeft className="h-4 w-4" /> Back to catalog
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
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[tool.status]}`}>
                {tool.status}
              </span>
            </div>
            {tool.description && (
              <p className="text-sm text-slate-600 mt-2">{tool.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <InfoRow label="Category" value={tool.category} />
              <InfoRow label="Location" value={tool.location} />
              <InfoRow label="Serial #" value={tool.serial_number || "—"} />
              <InfoRow label="Part #" value={tool.part_number || "—"} />
              <InfoRow label="Cost" value={`$${Number(tool.cost || 0).toFixed(2)}`} />
              <InfoRow label="Purchase" value={tool.purchase_date || "—"} />
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
              <span className="text-xs text-slate-400">Scan QR</span>
            </div>
          )}
        </div>
      </div>

      {/* Active loan info */}
      {activeLoan && (
        <div className="card p-5 border-l-4 border-l-amber-400 bg-amber-50/50">
          <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Currently Borrowed
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Technician" value={activeLoan.technician_name || activeLoan.technician_id} />
            <InfoRow label="Purpose" value={activeLoan.purpose} />
            <InfoRow label="Vehicle" value={activeLoan.vehicle || "—"} />
            <InfoRow label="Borrowed" value={new Date(activeLoan.borrowed_at).toLocaleDateString()} />
            <InfoRow
              label="Expected Return"
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
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setReturnModal(activeLoan)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Return Tool
            </button>
            <button
              onClick={() => setTransferModal(activeLoan)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
            </button>
          </div>
        </div>
      )}

      {/* Loan history */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 text-sm p-4 border-b border-slate-100">
          Loan History
        </h3>
        {loans.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">No loan history</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <div key={loan.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {loan.technician_name || "Unknown"} — {loan.purpose}
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
                  {loan.status}
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
  const [condition, setCondition] = useState("good");
  const [damageDesc, setDamageDesc] = useState("");
  const [wasNeeded, setWasNeeded] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => returnTool(loan.id, data),
    onSuccess: () => {
      toast.success("Tool returned successfully");
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
        <h3 className="text-lg font-bold text-slate-900 mb-4">Return Tool</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Condition</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Damage Description *</label>
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
              Was this tool needed for the job?
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
            <p className="text-xs text-slate-400 mt-1">This helps improve future tool recommendations</p>
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

function TransferModal({ loan, onClose, onSuccess }) {
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
      toast.success("Tool transferred");
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
        <h3 className="text-lg font-bold text-slate-900 mb-4">Transfer Tool</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Transfer to *</label>
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
