import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Wrench, Clock, AlertTriangle, CheckCircle,
  ArrowRightLeft, Package, ThumbsUp, ThumbsDown,
  Bell, Check, XCircle,
} from "lucide-react";
import { getMyTools, returnTool, transferTool, getToolsUsers, getTransferRequests, respondTransferRequest } from "../lib/toolsApi";
import { useAuthStore } from "../stores/authStore";

export function MyToolsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [returnModal, setReturnModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);

  // Resolve tools_users id
  const { data: usersData } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
    enabled: !!user?.email,
  });
  const toolsUsers = usersData?.data || [];
  const currentToolsUser = toolsUsers.find(
    (u) => u.email === user?.email || u.work_email === user?.email
  ) || toolsUsers.find(
    (u) => user?.name && u.name?.toLowerCase() === user.name.toLowerCase()
  );

  const { data, isLoading } = useQuery({
    queryKey: ["myTools", user?.email],
    queryFn: () => getMyTools(user?.email, user?.name),
    enabled: !!user?.email,
  });

  const loans = data?.data || [];

  // Incoming transfer requests
  const { data: incomingData } = useQuery({
    queryKey: ["transferRequests", currentToolsUser?.id],
    queryFn: () => getTransferRequests({ technician_id: currentToolsUser.id, role: "to", status: "pending" }),
    enabled: !!currentToolsUser?.id,
    refetchInterval: 30000,
  });
  const incomingRequests = incomingData?.data || [];

  const handleRespondTransfer = async (requestId, action) => {
    try {
      await respondTransferRequest(requestId, action);
      toast.success(action === "accept" ? "Tool transferred!" : "Request declined");
      queryClient.invalidateQueries({ queryKey: ["transferRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myTools"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (err) {
      toast.error(err.message || "Failed to respond");
    }
  };

  const handleReturnSuccess = () => {
    setReturnModal(null);
    queryClient.invalidateQueries({ queryKey: ["myTools"] });
    toast.success("Tool returned!");
  };

  const handleTransferSuccess = () => {
    setTransferModal(null);
    queryClient.invalidateQueries({ queryKey: ["myTools"] });
    toast.success("Tool transferred!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-sky-600" />
          My Tools
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tools currently borrowed to you
        </p>
      </div>

      {/* Incoming transfer requests */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2">
          {incomingRequests.map((req) => (
            <div key={req.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {req.requested_by_name} wants "{req.tool_name}"
                </p>
                {req.reason && (
                  <p className="text-xs text-amber-600">{req.reason}</p>
                )}
                <div className="flex gap-2 mt-2">
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
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-2">No tools currently borrowed</p>
          <Link to="/tools" className="text-sm text-sky-600 hover:underline">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const isOverdue = new Date(loan.expected_return) < new Date();
            const isDueSoon = !isOverdue && new Date(loan.expected_return) < new Date(Date.now() + 2 * 3600000);
            return (
              <div
                key={loan.id}
                className={`card p-4 ${isOverdue ? "border-l-4 border-l-red-400" : isDueSoon ? "border-l-4 border-l-amber-400" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {loan.tool_image ? (
                    <img src={loan.tool_image} alt="" className="w-14 h-14 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/tools/${loan.tool_id}`} className="font-semibold text-sm text-slate-900 hover:text-sky-600 truncate">
                        {loan.tool_name || "Tool"}
                      </Link>
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> OVERDUE
                        </span>
                      )}
                      {isDueSoon && !isOverdue && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="h-3 w-3" /> DUE SOON
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{loan.purpose}</p>
                    {loan.vehicle && (
                      <p className="text-xs text-slate-400">{loan.vehicle}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Return by: {new Date(loan.expected_return).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setReturnModal(loan)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" /> Return
                    </button>
                    <button
                      onClick={() => setTransferModal(loan)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                    >
                      <ArrowRightLeft className="h-3 w-3" /> Transfer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reuse modals from ToolDetailPage pattern */}
      {returnModal && (
        <QuickReturnModal
          loan={returnModal}
          onClose={() => setReturnModal(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
      {transferModal && (
        <QuickTransferModal
          loan={transferModal}
          onClose={() => setTransferModal(null)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}

function QuickReturnModal({ loan, onClose, onSuccess }) {
  const [condition, setCondition] = useState("good");
  const [damageDesc, setDamageDesc] = useState("");
  const [wasNeeded, setWasNeeded] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => returnTool(loan.id, data),
    onSuccess,
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
        <h3 className="text-lg font-bold mb-4">Return: {loan.tool_name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            {["good", "damaged"].map((v) => (
              <label key={v} className={`flex-1 p-3 rounded-xl border-2 cursor-pointer text-center text-sm font-medium transition ${
                condition === v
                  ? v === "good" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-500"
              }`}>
                <input type="radio" value={v} checked={condition === v} onChange={() => setCondition(v)} className="sr-only" />
                {v === "good" ? <CheckCircle className="h-5 w-5 mx-auto mb-1" /> : <AlertTriangle className="h-5 w-5 mx-auto mb-1" />}
                {v === "good" ? "Good" : "Damaged"}
              </label>
            ))}
          </div>
          {condition === "damaged" && (
            <textarea
              value={damageDesc}
              onChange={(e) => setDamageDesc(e.target.value)}
              required
              rows={2}
              placeholder="Describe damage..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
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

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-sm py-2.5">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {mutation.isPending ? "..." : "Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickTransferModal({ loan, onClose, onSuccess }) {
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");

  const { data } = useQuery({
    queryKey: ["toolsUsers"],
    queryFn: () => getToolsUsers({ active: "true" }),
  });
  const users = (data?.data || []).filter((u) => u.id !== loan.technician_id);

  const mutation = useMutation({
    mutationFn: (d) => transferTool(loan.id, d),
    onSuccess,
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Transfer: {loan.tool_name}</h3>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ targetTechnicianId: toId, notes }); }} className="space-y-4">
          <select value={toId} onChange={(e) => setToId(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Select technician...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-sm py-2.5">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !toId} className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              {mutation.isPending ? "..." : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
