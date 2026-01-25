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

  const nav = [
    { to: "/", label: t("nav.home"), icon: HomeIcon, end: true },
    { to: "/onboarding", label: t("nav.onboarding"), icon: BookOpen },
    { to: "/training", label: t("nav.training"), icon: GraduationCap },
    { to: "/culture", label: t("nav.culture"), icon: Shield },
    { to: "/evaluations", label: t("nav.evaluations"), icon: Layers },
    { to: "/ai", label: t("nav.aiCoach"), icon: MessageSquare },
    { to: "/progress", label: t("nav.myProgress"), icon: LineChart },
    { to: "/settings", label: t("nav.settings"), icon: SettingsIcon }
  ];

  const adminNav =
    user?.role === "admin"
      ? [
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
                <p className="truncate text-sm font-semibold">{user?.name || "User"}</p>
                <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                {user?.role || "user"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <LanguageToggle />
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </button>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <SideItem key={item.to} {...item} />
            ))}

            {adminNav.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("nav.admin")}
                </p>
                <div className="flex flex-col gap-1">
                  {adminNav.map((item) => (
                    <SideItem key={item.to} {...item} />
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold">UI Shell (Option A)</p>
            <p className="mt-1">Layout + navigation + language switch only.</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <TopBar onSignOut={onSignOut} />
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
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
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
        <Shield className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold tracking-tight">{t("appName")}</p>
        <p className="truncate text-xs text-slate-500">Company learning + culture</p>
      </div>
    </div>
  );
}

function SideItem({ to, label, icon: Icon, end }) {
  const base = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition";
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(base, isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")
      }
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function TopBar({ onSignOut }) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="md:hidden">
          <div className="text-sm font-extrabold">{t("appName")}</div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:justify-between">
          <div className="hidden md:block">
            <SearchInput />
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <LanguageToggle />
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {t("auth.signOut")}
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchInput />
      </div>
    </div>
  );
}

function SearchInput() {
  const { t } = useTranslation();
  return (
    <input
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 md:w-[420px]"
      placeholder={t("common.search")}
    />
  );
}
