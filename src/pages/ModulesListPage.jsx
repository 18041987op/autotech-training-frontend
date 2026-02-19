import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { translateModuleList } from "../hooks/useModuleTranslation";

function inferTypeFromTitle(title = "") {
  const t = title.toLowerCase();
  if (t.startsWith("onboarding:")) return "onboarding";
  if (t.startsWith("assessment:") || t.startsWith("knowledge check:") || t.startsWith("skills check:"))
    return "assessments";
  if (t.startsWith("culture:")) return "culture";
  return "training";
}

// ✅ NEW: prefer domain from DB if present, fallback to title inference
function inferTypeFromModule(m) {
  const d = (m?.domain || "").toLowerCase().trim();
  if (d === "onboarding") return "onboarding";
  if (d === "training") return "training";
  if (d === "culture") return "culture";
  if (d === "evaluations") return "assessments"; // keep UI model simple for now
  if (d === "global") return "training";
  if (d === "archive") return "training";
  return inferTypeFromTitle(m?.title || "");
}

export function ModulesListPage({ pageType }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await apiFetch("/api/modules/user");
        setModules(data.modules || []);
      } catch (e) {
        setErr(e.message || "Failed to load modules");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (pageType?.startsWith("admin-")) return [];
    const raw = (modules || []).filter((m) => inferTypeFromModule(m) === pageType);
    return translateModuleList(raw, t, i18n);
  }, [modules, pageType, t, i18n]);

  const titleKey =
    pageType === "onboarding"
      ? "modules.onboarding.title"
      : pageType === "training"
      ? "modules.training.title"
      : pageType === "culture"
      ? "modules.culture.title" // not currently in i18n; we’ll fall back below
      : pageType === "assessments"
      ? "modules.assessments.title"
      : "modules.training.title";

  const subtitleKey =
    pageType === "onboarding"
      ? "modules.onboarding.subtitle"
      : pageType === "training"
      ? "modules.training.subtitle"
      : pageType === "culture"
      ? "modules.culture.subtitle" // not currently in i18n; we’ll fall back below
      : pageType === "assessments"
      ? "modules.assessments.subtitle"
      : "modules.training.subtitle";

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
        {t("status.loading")}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
        {err}
      </div>
    );
  }

  // If culture keys don’t exist yet, reuse training copy (safe fallback)
  const safeTitle = (() => {
    try {
      return t(titleKey);
    } catch {
      return t("modules.training.title");
    }
  })();

  const safeSubtitle = (() => {
    try {
      return t(subtitleKey);
    } catch {
      return t("modules.training.subtitle");
    }
  })();

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{safeTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">{safeSubtitle}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
          <div className="font-extrabold">{t("modules.empty.title")}</div>
          <div className="mt-2 text-xs text-slate-500">{t("modules.empty.hint")}</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-brand-primary hover:ring-2 hover:ring-brand-soft"
            >
              <div className="font-extrabold">{m.translatedTitle}</div>
              <div className="mt-2 text-sm text-slate-600">{m.translatedDescription || "—"}</div>

              <button
                onClick={() => navigate(`/modules/${m.id}`)}
                className="mt-4 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
              >
                {t("common.view")} →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
