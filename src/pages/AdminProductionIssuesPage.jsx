/**
 * AdminProductionIssuesPage — admin/administrative-only page to review
 * production-issue reports filed by technicians/SAs from "My Production".
 *
 * Workflow: open → reviewed → resolved | dismissed
 * Action: change status + add admin notes (audit trail).
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, Clock, CheckCircle, XCircle, Eye,
  Inbox, FileText, ChevronRight,
} from "lucide-react";
import { useAuthStore, useAuthReady } from "../stores/authStore";
import { listProductionIssues, updateProductionIssue } from "../lib/productionApi";
import { PageHero } from "../components/PageHero";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const STATUS_TABS = [
  { key: "open",      labelKey: "production.admin.tabs.open",      Icon: Inbox },
  { key: "reviewed",  labelKey: "production.admin.tabs.reviewed",  Icon: Eye },
  { key: "resolved",  labelKey: "production.admin.tabs.resolved",  Icon: CheckCircle },
  { key: "dismissed", labelKey: "production.admin.tabs.dismissed", Icon: XCircle },
];

const STATUS_PILL = {
  open:      "bg-amber-100 text-amber-700 border-amber-200",
  reviewed:  "bg-sky-100   text-sky-700   border-sky-200",
  resolved:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-600 border-slate-200",
};

function fmtDateShort(d) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function AdminProductionIssuesPage() {
  const { t } = useTranslation();
  const ready = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const hasElevated = useAuthStore((s) => s.hasElevatedAccess());
  const [tab, setTab] = useState("open");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["production-issues", tab],
    queryFn: () => listProductionIssues({ status: tab, limit: 200 }),
    enabled: hasElevated,
    staleTime: 30 * 1000,
  });

  // Always fetch counts across all statuses for the tab badges (lightweight separate calls)
  const allCounts = useQuery({
    queryKey: ["production-issues-counts"],
    queryFn: async () => {
      const all = await listProductionIssues({ limit: 500 });
      return all.counts || {};
    },
    enabled: hasElevated,
    staleTime: 30 * 1000,
  });

  if (!ready) return <LoadingSkeleton />;

  if (!hasElevated) {
    return (
      <div className="card p-6 text-sm text-red-700 bg-red-50 border border-red-200">
        {t("production.admin.notAllowed", "You don't have access to this page.")}
      </div>
    );
  }

  const reports = data?.reports || [];

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("nav.admin", "Admin")}
        title={t("production.admin.title", "Production Issue Reports")}
        subtitle={t(
          "production.admin.subtitle",
          "Review reports submitted by technicians/SAs before payroll closes."
        )}
      />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => {
          const count = allCounts.data?.[s.key] || 0;
          const active = tab === s.key;
          const Icon = s.Icon;
          return (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border flex items-center gap-1.5
                ${active
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(s.labelKey)}
              {count > 0 && (
                <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                  ${active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error?.message || t("production.admin.errorLoad", "Could not load reports")}
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center text-slate-500 text-sm">
          <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          {t("production.admin.empty", "No reports in this status")}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} reviewerEmail={user?.email} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, reviewerEmail, t }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(report.status === "open");
  const [notes, setNotes] = useState(report.admin_notes || "");

  const update = useMutation({
    mutationFn: (payload) => updateProductionIssue({ ...payload, id: report.id, reviewed_by_email: reviewerEmail }),
    onSuccess: () => {
      toast.success(t("production.admin.updated", "Report updated"));
      queryClient.invalidateQueries({ queryKey: ["production-issues"] });
      queryClient.invalidateQueries({ queryKey: ["production-issues-counts"] });
    },
    onError: (e) => toast.error(e?.message || t("production.admin.updateError", "Update failed")),
  });

  const setStatus = (status) => update.mutate({ status, admin_notes: notes });
  const saveNotes = () => update.mutate({ admin_notes: notes });

  return (
    <div className="card overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 flex items-center gap-3"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {report.employee_name || t("production.admin.unknownEmployee", "Unknown employee")}
            {report.employee_role && <span className="font-normal text-slate-500"> · {report.employee_role}</span>}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {t("production.admin.reportedFor", "Reported for")} {fmtDateShort(report.report_date)}
            {" · "}
            {t("production.admin.submittedAt", "Submitted")} {fmtDateTime(report.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {report.issue_type && (
            <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
              {t(`production.issueTypes.${report.issue_type}`, report.issue_type)}
            </span>
          )}
          <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border ${STATUS_PILL[report.status]}`}>
            {t(`production.admin.tabs.${report.status}`, report.status)}
          </span>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              {t("production.admin.description", "Description from technician")}
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white border border-slate-200 rounded-xl p-3">
              {report.description}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">
              {t("production.admin.adminNotes", "Admin notes (audit trail)")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={t("production.admin.notesPlaceholder", "What did you do? e.g. Adjusted RO #12345 in payroll.")}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-y bg-white"
            />
            {notes !== (report.admin_notes || "") && (
              <button
                onClick={saveNotes}
                disabled={update.isPending}
                className="mt-2 btn-outline-sm text-xs"
                type="button"
              >
                {t("production.admin.saveNotes", "Save notes")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            {report.status !== "reviewed" && report.status === "open" && (
              <button
                onClick={() => setStatus("reviewed")}
                disabled={update.isPending}
                className="btn-outline-sm text-sky-700 border-sky-300 hover:bg-sky-50 flex items-center gap-1.5"
                type="button"
              >
                <Eye className="h-3.5 w-3.5" />
                {t("production.admin.markReviewed", "Mark reviewed")}
              </button>
            )}
            {report.status !== "resolved" && (
              <button
                onClick={() => setStatus("resolved")}
                disabled={update.isPending}
                className="btn-primary-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-700 flex items-center gap-1.5"
                type="button"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {t("production.admin.markResolved", "Mark resolved")}
              </button>
            )}
            {report.status !== "dismissed" && (
              <button
                onClick={() => setStatus("dismissed")}
                disabled={update.isPending}
                className="btn-outline-sm text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                type="button"
              >
                <XCircle className="h-3.5 w-3.5" />
                {t("production.admin.dismiss", "Dismiss")}
              </button>
            )}
            {report.reviewed_at && (
              <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {report.reviewed_by_name && `${t("production.admin.reviewedBy", "By")} ${report.reviewed_by_name} · `}
                {fmtDateTime(report.resolved_at || report.reviewed_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
