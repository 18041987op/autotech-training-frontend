/**
 * Toast — lightweight floating notification system.
 *
 * Usage:
 *   const { toasts, showToast } = useToast();
 *   showToast("Sync complete!", "success");   // "success" | "error" | "info"
 *   ...
 *   <ToastContainer toasts={toasts} />
 */
import React, { useCallback, useEffect, useRef, useState } from "react";

const ICONS = {
  success: "✅",
  error:   "❌",
  info:    "⚡",
  warning: "⚠️",
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  error:   { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c" },
  info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  warning: { bg: "#fffbeb", border: "#fcd34d", text: "#b45309" },
};

// ── individual toast ──────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const color = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="alert"
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        animation: "toastSlideIn 0.25s ease",
      }}
      className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg text-sm font-semibold max-w-xs w-full pointer-events-auto"
    >
      <span className="text-base shrink-0 mt-px">{ICONS[toast.type] || "ℹ️"}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── container (fixed bottom-right) ───────────────────────────────────────────
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
      <div
        className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </>
  );
}

// ── hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
