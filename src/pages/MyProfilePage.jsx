import React from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Phone, Briefcase, Calendar, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { getMyProfile } from "../lib/hrApi";

export function MyProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["myProfile", user?.email],
    queryFn: () => getMyProfile(user?.email),
    enabled: !!user?.email,
  });

  const profile = data?.data || null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-sky-600" />
          {t("hr.profile.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t("hr.profile.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !profile ? (
        <div className="card p-8 text-center">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Profile not found. Contact your administrator.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          <ProfileRow icon={User} label={t("hr.profile.name")} value={profile.employee_name} />
          <ProfileRow icon={Mail} label={t("hr.profile.email")} value={profile.work_email || user?.email} />
          <ProfileRow icon={Phone} label={t("hr.profile.phone")} value={profile.phone || "—"} />
          <ProfileRow icon={Briefcase} label={t("hr.profile.role")} value={profile.role || user?.role} />
          <ProfileRow icon={Shield} label={t("hr.profile.department")} value={profile.department || "—"} />
          <ProfileRow icon={Calendar} label={t("hr.profile.startDate")} value={profile.start_date ? new Date(profile.start_date).toLocaleDateString() : "—"} />
          <ProfileRow icon={Briefcase} label={t("hr.profile.payType")} value={profile.pay_type || "—"} />
          <ProfileRow icon={Briefcase} label={t("hr.profile.status")} value={profile.active ? t("hr.profile.statusActive") : t("hr.profile.statusInactive")} />
        </div>
      )}
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <span className="text-xs font-medium text-slate-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium">{value}</span>
    </div>
  );
}
