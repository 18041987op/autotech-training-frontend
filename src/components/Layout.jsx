import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  GraduationCap,
  Home as HomeIcon,
  KeyRound,
  Layers,
  Lightbulb,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Menu,
  MoreHorizontal,
  Wrench,
  X,
  ExternalLink,
  BarChart2,
  Gauge,
  Package,
  ClipboardList,
  User,
  CalendarDays,
  Clock,
  CalendarOff,
  Heart,
  Users,
  UserCog,
} from "lucide-react";

import { Breadcrumbs } from "./Breadcrumbs";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "./NotificationCenter";
import { DarkModeToggle } from "./DarkModeToggle";
import { QuickActions } from "./QuickActions";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// Logo — place your logo at public/logo.png
// Falls back to the wrench icon if the image fails to load
const LOGO_SRC = "/logo.png";

// ─── App brand constants ────────────────────────────────────────────────────
const COMPANY_NAME    = "AutoRx Training";
const COMPANY_TAGLINE = "Built for your shop";

// ─── Cross-app URLs ─────────────────────────────────────────────────────────
const MANAGEMENT_URL = "https://management.autorxcenter.com/";
const FOOTER_LINKS = [
  { label: "Privacy",  href: "#" },
  { label: "Terms",    href: "#" },
  { label: "Support",  href: "mailto:support@autorxtraining.com" },
];

// ─── Layout ─────────────────────────────────────────────────────────────────
export function Layout({ user, onSignOut }) {
  const { t } = useTranslation();
  const location = useLocation();
  const isKeyboard = location.pathname.startsWith("/keyboard");
  const isAdmin = user?.role === "admin";
  const isAdministrative = user?.role?.toLowerCase() === "administrative";
  const hasElevated = isAdmin || isAdministrative;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kbNavOpen, setKbNavOpen] = useState(false);

  // ─── Sectioned sidebar navigation ─────────────────────────────────────────
  const navSections = [
    {
      key: "main",
      label: null, // no header for top section
      items: [
        { to: "/",         label: t("nav.home"), icon: HomeIcon, end: true },
        { to: "/keyboard", label: t("nav2.keyBoard"),   icon: KeyRound },
      ],
    },
    {
      key: "training",
      label: t("nav.training"),
      items: [
        { to: "/training",    label: t("nav2.modules"),           icon: GraduationCap },
        { to: "/assessments", label: t("nav.assessments"), icon: Layers },
        { to: "/onboarding",  label: t("nav.onboarding"),  icon: BookOpen },
        { to: "/scorecard",   label: t("nav.myScorecard"), icon: Gauge },
        { to: "/ai",          label: t("nav.aiCoach"),     icon: MessageSquare },
        { to: "/culture",     label: t("nav.culture"),     icon: Shield },
      ],
    },
    {
      key: "tools",
      label: t("nav2.tools"),
      items: [
        { to: "/tools",    label: t("nav2.catalog"),  icon: Wrench },
        { to: "/my-tools", label: t("nav2.myTools"), icon: Package },
      ],
    },
    {
      key: "hr",
      label: t("nav2.hr"),
      items: [
        { to: "/profile",   label: t("nav2.myProfile"), icon: User },
        { to: "/schedule",  label: t("nav2.schedule"),   icon: CalendarDays },
        { to: "/timesheet", label: t("nav2.timesheet"),  icon: Clock },
        { to: "/time-off",  label: t("nav2.timeOff"),   icon: CalendarOff },
        { to: "/benefits",  label: t("nav2.benefits"),   icon: Heart },
        { to: "/team",      label: t("nav2.team"),       icon: Users },
      ],
    },
    // Admin section — visible to admin and administrative (some items restricted)
    ...(hasElevated
      ? [
          {
            key: "admin",
            label: t("nav.admin"),
            items: [
              { to: "/admin/progress",     label: t("nav.dashboard"), icon: BarChart2 },
              // Users page: admin only (create/delete/roles/passwords)
              ...(isAdmin ? [{ to: "/admin/users", label: t("nav2.manageUsers"), icon: UserCog }] : []),
              // Modules page: admin only (create/edit/delete training content)
              ...(isAdmin ? [{ to: "/admin/modules", label: t("nav2.manageModules"), icon: GraduationCap }] : []),
              { to: "/admin/tools",        label: t("nav2.manageTools"),     icon: Wrench },
              { to: "/admin/loans",        label: t("nav2.allLoans"),        icon: ClipboardList },
              { to: "/admin/tool-reports", label: t("nav2.toolReports"),     icon: BarChart2 },
              { to: "/admin/suggestions",  label: t("nav2.suggestions"),      icon: Lightbulb },
              { to: "/settings",           label: t("nav.settings"),  icon: SettingsIcon },
            ],
          },
        ]
      : [{ key: "settings", label: null, items: [{ to: "/settings", label: t("nav.settings"), icon: SettingsIcon }] }]),
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
        {/* ── Desktop Sidebar — normal pages ── */}
        {!isKeyboard && (
          <aside className="hidden md:flex md:flex-shrink-0 md:w-64 md:flex-col md:gap-4 md:border-r md:border-slate-200 md:bg-white md:px-4 md:py-5 md:h-full md:overflow-y-auto">
            <Brand />
            <UserCard user={user} />
            <NavSection sections={navSections} />
            <CrossAppNav isAdmin={isAdmin} isAdministrative={isAdministrative} />
          </aside>
        )}

        {/* ── Keyboard: floating menu button + slide-over nav drawer ── */}
        {isKeyboard && (
          <>
            {/* Floating menu button — always visible, top-left corner */}
            <button
              onClick={() => setKbNavOpen(true)}
              className="fixed top-2.5 left-2 z-50 w-10 h-10 rounded-xl bg-slate-700/90 backdrop-blur border border-slate-500/50 text-slate-200 hover:text-white hover:bg-slate-600 transition-all flex items-center justify-center shadow-lg"
              aria-label="Open navigation"
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Slide-over backdrop */}
            {kbNavOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={() => setKbNavOpen(false)}
              />
            )}

            {/* Slide-over navigation panel */}
            <div className={cx(
              "fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
              kbNavOpen ? "translate-x-0" : "-translate-x-full"
            )}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <BrandInline />
                <button
                  onClick={() => setKbNavOpen(false)}
                  className="btn-outline-sm px-3"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <UserCard user={user} />
                <div onClick={() => setKbNavOpen(false)}>
                  <NavSection sections={navSections} />
                </div>
                <CrossAppNav isAdmin={isAdmin} isAdministrative={isAdministrative} />
              </div>
              {/* Sign out at bottom */}
              <div className="border-t border-slate-200 p-3">
                <button
                  onClick={() => { setKbNavOpen(false); onSignOut(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t("auth.signOut")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Main content area ── */}
        <main className={cx("flex-1 flex flex-col min-h-0", isKeyboard ? "overflow-hidden" : "overflow-y-auto")}>
          {/* TopBar hidden on keyboard — the board has its own header */}
          {!isKeyboard && (
            <>
              <TopBar
                onSignOut={onSignOut}
                onOpenMobileMenu={() => setMobileOpen(true)}
              />
              <QuickActions />
            </>
          )}

          {isKeyboard ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Outlet context={{ user }} />
            </div>
          ) : (
            <>
              <div className="flex-1 w-full px-4 py-6">
                <Breadcrumbs />
                <Outlet context={{ user }} />
              </div>
              <AppFooter />
            </>
          )}
        </main>

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
                <NavSection sections={navSections} />
              </div>
              <CrossAppNav isAdmin={isAdmin} isAdministrative={isAdministrative} />
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
// Logo is landscape (933×248) — display it full-width, no square container
function Brand() {
  const [imgErr, setImgErr] = React.useState(false);
  return (
    <Link to="/" className="block px-2 py-1">
      {imgErr ? (
        /* Fallback: icon + text */
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center shadow-sm">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-900 tracking-tight">{COMPANY_NAME}</p>
            <p className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">{COMPANY_TAGLINE}</p>
          </div>
        </div>
      ) : (
        /* Logo full-width, naturally proportioned */
        <img
          src={LOGO_SRC}
          alt="AutoRx Center"
          className="w-full max-h-14 object-contain object-left"
          onError={() => setImgErr(true)}
        />
      )}
    </Link>
  );
}

// ─── Brand inline (mobile drawer / top bar) ──────────────────────────────────
// Compact landscape logo for tight spaces
function BrandInline() {
  const [imgErr, setImgErr] = React.useState(false);
  return (
    <Link to="/" className="flex items-center gap-2">
      {imgErr ? (
        <>
          <div className="h-7 w-7 rounded-xl bg-brand-primary flex items-center justify-center">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">{COMPANY_NAME}</span>
        </>
      ) : (
        <img
          src={LOGO_SRC}
          alt="AutoRx Center"
          className="h-7 w-auto object-contain"
          onError={() => setImgErr(true)}
        />
      )}
    </Link>
  );
}

// ─── UserCard ────────────────────────────────────────────────────────────────
// Role key map → i18n key under "roles.*"
const ROLE_KEY = {
  technician:    "technician",
  administrative: "administrative",
  serviceadvisor: "serviceAdvisor",
  admin:         "admin",
};

function UserCard({ user }) {
  const { t } = useTranslation();
  const roleKey = ROLE_KEY[(user?.role || "").toLowerCase().replace(/\s/g, "")] || null;
  const roleLabel = roleKey ? t(`roles.${roleKey}`) : user?.role;

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium max-w-[90px] truncate text-center">
          {roleLabel}
        </span>
      </div>
    </div>
  );
}

// ─── NavSection ──────────────────────────────────────────────────────────────
function NavSection({ sections }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((section, idx) => (
        <div key={section.key} className={idx > 0 && section.label ? "mt-4" : idx > 0 ? "mt-1" : ""}>
          {section.label && (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase text-sky-600 tracking-widest">
              {section.label}
            </p>
          )}
          {section.items.map((item) => (
            <SideItem key={item.to} {...item} />
          ))}
        </div>
      ))}
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

// ─── CrossAppNav ─────────────────────────────────────────────────────────────
function CrossAppNav({ isAdmin, isAdministrative }) {
  const { t } = useTranslation();
  if (!isAdmin && !isAdministrative) return null;
  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      <p className="mb-2 px-3 text-xs font-semibold uppercase text-slate-400 tracking-wider">
        {t("nav2.otherApps")}
      </p>
      <div className="flex flex-col gap-1.5">
        {/* Management — admin only */}
        <a
          href={MANAGEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
        >
          <span className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="flex-1 text-left">{t("nav2.management")}</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      </div>
    </div>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────
function TopBar({ onSignOut, onOpenMobileMenu }) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close ⋯ dropdown on outside click
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
      <div className="flex items-center justify-between gap-3 px-4 py-3">

        {/* Left: hamburger + brand (mobile) | search (desktop) */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden btn-outline-sm px-2"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="md:hidden">
            <BrandInline />
          </div>

          <div className="hidden md:block w-[420px]">
            <GlobalSearch />
          </div>
        </div>

        {/* Right: Bell always visible + ⋯ for DarkMode & LogOut */}
        <div className="flex items-center gap-1.5">
          <NotificationCenter />

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="btn-outline-sm px-2"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white shadow-lg z-30 min-w-[160px] overflow-hidden">
                {/* Dark mode toggle row */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{t("settings.darkMode", "Dark mode")}</span>
                  <DarkModeToggle />
                </div>
                <div className="border-t border-slate-100" />
                {/* Sign out row */}
                <button
                  onClick={() => { setMoreOpen(false); onSignOut(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
      <div className="px-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Left: brand — landscape logo, height-constrained */}
          <div className="flex items-center gap-2.5">
            <img
              src={LOGO_SRC}
              alt="AutoRx Center"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                // Show text fallback
                const span = document.createElement("span");
                span.className = "text-sm font-extrabold text-slate-800";
                span.textContent = COMPANY_NAME;
                e.currentTarget.parentElement.prepend(span);
              }}
            />
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{COMPANY_TAGLINE}</span>
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
