/**
 * DoorAccessPage — Smart Cabinet Lock Access
 *
 * This page is loaded when a technician scans the QR code on a cabinet door.
 * URL: /cabinet/door/:doorCode/access
 *
 * Flow:
 * 1. Loading → checks what the user can do at this door
 * 2. Shows available actions (pickup tools / return tools)
 * 3. User taps action → sends unlock command
 * 4. Door opens → user confirms physical action
 * 5. Done
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  Package,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Timer,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { checkDoorAccess, unlockDoor, confirmDoorAction, getDoorState } from "../lib/cabinetApi";

// ─── Step Constants ──────────────────────────────────────────────────────────
const STEP = {
  LOADING: "loading",
  ACCESS_OPTIONS: "access_options",
  UNLOCKING: "unlocking",
  DOOR_OPEN: "door_open",
  RETURN_FORM: "return_form",
  SUCCESS: "success",
  DENIED: "denied",
  ERROR: "error",
};

export default function DoorAccessPage() {
  const { doorCode } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(STEP.LOADING);
  const [doorData, setDoorData] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null); // { action, loan, tool }
  const [unlockResult, setUnlockResult] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [returnCondition, setReturnCondition] = useState("good");
  const [damageDescription, setDamageDescription] = useState("");
  const [wasNeeded, setWasNeeded] = useState(null);
  const [adminReason, setAdminReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Door state polling
  const [isDoorOpen, setIsDoorOpen] = useState(null); // null = unknown, true = open, false = closed
  const [showDoorIssueForm, setShowDoorIssueForm] = useState(false);
  const [doorNotClosedReason, setDoorNotClosedReason] = useState("");

  // ─── Step 1: Check access ──────────────────────────────────────────────────
  const loadAccess = useCallback(async () => {
    if (!user?.email || !doorCode) return;

    try {
      setStep(STEP.LOADING);
      const res = await checkDoorAccess(doorCode, user.email);
      const data = res.data;
      setDoorData(data);

      if (
        data.status === "pickup" ||
        data.status === "return" ||
        data.status === "pickup_and_return"
      ) {
        setStep(STEP.ACCESS_OPTIONS);
      } else if (data.status === "admin_only") {
        setStep(STEP.ACCESS_OPTIONS);
      } else {
        setStep(STEP.DENIED);
      }
    } catch (err) {
      console.error("Door access check failed:", err);
      setErrorMsg(err.message || t("cabinet.error_checking"));
      setStep(STEP.ERROR);
    }
  }, [user, doorCode, t]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  // ─── Door state polling ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEP.DOOR_OPEN && step !== STEP.RETURN_FORM) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getDoorState(doorCode);
        if (!cancelled && res?.data) {
          setIsDoorOpen(res.data.is_open);
        }
      } catch (err) {
        console.warn("Door state poll error:", err);
        // Don't crash — just keep polling
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, doorCode]);

  // ─── Step 2: Request unlock ────────────────────────────────────────────────
  const handleUnlock = async (action, loan = null, tool = null, reason = null) => {
    try {
      setSelectedAction({ action, loan, tool });
      setStep(STEP.UNLOCKING);

      const res = await unlockDoor(doorCode, {
        user_id: doorData.user.id,
        action,
        loan_id: loan?.id || null,
        tool_id: tool?.id || (loan?.tools?.id) || null,
        override_reason: reason,
      });

      setUnlockResult(res.data);

      // Start countdown
      const duration = res.data.unlock_duration || 8;
      setCountdown(duration);
      setStep(action === "return" ? STEP.RETURN_FORM : STEP.DOOR_OPEN);

      // Countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Unlock failed:", err);
      toast.error(err.message || t("cabinet.unlock_failed"));
      setStep(STEP.ACCESS_OPTIONS);
    }
  };

  // ─── Step 3: Confirm action ────────────────────────────────────────────────
  const handleConfirm = async () => {
    try {
      // Determine if door was closed or user provided an explanation
      const doorWasClosed = isDoorOpen === false;
      const reason = showDoorIssueForm ? doorNotClosedReason : undefined;

      await confirmDoorAction(doorCode, {
        access_log_id: unlockResult?.access_log_id,
        action: selectedAction.action,
        loan_id: selectedAction.loan?.id,
        return_condition_status: selectedAction.action === "return" ? returnCondition : undefined,
        return_has_damage: selectedAction.action === "return" ? returnCondition === "damaged" : undefined,
        return_damage_description:
          selectedAction.action === "return" && returnCondition === "damaged"
            ? damageDescription
            : undefined,
        was_needed: selectedAction.action === "return" ? wasNeeded : undefined,
        door_was_closed: doorWasClosed,
        door_not_closed_reason: reason,
      });

      setStep(STEP.SUCCESS);
      toast.success(
        selectedAction.action === "pickup"
          ? t("cabinet.pickup_success")
          : selectedAction.action === "return"
          ? t("cabinet.return_success")
          : t("cabinet.access_confirmed")
      );
    } catch (err) {
      console.error("Confirm failed:", err);
      toast.error(err.message || t("cabinet.confirm_failed"));
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const doorInfo = doorData?.door;
  const cabinetName = doorInfo?.cabinet?.name || doorCode;
  const doorLabel = doorInfo?.door_label || doorCode;

  // ─── LOADING ──────────────────────────────────────────────────────────
  if (step === STEP.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">{t("cabinet.checking_access")}</p>
        <p className="text-gray-400 text-sm mt-2">{doorCode}</p>
      </div>
    );
  }

  // ─── ERROR ──────────────────────────────────────────────────────────
  if (step === STEP.ERROR) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{t("cabinet.error_title")}</h2>
        <p className="text-gray-500 text-center mb-6">{errorMsg}</p>
        <button
          onClick={() => navigate("/tools")}
          className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium"
        >
          {t("cabinet.go_to_catalog")}
        </button>
      </div>
    );
  }

  // ─── DENIED ──────────────────────────────────────────────────────────
  if (step === STEP.DENIED) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {cabinetName} — {doorLabel}
          </h2>
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-700 font-medium">{t("cabinet.no_pending")}</p>
            <p className="text-red-500 text-sm mt-1">{t("cabinet.request_first")}</p>
          </div>
          <button
            onClick={() => navigate("/tools")}
            className="w-full px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition"
          >
            {t("cabinet.go_to_catalog")}
          </button>
        </div>
      </div>
    );
  }

  // ─── ACCESS OPTIONS ──────────────────────────────────────────────────
  if (step === STEP.ACCESS_OPTIONS) {
    const pickups = doorData?.pickups || [];
    const returns = doorData?.returns || [];
    const isAdmin = doorData?.is_admin;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-indigo-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{cabinetName}</h2>
                <p className="text-sm text-gray-500">{doorLabel}</p>
              </div>
            </div>
          </div>

          {/* Pickups */}
          {pickups.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {t("cabinet.to_pickup")}
              </h3>
              {pickups.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-xl shadow p-4 mb-2 border-l-4 border-emerald-400"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {loan.tools?.name || t("cabinet.unknown_tool")}
                      </p>
                      {loan.vehicle && (
                        <p className="text-sm text-gray-500 mt-1">{loan.vehicle}</p>
                      )}
                      {loan.purpose && (
                        <p className="text-xs text-gray-400 mt-1">{loan.purpose}</p>
                      )}
                    </div>
                    <Package className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  </div>
                  <button
                    onClick={() => handleUnlock("pickup", loan, loan.tools)}
                    className="w-full mt-3 px-4 py-3 bg-emerald-500 text-white rounded-xl font-semibold
                               hover:bg-emerald-600 active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-5 h-5" />
                    {t("cabinet.open_and_pickup")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Returns */}
          {returns.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {t("cabinet.to_return")}
              </h3>
              {returns.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-xl shadow p-4 mb-2 border-l-4 border-amber-400"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {loan.tools?.name || t("cabinet.unknown_tool")}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {t("cabinet.borrowed_since")}{" "}
                        {new Date(loan.borrowed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <RotateCcw className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                  </div>
                  <button
                    onClick={() => handleUnlock("return", loan, loan.tools)}
                    className="w-full mt-3 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold
                               hover:bg-amber-600 active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-5 h-5" />
                    {t("cabinet.open_and_return")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Admin Override */}
          {isAdmin && pickups.length === 0 && returns.length === 0 && (
            <div className="bg-white rounded-xl shadow p-4 mb-4 border-l-4 border-purple-400">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <p className="font-semibold text-gray-800">{t("cabinet.admin_access")}</p>
              </div>
              <select
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-gray-700 mb-3"
              >
                <option value="">{t("cabinet.select_reason")}</option>
                <option value="maintenance">{t("cabinet.reason_maintenance")}</option>
                <option value="inventory">{t("cabinet.reason_inventory")}</option>
                <option value="emergency">{t("cabinet.reason_emergency")}</option>
                <option value="other">{t("cabinet.reason_other")}</option>
              </select>
              <button
                onClick={() => {
                  if (!adminReason) {
                    toast.error(t("cabinet.reason_required"));
                    return;
                  }
                  handleUnlock("admin_override", null, null, adminReason);
                }}
                disabled={!adminReason}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl font-semibold
                           hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed
                           transition flex items-center justify-center gap-2"
              >
                <Unlock className="w-5 h-5" />
                {t("cabinet.open_admin")}
              </button>
            </div>
          )}

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="w-full mt-2 px-4 py-3 text-gray-500 rounded-xl font-medium
                       hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("cabinet.go_back")}
          </button>
        </div>
      </div>
    );
  }

  // ─── UNLOCKING (animation) ────────────────────────────────────────────
  if (step === STEP.UNLOCKING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="relative">
          <Unlock className="w-20 h-20 text-indigo-500 animate-pulse" />
        </div>
        <p className="text-xl font-semibold text-gray-800 mt-6">{t("cabinet.unlocking")}</p>
        <p className="text-gray-400 mt-2">{doorLabel}</p>
      </div>
    );
  }

  // ─── DOOR OPEN — Pickup confirm ────────────────────────────────────────
  if (step === STEP.DOOR_OPEN) {
    const toolName = selectedAction?.tool?.name || selectedAction?.loan?.tools?.name || "—";
    const shelfPos = selectedAction?.tool?.shelf_position || selectedAction?.loan?.tools?.shelf_position;
    const canConfirm = isDoorOpen === false || (showDoorIssueForm && doorNotClosedReason.trim().length > 0);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-emerald-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Unlock className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">{t("cabinet.door_open")}</h2>

          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <p className="text-gray-700 font-medium">
              {selectedAction?.action === "pickup" ? t("cabinet.take_tool") : t("cabinet.return_tool")}:
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1">{toolName}</p>
            {shelfPos && (
              <p className="text-sm text-gray-500 mt-1">📍 {shelfPos}</p>
            )}
          </div>

          {countdown > 0 && (
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              <Timer className="w-4 h-4" />
              <p className="text-sm">
                {t("cabinet.closes_in", { seconds: countdown })}
              </p>
            </div>
          )}

          {/* Real-time door state indicator */}
          <div className={`rounded-xl p-3 mb-4 flex items-center justify-center gap-2 ${
            isDoorOpen === null
              ? "bg-gray-100 text-gray-500"
              : isDoorOpen
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-600"
          }`}>
            {isDoorOpen === null ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium text-sm">{t("cabinet.door_checking")}</span>
              </>
            ) : isDoorOpen ? (
              <>
                <DoorOpen className="w-5 h-5" />
                <span className="font-medium text-sm">{t("cabinet.door_is_open")}</span>
              </>
            ) : (
              <>
                <DoorClosed className="w-5 h-5" />
                <span className="font-medium text-sm">{t("cabinet.door_is_closed")}</span>
              </>
            )}
          </div>

          {/* Gate: must close door or report issue */}
          {isDoorOpen !== false && !showDoorIssueForm && (
            <p className="text-sm text-gray-500 mb-3">{t("cabinet.close_door_to_confirm")}</p>
          )}

          {/* Report door issue */}
          {isDoorOpen !== false && !showDoorIssueForm && (
            <button
              onClick={() => setShowDoorIssueForm(true)}
              className="text-sm text-amber-600 underline mb-4 inline-flex items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              {t("cabinet.report_door_issue")}
            </button>
          )}

          {showDoorIssueForm && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-left">
              <p className="text-sm font-medium text-amber-700 mb-2">{t("cabinet.door_issue_label")}</p>
              <textarea
                value={doorNotClosedReason}
                onChange={(e) => setDoorNotClosedReason(e.target.value)}
                placeholder={t("cabinet.door_issue_placeholder")}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-gray-700 text-sm resize-none"
                rows={2}
              />
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
              ${canConfirm
                ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            {selectedAction?.action === "pickup"
              ? t("cabinet.confirm_pickup")
              : t("cabinet.confirm_action")}
          </button>
        </div>
      </div>
    );
  }

  // ─── RETURN FORM ──────────────────────────────────────────────────────
  if (step === STEP.RETURN_FORM) {
    const toolName = selectedAction?.tool?.name || selectedAction?.loan?.tools?.name || "—";
    const shelfPos = selectedAction?.tool?.shelf_position || selectedAction?.loan?.tools?.shelf_position;
    const canConfirmReturn = isDoorOpen === false || (showDoorIssueForm && doorNotClosedReason.trim().length > 0);

    return (
      <div className="min-h-screen bg-amber-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Unlock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-amber-700 mb-1">{t("cabinet.door_open")}</h2>
            <p className="text-gray-600 mb-1">
              {t("cabinet.return_tool")}: <strong>{toolName}</strong>
            </p>
            {shelfPos && <p className="text-sm text-gray-400 mb-4">📍 {shelfPos}</p>}

            {countdown > 0 && (
              <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
                <Timer className="w-4 h-4" />
                <p className="text-sm">{t("cabinet.closes_in", { seconds: countdown })}</p>
              </div>
            )}

            {/* Real-time door state indicator */}
            <div className={`rounded-xl p-3 flex items-center justify-center gap-2 ${
              isDoorOpen === null
                ? "bg-gray-100 text-gray-500"
                : isDoorOpen
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }`}>
              {isDoorOpen === null ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium text-sm">{t("cabinet.door_checking")}</span>
                </>
              ) : isDoorOpen ? (
                <>
                  <DoorOpen className="w-5 h-5" />
                  <span className="font-medium text-sm">{t("cabinet.door_is_open")}</span>
                </>
              ) : (
                <>
                  <DoorClosed className="w-5 h-5" />
                  <span className="font-medium text-sm">{t("cabinet.door_is_closed")}</span>
                </>
              )}
            </div>
          </div>

          {/* Condition */}
          <div className="bg-white rounded-xl shadow p-4 mt-4">
            <p className="font-semibold text-gray-700 mb-3">{t("cabinet.tool_condition")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setReturnCondition("good")}
                className={`flex-1 py-3 rounded-xl font-medium text-center transition ${
                  returnCondition === "good"
                    ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                👍 {t("cabinet.condition_good")}
              </button>
              <button
                onClick={() => setReturnCondition("damaged")}
                className={`flex-1 py-3 rounded-xl font-medium text-center transition ${
                  returnCondition === "damaged"
                    ? "bg-red-100 text-red-700 ring-2 ring-red-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                ⚠️ {t("cabinet.condition_damaged")}
              </button>
            </div>

            {returnCondition === "damaged" && (
              <textarea
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder={t("cabinet.describe_damage")}
                className="w-full mt-3 px-3 py-2 border rounded-lg text-gray-700 resize-none"
                rows={2}
              />
            )}
          </div>

          {/* Was this tool needed? */}
          <div className="bg-white rounded-xl shadow p-4 mt-3">
            <p className="font-semibold text-gray-700 mb-3">{t("cabinet.was_needed")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setWasNeeded(true)}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${
                  wasNeeded === true
                    ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> {t("cabinet.yes")}
              </button>
              <button
                onClick={() => setWasNeeded(false)}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${
                  wasNeeded === false
                    ? "bg-gray-200 text-gray-700 ring-2 ring-gray-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <ThumbsDown className="w-4 h-4" /> {t("cabinet.no")}
              </button>
            </div>
          </div>

          {/* Gate: must close door or report issue */}
          {isDoorOpen !== false && !showDoorIssueForm && (
            <div className="bg-white rounded-xl shadow p-4 mt-3 text-center">
              <p className="text-sm text-gray-500 mb-2">{t("cabinet.close_door_to_confirm")}</p>
              <button
                onClick={() => setShowDoorIssueForm(true)}
                className="text-sm text-amber-600 underline inline-flex items-center gap-1"
              >
                <AlertTriangle className="w-4 h-4" />
                {t("cabinet.report_door_issue")}
              </button>
            </div>
          )}

          {showDoorIssueForm && (
            <div className="bg-amber-50 rounded-xl p-4 mt-3">
              <p className="text-sm font-medium text-amber-700 mb-2">{t("cabinet.door_issue_label")}</p>
              <textarea
                value={doorNotClosedReason}
                onChange={(e) => setDoorNotClosedReason(e.target.value)}
                placeholder={t("cabinet.door_issue_placeholder")}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-gray-700 text-sm resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirmReturn}
            className={`w-full mt-4 px-6 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
              ${canConfirmReturn
                ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            {t("cabinet.confirm_return")}
          </button>
        </div>
      </div>
    );
  }

  // ─── SUCCESS ──────────────────────────────────────────────────────────
  if (step === STEP.SUCCESS) {
    const isPickup = selectedAction?.action === "pickup";
    const toolName = selectedAction?.tool?.name || selectedAction?.loan?.tools?.name || "—";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2
            className={`w-20 h-20 mx-auto mb-4 ${isPickup ? "text-emerald-500" : "text-amber-500"}`}
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isPickup ? t("cabinet.pickup_done") : t("cabinet.return_done")}
          </h2>
          <p className="text-gray-500 mb-1">{toolName}</p>

          {isPickup && selectedAction?.loan?.expected_return && (
            <div className="bg-indigo-50 rounded-xl p-3 mt-4">
              <p className="text-sm text-indigo-600">
                {t("cabinet.return_by")}{" "}
                {new Date(selectedAction.loan.expected_return).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate("/my-tools")}
              className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition"
            >
              {t("cabinet.my_tools")}
            </button>
            <button
              onClick={() => navigate("/tools")}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              {t("cabinet.catalog")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
