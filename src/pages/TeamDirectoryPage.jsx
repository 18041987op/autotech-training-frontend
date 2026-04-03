import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Mail, Phone, Briefcase } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { getTeamDirectory } from "../lib/hrApi";

export function TeamDirectoryPage() {
  const [search, setSearch] = useState("");
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["teamDirectory", showInactive],
    queryFn: () => getTeamDirectory(showInactive),
  });

  const allMembers = data?.data || [];
  const members = allMembers.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (m.employee_name || "").toLowerCase().includes(s) ||
      (m.role || "").toLowerCase().includes(s) ||
      (m.department || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-sky-600" />
          Team Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {members.length} team member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search + admin toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show inactive
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No team members found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div key={member.emp_id} className={`card p-4 ${!member.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-sky-700">
                    {(member.employee_name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{member.employee_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Briefcase className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500 capitalize">{member.role || "—"}</span>
                  </div>
                  {member.department && (
                    <p className="text-xs text-slate-400 mt-0.5">{member.department}</p>
                  )}
                  {member.work_email && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <a href={`mailto:${member.work_email}`} className="text-xs text-sky-600 hover:underline truncate">
                        {member.work_email}
                      </a>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{member.phone}</span>
                    </div>
                  )}
                </div>
                {!member.active && (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">INACTIVE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
