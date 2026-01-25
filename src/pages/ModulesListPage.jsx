import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

function inferTypeFromTitle(title = "") {
  const t = title.toLowerCase();
  if (t.startsWith("onboarding:")) return "onboarding";
  if (t.startsWith("assessment:") || t.startsWith("knowledge check:") || t.startsWith("skills check:"))
    return "assessments";
  if (t.startsWith("culture:")) return "culture";
  return "training";
}

export function ModulesListPage({ pageType }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    return (modules || []).filter((m) => inferTypeFromTitle(m.title) === pageType);
  }, [modules, pageType]);

  const titleKey =
    pageType === "onboarding"
      ? "modules.onboarding.title"
      : pageType === "training"
      ? "modules.training.title"
      : pageType === "assessments"
      ? "modules.assessments.title"
      : "modules.training.title";

  const subtitleKey =
    pageType === "onboarding"
      ? "modules.onboarding.subtitle"
      : pageType === "training"
      ? "modules.training.subtitle"
      : pageType === "assessments"
      ? "modules.assessments.subtitle"
      : "modules.training.subtitle";

  if (pageType === "admin-users-placeholder") {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{t("admin.usersTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("common.comingSoon")}</p>
      </div>
    );
  }

  if (pageType === "admin-content-placeholder") {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{t("admin.contentTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("common.comingSoon")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">{t(titleKey)}</h1>
        <p className="mt-2 text-sm text-slate-600">{t(subtitleKey)}</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
          {t("status.loading")}
        </div>
      ) : err ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm text-red-700">
          {err}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm text-sm text-slate-600">
          <div className="font-extrabold">{t("modules.empty.title")}</div>
          <div className="mt-2 text-xs text-slate-500">{t("modules.empty.hint")}</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-extrabold leading-tight">{m.title}</h3>
                {m.required ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold">
                    {t("status.required")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">{m.description || "—"}</p>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{t("modules.completion")}</span>
                <span className="font-semibold text-slate-700">{m.completionRate || 0}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: `${Math.min(100, Math.max(0, m.completionRate || 0))}%` }}
                />
              </div>

              <button
                className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                onClick={() => navigate(`/modules/${m.id}`)}
              >
                {t("actions.open")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
