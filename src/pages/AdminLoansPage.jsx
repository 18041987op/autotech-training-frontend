import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ClipboardList, Clock, AlertTriangle, CheckCircle,
  ArrowRightLeft, Search,
} from "lucide-react";
import { getLoans } from "../lib/toolsApi";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "returned", label: "Returned" },
  { value: "transferred", label: "Transferred" },
];

export function AdminLoansPage() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["allLoans", statusFilter],
    queryFn: () => getLoans(statusFilter ? { status: statusFilter } : {}),
  });

  const loans = (data?.data || []).filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (l.tool_name || "").toLowerCase().includes(s) ||
      (l.technician_name || "").toLowerCase().includes(s) ||
      (l.vehicle || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-sky-600" />
          All Loans
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage all tool borrowing activity
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              statusFilter === tab.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search loans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      {/* Loans table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tool</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Technician</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Purpose</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Borrowed</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Due / Returned</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
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
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No loans found
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const isOverdue = loan.status === "active" && new Date(loan.expected_return) < new Date();
                  return (
                    <tr key={loan.id} className={`hover:bg-slate-50/50 ${isOverdue ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <Link to={`/tools/${loan.tool_id}`} className="font-medium text-slate-900 hover:text-sky-600">
                          {loan.tool_name || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{loan.technician_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{loan.purpose}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                        {new Date(loan.borrowed_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {loan.status === "returned" || loan.status === "transferred" ? (
                          <span className="text-slate-500">
                            {loan.actual_return ? new Date(loan.actual_return).toLocaleDateString() : "—"}
                          </span>
                        ) : (
                          <span className={isOverdue ? "text-red-600 font-semibold" : "text-slate-500"}>
                            {new Date(loan.expected_return).toLocaleString()}
                            {isOverdue && " ⚠️"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <LoanStatusBadge status={loan.status} isOverdue={isOverdue} condition={loan.return_condition_status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoanStatusBadge({ status, isOverdue, condition }) {
  if (status === "active" && isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <AlertTriangle className="h-3 w-3" /> OVERDUE
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <Clock className="h-3 w-3" /> Active
      </span>
    );
  }
  if (status === "returned") {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
        condition === "damaged" ? "text-red-700 bg-red-100" : "text-emerald-700 bg-emerald-100"
      }`}>
        {condition === "damaged" ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
        {condition === "damaged" ? "Damaged" : "Returned"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
      <ArrowRightLeft className="h-3 w-3" /> Transferred
    </span>
  );
}
