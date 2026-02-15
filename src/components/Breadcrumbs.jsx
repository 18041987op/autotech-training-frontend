import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Breadcrumbs() {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(x => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <Link to="/" className="text-slate-500 hover:text-brand-primary transition-colors">
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            {isLast ? (
              <span className="text-slate-900 font-medium capitalize">{value}</span>
            ) : (
              <Link to={to} className="text-slate-500 hover:text-brand-primary transition-colors capitalize">
                {value}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
