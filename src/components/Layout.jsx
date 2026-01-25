import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  GraduationCap,
  Home as HomeIcon,
  Layers,
  LineChart,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  Users,
  FolderKanban,
  LogOut
} from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Layout({ user, onSignOut }) {
  const { t } = useTranslation();
  const isAdmin = user?.role === "admin";

  const baseNav = [
    { to: "/", label: t("nav.home"), icon: HomeIcon, end: true },
    { to: "/onboarding", label: t("nav.onboarding"), icon: BookOpen },
    { to: "/training", label: t("nav.training"), icon: GraduationCap },
    { to: "/assessments", label: t("nav.assessments"), icon: Layers },
    { to: "/ai", label: t("nav.aiCoach"), icon: MessageSquare },
    { to: "/progress", label: t("nav.myProgress"), icon: LineChart },
    { to: "/settings", label: t("nav.settings"), icon: SettingsIcon }
  ];

  const adminExtra = isAdmin
    ? [
        { to: "/culture", label: t("nav.culture"), icon: Shield },
        { to: "/admin/users", label: t("nav.users"), icon: Users },
        { to: "/admin/content", label: t("nav.content"), icon: FolderKanban }
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:gap-4 md:border-r md:border-slate-200 md:bg-white md:px-4 md:py-5">
          <Brand />

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium">
                {user?.role}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <LanguageToggle />
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </button>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {baseNav.map((item) => (
              <SideItem key={item.to} {...item} />
            ))}

            {adminExtra.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 px-3 text-xs font-semibold uppercase text-slate-500">
                  {t("nav.admin")}
                </p>
                {adminExtra.map((item) => (
                  <SideItem key={item.to} {...item} />
                ))}
              </div>
            )}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <TopBar onSignOut={onSignOut} />
          <div className="mx-auto max-w-6xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
        <Shield className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-extrabold">{t("appName")}</p>
        <p className="text-xs text-slate-500">{t("brand.tagline")}</p>
      </div>
    </div>
  );
}

function SideItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold",
          isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100"
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function TopBar({ onSignOut }) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <input
          className="hidden md:block w-[420px] rounded-2xl border px-4 py-2 text-sm"
          placeholder={t("common.search")}
        />
        <button
          onClick={onSignOut}
          className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
        >
          {t("auth.signOut")}
        </button>
      </div>
    </div>
  );
}
