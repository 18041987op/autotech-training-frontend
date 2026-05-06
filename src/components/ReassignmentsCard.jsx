/**
 * ReassignmentsCard — shown on /production page.
 *
 * Lists job reassignments where the current employee was the FROM tech
 * (i.e., a job they were assigned to was moved to someone else after it
 * was authorized — possibly after they had already marked it complete).
 *
 * Hours from these jobs are NOT counted in the tech's production totals
 * — they belong to whoever the work was reassigned to. This card just
 * makes them visible so the tech can spot accidental or malicious
 * reassignments and flag them for investigation.
 */

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, CheckCircle2, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { getMyReassignments, updateReassignment } from "../lib/productionApi";

function fmtDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleDateString();
}
function fmtMoney(n) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

export default function ReassignmentsCard({ email, weekStart, weekEnd }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["my-reassignments", email, weekStart, weekEnd],
    queryFn: () => getMyReassignments(email, { weekStart, weekEnd }),
    enabled: !!email,
  });

  const ackMut = useMutation({
    mutationFn: ({ id, action }) => updateReassignment({ id, action, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-reassignments"] });
    },
    onError: (e) => toast.error(e?.message || "Update failed"),
  });

  const items = data?.reassignments || [];
  // Only show un-acknowledged + recent ones
  const visible = useMemo(
    () => items.filter((r) => !r.acknowledged_by_tech && !r.reported_as_suspicious),
    [items]
  );

  const totals = useMemo(() => {
    return visible.reduce(
      (acc, r) => ({
        count: acc.count + 1,
        hours: acc.hours + Number(r.labor_hours || 0),
        labor: acc.labor + Number(r.labor_sub_total || 0),
      }),
      { count: 0, hours: 0, labor: 0 }
    );
  }, [visible]);

  if (isLoading || visible.length === 0) return null;

  return (
    <div className="card border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-amber-900 text-sm">
            {t(
              "production.reassignments.headline",
              "{{count}} job{{plural}} reassigned away from you",
              { count: totals.count, plural: totals.count === 1 ? "" : "s" }
            )}
          </div>
          <div className="text-xs text-amber-800 mt-0.5">
            {t(
              "production.reassignments.summary",
              "{{hours}}h, {{labor}} in labor — these are NOT counted in your production totals.",
              { hours: totals.hours.toFixed(1), labor: fmtMoney(totals.labor) }
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-700" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-700" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {visible.map((r) => (
            <div
              key={r.id}
              className={`p-3 rounded-lg bg-white border ${
                r.ro_was_posted
                  ? "border-red-200"
                  : r.was_completed
                  ? "border-amber-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-medium text-slate-900">
                      RO #{r.ro_number || "?"}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{r.category_name || "—"}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">
                      {Number(r.labor_hours || 0).toFixed(1)}h · {fmtMoney(r.labor_sub_total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                    <span className="font-medium text-red-700">You</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-medium text-emerald-700">{r.to_tech_name}</span>
                    <span className="text-slate-400">·</span>
                    <span>{fmtDate(r.reassigned_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.ro_was_posted && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[11px]">
                        {t("production.reassignments.roPosted", "RO already posted")}
                      </span>
                    )}
                    {r.was_completed && !r.ro_was_posted && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[11px]">
                        {t("production.reassignments.wasCompleted", "After you completed it")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => ackMut.mutate({ id: r.id, action: "ack" })}
                    disabled={ackMut.isPending}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 inline-flex items-center gap-1.5"
                    title={t(
                      "production.reassignments.ackHint",
                      "I've seen this — looks fine"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("production.reassignments.ack", "Acknowledge")}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            "production.reassignments.reportConfirm",
                            "Report this reassignment as suspicious? Admin will review."
                          )
                        )
                      ) {
                        ackMut.mutate({ id: r.id, action: "report" });
                      }
                    }}
                    disabled={ackMut.isPending}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1.5"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {t("production.reassignments.report", "Report")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
