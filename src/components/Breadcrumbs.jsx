import React, { useEffect, useState } from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch } from "../lib/api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function isNumericId(s) {
  return /^\d+$/.test(s);
}

function looksLikeId(s) {
  return isUUID(s) || isNumericId(s);
}

// Static human-readable labels for known path segments
const SEGMENT_LABELS = {
  modules:     "Training",
  assessments: "Assessments",
  onboarding:  "Onboarding",
  training:    "Training",
  culture:     "Culture",
  settings:    "Settings",
  users:       "Users",
  admin:       "Admin",
  content:     "Content",
  dashboard:   "Dashboard",
  profile:     "Profile",
  coach:       "AI Coach",
};

function labelForSegment(s) {
  const known = SEGMENT_LABELS[s.toLowerCase()];
  if (known) return known;
  // Title-case dash-separated words
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── component ────────────────────────────────────────────────────────────────

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  // Cache of id → resolved name
  const [nameCache, setNameCache] = useState({});

  // Collect all IDs we need to resolve
  useEffect(() => {
    const toFetch = [];

    for (let i = 0; i < pathnames.length; i++) {
      const seg = pathnames[i];
      if (!looksLikeId(seg)) continue;

      const prev = pathnames[i - 1] || "";

      // Module ID: /modules/:id
      if (prev === "modules" && !nameCache[`module:${seg}`]) {
        toFetch.push({
          key: `module:${seg}`,
          fetch: () =>
            apiFetch(`/api/modules/${seg}`)
              .then((d) => d?.module?.title || d?.title || `Module ${seg}`)
              .catch(() => `Module ${seg}`),
        });
      }

      // Assessment ID: /assessments/:aid (preceded by anything)
      if (prev === "assessments" && !nameCache[`assessment:${seg}`]) {
        toFetch.push({
          key: `assessment:${seg}`,
          fetch: () =>
            apiFetch(`/api/assessments/${seg}`)
              .then((d) => d?.assessment?.title || `Assessment ${seg}`)
              .catch(() => `Assessment ${seg}`),
        });
      }
    }

    if (toFetch.length === 0) return;

    let cancelled = false;

    Promise.all(
      toFetch.map(async ({ key, fetch: fn }) => {
        const name = await fn();
        return { key, name };
      })
    ).then((results) => {
      if (cancelled) return;
      setNameCache((prev) => {
        const next = { ...prev };
        for (const { key, name } of results) next[key] = name;
        return next;
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [location.pathname]);

  if (pathnames.length === 0) return null;

  // Build display label for a segment at position i
  const displayLabel = (seg, i) => {
    if (!looksLikeId(seg)) return labelForSegment(seg);

    const prev = pathnames[i - 1] || "";
    if (prev === "modules") {
      return nameCache[`module:${seg}`] || "…";
    }
    if (prev === "assessments") {
      return nameCache[`assessment:${seg}`] || "…";
    }
    // Unknown ID — show placeholder
    return "…";
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4 flex-wrap">
      <Link
        to="/"
        className="text-slate-400 hover:text-brand-primary transition-colors"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((seg, i) => {
        // "modules" segment has no list page — redirect to /training instead
        const rawTo = `/${pathnames.slice(0, i + 1).join("/")}`;
        const to = rawTo === "/modules" ? "/training" : rawTo;
        const isLast = i === pathnames.length - 1;
        const label = displayLabel(seg, i);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            {isLast ? (
              <span className="text-slate-700 font-semibold truncate max-w-[180px]" title={label}>
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="text-slate-400 hover:text-brand-primary transition-colors truncate max-w-[140px]"
                title={label}
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
