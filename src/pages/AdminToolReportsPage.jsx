import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, AlertTriangle, Clock, Users } from "lucide-react";
import { getToolsReport, getToolStats } from "../lib/toolsApi";

export function AdminToolReportsPage() {
  const [reportType, setReportType] = useState("late-returns");

  const { data: statsData } = useQuery({
    queryKey: ["toolStats"],
    queryFn: getToolStats,
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["toolsReport", reportType],
    queryFn: () => getToolsReport(reportType),
  });

  const stats = statsData?.stats || {};
  const report = reportData?.report || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-sky-600" />
          Tool Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Accountability and usage analytics
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400">Total Tools</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-emerald-500">Available</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.available || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-amber-500">Borrowed</p>
          <p className="text-2xl font-bold text-amber-700">{stats.borrowed || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-red-500">Damaged</p>
          <p className="text-2xl font-bold text-red-700">{stats.damaged || 0}</p>
        </div>
      </div>

      {/* Report type toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setReportType("late-returns")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            reportType === "late-returns" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> Late Returns
        </button>
        <button
          onClick={() => setReportType("damaged-returns")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            reportType === "damaged-returns" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Damaged Returns
        </button>
      </div>

      {/* Report table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  <Users className="h-4 w-4 inline mr-1" /> Technician
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">
                  {reportType === "late-returns" ? "Late Count" : "Damage Count"}
                </th>
                {reportType === "late-returns" && (
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">
                    Avg Hours Late
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : report.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400">
                    No data for this report
                  </td>
                </tr>
              ) : (
                report.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.technician_name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block min-w-[32px] text-center font-bold text-xs px-2 py-0.5 rounded-full ${
                        (row.late_count || row.damaged_count || 0) > 3
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {row.late_count || row.damaged_count || 0}
                      </span>
                    </td>
                    {reportType === "late-returns" && (
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.avg_hours_late != null ? `${Number(row.avg_hours_late).toFixed(1)}h` : "—"}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
