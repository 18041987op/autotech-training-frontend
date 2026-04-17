import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Heart, CalendarDays, Clock, AlertCircle, ChevronDown, ChevronUp, Shield
} from "lucide-react";

/* ─── PTO accrual tables (from Employee Handbook v1.6) ─── */
const FULL_TIME_PTO = [
  { companyYears: "1–2", exp12: 5, exp34: 7, exp5: 9 },
  { companyYears: "3–4", exp12: 7, exp34: 9, exp5: 11 },
  { companyYears: "5+",  exp12: 9, exp34: 11, exp5: 13 },
];

const PART_TIME_PTO = [
  { companyYears: "1–2", exp12: 2.5, exp34: 3.5, exp5: 4.5 },
  { companyYears: "3–4", exp12: 3.5, exp34: 4.5, exp5: 5.5 },
  { companyYears: "5+",  exp12: 4.5, exp34: 5.5, exp5: 6.5 },
];

export function BenefitsPage() {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState("pto");

  const toggle = (key) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="h-6 w-6 text-sky-600" />
          {t("hr.benefits.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t("hr.benefits.subtitle")}</p>
      </div>

      {/* ─── PTO Section ─── */}
      <BenefitAccordion
        icon={<CalendarDays className="h-5 w-5 text-sky-600" />}
        title={t("hr.benefits.ptoTitle")}
        subtitle={t("hr.benefits.ptoSubtitle")}
        isOpen={openSection === "pto"}
        onToggle={() => toggle("pto")}
      >
        {/* Key rules */}
        <div className="space-y-3 mb-5">
          <RuleCard
            icon={<Clock className="h-4 w-4 text-amber-600" />}
            color="amber"
            text={t("hr.benefits.ptoEligibility")}
          />
          <RuleCard
            icon={<AlertCircle className="h-4 w-4 text-sky-600" />}
            color="sky"
            text={t("hr.benefits.ptoAccrual")}
          />
          <RuleCard
            icon={<AlertCircle className="h-4 w-4 text-red-600" />}
            color="red"
            text={t("hr.benefits.ptoNoRollover")}
          />
          <RuleCard
            icon={<AlertCircle className="h-4 w-4 text-purple-600" />}
            color="purple"
            text={t("hr.benefits.ptoOveruse")}
          />
        </div>

        {/* Full-time table */}
        <h4 className="text-sm font-bold text-slate-700 mb-2">{t("hr.benefits.fullTimePto")}</h4>
        <PtoTable rows={FULL_TIME_PTO} t={t} />

        {/* Part-time table */}
        <h4 className="text-sm font-bold text-slate-700 mt-4 mb-2">{t("hr.benefits.partTimePto")}</h4>
        <PtoTable rows={PART_TIME_PTO} t={t} />

        {/* Request guidelines */}
        <div className="mt-4 p-3 bg-sky-50 rounded-xl border border-sky-100">
          <p className="text-xs font-semibold text-sky-700 mb-1">{t("hr.benefits.requestGuidelines")}</p>
          <ul className="text-xs text-sky-600 space-y-1 list-disc list-inside">
            <li>{t("hr.benefits.guidelineOneDayNotice")}</li>
            <li>{t("hr.benefits.guidelineExtendedNotice")}</li>
            <li>{t("hr.benefits.guidelineOccurrences")}</li>
            <li>{t("hr.benefits.guidelineSameDept")}</li>
          </ul>
        </div>
      </BenefitAccordion>

      {/* ─── Paid Holidays Section ─── */}
      <BenefitAccordion
        icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
        title={t("hr.benefits.holidaysTitle")}
        subtitle={t("hr.benefits.holidaysSubtitle")}
        isOpen={openSection === "holidays"}
        onToggle={() => toggle("holidays")}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HolidayCard name={t("hr.benefits.thanksgiving")} icon="🦃" />
            <HolidayCard name={t("hr.benefits.christmas")} icon="🎄" />
            <HolidayCard name={t("hr.benefits.newYear")} fullTimeOnly icon="🎆" />
          </div>
          <RuleCard
            icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
            color="amber"
            text={t("hr.benefits.holidayOccurrence")}
          />
          <p className="text-xs text-slate-500">{t("hr.benefits.partTimeHolidayNote")}</p>
        </div>
      </BenefitAccordion>

      {/* ─── Other Benefits Section ─── */}
      <BenefitAccordion
        icon={<Shield className="h-5 w-5 text-purple-600" />}
        title={t("hr.benefits.otherTitle")}
        subtitle={t("hr.benefits.otherSubtitle")}
        isOpen={openSection === "other"}
        onToggle={() => toggle("other")}
      >
        <div className="space-y-3">
          <div className="card p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">{t("hr.benefits.bonusTitle")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("hr.benefits.bonusDesc")}</p>
          </div>
          <div className="card p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">{t("hr.benefits.discountTitle")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("hr.benefits.discountDesc")}</p>
          </div>
          <div className="card p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">{t("hr.benefits.maternityTitle")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("hr.benefits.maternityDesc")}</p>
          </div>
        </div>
      </BenefitAccordion>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function BenefitAccordion({ icon, title, subtitle, isOpen, onToggle, children }) {
  return (
    <div className="card overflow-hidden border border-slate-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function RuleCard({ icon, color, text }) {
  const bg = {
    amber: "bg-amber-50 border-amber-100",
    sky: "bg-sky-50 border-sky-100",
    red: "bg-red-50 border-red-100",
    purple: "bg-purple-50 border-purple-100",
  };
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border ${bg[color] || bg.sky}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <p className="text-xs text-slate-700">{text}</p>
    </div>
  );
}

function PtoTable({ rows, t }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-3 py-2 font-semibold text-slate-600">
              {t("hr.benefits.yearsAtCompany")}
            </th>
            <th className="text-center px-3 py-2 font-semibold text-slate-600">
              {t("hr.benefits.exp12")}
            </th>
            <th className="text-center px-3 py-2 font-semibold text-slate-600">
              {t("hr.benefits.exp34")}
            </th>
            <th className="text-center px-3 py-2 font-semibold text-slate-600">
              {t("hr.benefits.exp5plus")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              <td className="px-3 py-2 font-medium text-slate-700">
                {row.companyYears} {t("hr.benefits.years")}
              </td>
              <td className="text-center px-3 py-2 text-slate-600">
                {row.exp12} {t("hr.benefits.daysPerYear")}
              </td>
              <td className="text-center px-3 py-2 text-slate-600">
                {row.exp34} {t("hr.benefits.daysPerYear")}
              </td>
              <td className="text-center px-3 py-2 text-slate-600">
                {row.exp5} {t("hr.benefits.daysPerYear")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HolidayCard({ name, icon, fullTimeOnly }) {
  const { t } = useTranslation();
  return (
    <div className="card p-4 border border-slate-200 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm font-semibold text-slate-700 mt-1">{name}</p>
      {fullTimeOnly && (
        <p className="text-[10px] text-amber-600 mt-0.5">{t("hr.benefits.fullTimeOnly")}</p>
      )}
    </div>
  );
}
