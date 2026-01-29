import React, { useState } from "react";
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
  LogOut,
  Menu,
  X
} from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Layout({ user, onSignOut }) {
  const { t } = useTranslation();
  const isAdmin = user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:gap-4 md:border-r md:border-slate-200 md:bg-white md:px-4 md:py-5">
          <Brand />
          <UserCard user={user} onSignOut={onSignOut} />

          <NavSection
            baseNav={baseNav}
            adminExtra={adminExtra}
            showAdmin={adminExtra.length > 0}
          />
        </aside>

        {/* Main */}
        <main className="flex-1">
          <TopBar
            onSignOut={onSignOut}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />

          <div className="mx-auto max-w-6xl px-4 py-6">
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 bg-black/40"
            onClick={closeMobile}
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="brand-icon h-9 w-9">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-extrabold">{t("appName")}</p>
                  <p className="text-xs text-slate-500">{t("brand.tagline")}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMobile}
                className={cx("btn-outline-sm", "px-3")}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <UserCard user={user} onSignOut={onSignOut} />

              <div onClick={closeMobile}>
                <NavSection
                  baseNav={baseNav}
                  adminExtra={adminExtra}
                  showAdmin={adminExtra.length > 0}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Brand() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="brand-icon h-10 w-10">
        <Shield className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-extrabold">{t("appName")}</p>
        <p className="text-xs text-slate-500">{t("brand.tagline")}</p>
      </div>
    </div>
  );
}

function UserCard({ user, onSignOut }) {
  const { t } = useTranslation();

  return (
    <div className="card p-3">
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
        <button onClick={onSignOut} className="btn-outline-sm">
          <LogOut className="h-4 w-4" />
          {t("auth.signOut")}
        </button>
      </div>
    </div>
  );
}

function NavSection({ baseNav, adminExtra, showAdmin }) {
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1">
      {baseNav.map((item) => (
        <SideItem key={item.to} {...item} />
      ))}

      {showAdmin ? (
        <div className="mt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-slate-500">
            {t("nav.admin")}
          </p>
          {adminExtra.map((item) => (
            <SideItem key={item.to} {...item} />
          ))}
        </div>
      ) : null}
    </nav>
  );
}

function SideItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive ? "nav-item-active" : "nav-item-idle"
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function TopBar({ onSignOut, onOpenMobileMenu }) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={cx("md:hidden", "btn-outline-sm")}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>

        <input
          className="hidden md:block w-[420px] input-brand"
          placeholder={t("common.search")}
        />

        <button onClick={onSignOut} className="btn-outline-sm">
          {t("auth.signOut")}
        </button>
      </div>
    </div>
  );
}
