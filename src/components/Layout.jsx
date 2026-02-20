import React, { useEffect, useRef, useState } from "react";
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
  Wrench,
  MoreHorizontal,
  X,
  ExternalLink
} from "lucide-react";

import { LanguageToggle } from "./LanguageToggle";
import { Breadcrumbs } from "./Breadcrumbs";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "./NotificationCenter";
import { DarkModeToggle } from "./DarkModeToggle";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// ─── App brand constants ────────────────────────────────────────────────────
const COMPANY_NAME    = "AutoRx Training";
const COMPANY_TAGLINE = "Built for your shop";
const FOOTER_LINKS = [
  { label: "Privacy",  href: "#" },
  { label: "Terms",    href: "#" },
  { label: "Support",  href: "mailto:support@autorxtraining.com" },
];

// ─── Layout ─────────────────────────────────────────────────────────────────
export function Layout({ user, onSignOut }) {
  const { t } = useTranslation();
  const isAdmin = user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const baseNav = [
    { to: "/",           label: t("nav.home"),        icon: HomeIcon,       end: true },
    { to: "/onboarding", label: t("nav.onboarding"),  icon: BookOpen },
    { to: "/training",   label: t("nav.training"),    icon: GraduationCap },
    { to: "/assessments",label: t("nav.assessments"), icon: Layers },
    { to: "/ai",         label: t("nav.aiCoach"),     icon: MessageSquare },
    { to: "/progress",   label: t("nav.myProgress"),  icon: LineChart },
    { to: "/culture",    label: t("nav.culture"),     icon: Shield },
  ];

  const adminExtra = isAdmin
    ? [
        { to: "/settings",       label: t("nav.settings"), icon: SettingsIcon },
        { to: "/admin/users",    label: t("nav.users"),    icon: Users },
        { to: "/admin/content",  label: t("nav.content"),  icon: FolderKanban },
      ]
    : [];

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <div className="flex flex-1">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:gap-4 md:border-r md:border-slate-200 md:bg-white md:px-4 md:py-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <Brand />
          <UserCard user={user} />
          <NavSection
            baseNav={baseNav}
            adminExtra={adminExtra}
            showAdmin={adminExtra.length > 0}
          />
        </aside>

        {/* ── Main content area ── */}
        <main className="flex-1 flex flex-col min-h-screen">
          <TopBar
            onSignOut={onSignOut}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />

          <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
            <Breadcrumbs />
            <Outlet context={{ user }} />
          </div>

          {/* ── Page footer ── */}
          <AppFooter />
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
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
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-white shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <BrandInline />
              <button
                type="button"
                onClick={closeMobile}
                className={cx("btn-outline-sm", "px-3")}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <UserCard user={user} />
              <div onClick={closeMobile}>
                <NavSection
                  baseNav={baseNav}
                  adminExtra={adminExtra}
                  showAdmin={adminExtra.length > 0}
                />
              </div>
            </div>

            {/* Drawer footer: sign out */}
            <div className="border-t border-slate-100 p-4">
              <button
                onClick={() => { closeMobile(); onSignOut(); }}
                className="btn-outline-sm w-full"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Brand (sidebar full version) ───────────────────────────────────────────
function Brand() {
  return (
    <div className="flex items-center gap-3 px-2 py-1">
      {/* Logo mark */}
      <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center shadow-sm">
        <Wrench className="h-5 w-5 text-white" />
      </div>
      {/* Text */}
      <div className="leading-tight">
        <p className="text-sm font-extrabold text-slate-900 tracking-tight">{COMPANY_NAME}</p>
        <p className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">{COMPANY_TAGLINE}</p>
      </div>
    </div>
  );
}

// ─── Brand inline (mobile drawer / top bar) ──────────────────────────────────
function BrandInline() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center">
        <Wrench className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-extrabold text-slate-900">{COMPANY_NAME}</span>
    </div>
  );
}

// ─── UserCard ────────────────────────────────────────────────────────────────
function UserCard({ user }) {
  const { t } = useTranslation();
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium capitalize">
          {user?.role}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <LanguageToggle />
        <span className="text-xs font-semibold text-slate-500">
          {t("common.language")}
        </span>
      </div>
    </div>
  );
}

// ─── NavSection ──────────────────────────────────────────────────────────────
function NavSection({ baseNav, adminExtra, showAdmin }) {
  const { t } = useTranslation();
  return (
    <nav className="flex flex-col gap-1">
      {baseNav.map((item) => (
        <SideItem key={item.to} {...item} />
      ))}
      {showAdmin ? (
        <div className="mt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-slate-400 tracking-wider">
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
      className={({ isActive }) => (isActive ? "nav-item-active" : "nav-item-idle")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────
function TopBar({ onSignOut, onOpenMobileMenu }) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">

        {/* Left: mobile hamburger + brand OR desktop search */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden btn-outline-sm px-2"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Brand logo (mobile only — desktop has sidebar) */}
          <div className="md:hidden">
            <BrandInline />
          </div>

          {/* Search (desktop only) */}
          <div className="hidden md:block w-[420px]">
            <GlobalSearch />
          </div>
        </div>

        {/* Right: desktop shows all icons, mobile shows "⋯" dropdown */}
        <div className="flex items-center gap-2">
          {/* Desktop: all icons visible */}
          <div className="hidden md:flex items-center gap-2">
            <NotificationCenter />
            <DarkModeToggle />
            <button
              onClick={onSignOut}
              className="btn-outline-sm"
              title={t("auth.signOut")}
              aria-label={t("auth.signOut")}
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile: collapsed into ⋯ dropdown */}
          <div className="md:hidden relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="btn-outline-sm px-2"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden z-30">
                {/* Notifications row */}
                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                  <NotificationCenter />
                  <span className="text-sm text-slate-700">Notifications</span>
                </div>

                {/* Dark mode row */}
                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                  <DarkModeToggle />
                  <span className="text-sm text-slate-700">Theme</span>
                </div>

                {/* Sign out row */}
                <button
                  onClick={() => { setMoreOpen(false); onSignOut(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  {t("auth.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Footer ──────────────────────────────────────────────────────────────
function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Left: brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-brand-primary flex items-center justify-center">
              <Wrench className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-extrabold text-slate-800">{COMPANY_NAME}</span>
              <span className="ml-2 text-xs text-slate-400">·</span>
              <span className="ml-2 text-xs text-slate-400">{COMPANY_TAGLINE}</span>
            </div>
          </div>

          {/* Right: links + copyright */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {FOOTER_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="hover:text-brand-primary transition-colors flex items-center gap-0.5"
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
              >
                {l.label}
                {l.href.startsWith("http") && <ExternalLink className="h-2.5 w-2.5 ml-0.5" />}
              </a>
            ))}
            <span className="text-slate-300">·</span>
            <span>© {year} {COMPANY_NAME}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
