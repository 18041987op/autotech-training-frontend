import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubmitCheckin } from "../hooks/usePayrollMetrics";

// ── Question options per role ─────────────────────────────────────────────────

const TECH_OPTION_KEYS  = ["brakes", "suspension", "diagnostics", "engine", "maintenance", "other"];
const SA_OPTION_KEYS    = ["presenting", "declined", "estimates", "techComm", "other"];

// ── Main component ────────────────────────────────────────────────────────────
// Props:
//   isTech     — boolean (tech vs SA question set)
//   onClose    — called after successful submit OR after thank-you is dismissed
//
// The modal is intentionally non-dismissable until the user submits.

export function WeeklyCheckInModal({ isTech, onClose }) {
  const { t }            = useTranslation();
  const navigate         = useNavigate();
  const submitMutation   = useSubmitCheckin();

  const [selected, setSelected]          = useState(null);
  const [otherText, setOtherText]         = useState("");
  const [validationErr, setValidationErr] = useState(false);
  const [done, setDone]                   = useState(false);
  const [recommendedModule, setRecommendedModule] = useState(null);

  const optionKeys = isTech ? TECH_OPTION_KEYS : SA_OPTION_KEYS;
  const optionsNs  = isTech ? "checkin.techOptions" : "checkin.saOptions";
  const question   = isTech ? t("checkin.techQuestion") : t("checkin.saQuestion");

  const handleSubmit = async () => {
    if (!selected) {
      setValidationErr(true);
      return;
    }
    setValidationErr(false);

    const answer = selected === "other" && otherText.trim()
      ? `other: ${otherText.trim()}`
      : selected;

    try {
      const result = await submitMutation.mutateAsync({
        category:     answer,
        is_tech:      isTech,
        submitted_at: new Date().toISOString(),
      });
      // Capture recommended module from API response (if any)
      if (result?.recommended_module) {
        setRecommendedModule(result.recommended_module);
      }
      setDone(true);
      // Auto-close after showing thank-you (longer if a recommendation is shown)
      const delay = result?.recommended_module ? 6000 : 2500;
      setTimeout(() => onClose(), delay);
    } catch (e) {
      console.error("[WeeklyCheckInModal] submit error:", e);
      // Still close on error so it doesn't block the user indefinitely
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop — not clickable (modal is mandatory) */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Coloured top bar */}
          <div
            className="h-1.5 w-full"
            style={{
              background: "linear-gradient(90deg, #1E6FAE 0%, #7c3aed 100%)",
            }}
          />

          {/* Content */}
          <div className="p-6">
            {done ? (
              /* ── Thank-you state ─────────────────────────────────────── */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-3 py-4"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-lg font-extrabold text-slate-900">{t("checkin.thankYou")}</p>
                <p className="text-xs text-slate-500">We've noted your area of focus for this week.</p>

                {/* ── Module recommendation ── */}
                {recommendedModule && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full mt-1 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-1.5">
                      Recommended for you
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-blue-100 shadow-sm">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 leading-snug truncate">
                          {recommendedModule.title}
                        </p>
                        {recommendedModule.category && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{recommendedModule.category}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/modules/${recommendedModule.id}`);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1E6FAE] text-white text-xs font-bold hover:bg-[#1558a0] transition-colors"
                    >
                      Go to module <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ── Question state ──────────────────────────────────────── */
              <>
                {/* Header */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">{t("checkin.title")}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{t("checkin.subtitle")}</p>
                  </div>
                </div>

                {/* Performance note */}
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 mb-4">
                  <p className="text-xs text-amber-800">{t("checkin.performanceNote")}</p>
                </div>

                {/* Question */}
                <p className="text-sm font-semibold text-slate-800 mb-3">{question}</p>

                {/* Options */}
                <div className="space-y-2">
                  {optionKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelected(key);
                        setValidationErr(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition-all duration-150
                        ${selected === key
                          ? "border-[#1E6FAE] bg-blue-50 text-[#1E6FAE]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                            selected === key
                              ? "border-[#1E6FAE] bg-[#1E6FAE]"
                              : "border-slate-300"
                          }`}
                        />
                        {t(`${optionsNs}.${key}`)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* "Other" text input */}
                {selected === "other" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 overflow-hidden"
                  >
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Tell us more…"
                      maxLength={200}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1E6FAE] focus:ring-1 focus:ring-[#1E6FAE]"
                    />
                  </motion.div>
                )}

                {/* Validation error */}
                {validationErr && (
                  <p className="mt-2 text-xs text-red-600 font-medium">{t("checkin.mandatory")}</p>
                )}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="mt-5 w-full py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: "#1E6FAE" }}
                  onMouseEnter={(e) => !submitMutation.isPending && (e.currentTarget.style.background = "#1558a0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#1E6FAE")}
                >
                  {submitMutation.isPending ? t("checkin.submitting") : t("checkin.submit")}
                </button>

                {/* Non-dismissable note */}
                <p className="mt-3 text-center text-[10px] text-slate-400">
                  This check-in appears max once per week
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
