import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { getProductionScorecard, getProductionHistory } from "../lib/productionApi";
import { useAuthStore } from "../stores/authStore";

// ── Fetch payroll metrics from training backend ───────────────────────────────
// Training backend proxies the call to the payroll portal using the shared API key.
// Returns null / { linked: false } if the employee's email isn't found in payroll.

export function usePayrollMetrics() {
  // Read current user email from the auth store. Must be a hook value so
  // useQuery re-runs when the user changes.
  const userEmail = useAuthStore((s) => s.user?.email);

  return useQuery({
    queryKey: ["payroll-metrics", userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      try {
        // LIVE source: /api/production/scorecard on Management Portal.
        // Returns same shape as legacy /api/payroll-metrics but computed
        // from Tekmetric in real time for the current week (Sun → today).
        const data = await getProductionScorecard(userEmail);
        return { linked: true, ...data };
      } catch (e) {
        // 404 = employee email not linked yet in management
        if (
          e.message?.includes("not found") ||
          e.message?.includes("404") ||
          e.message?.includes("Employee not found")
        ) {
          return { linked: false };
        }
        // Any other error — return unlinked so the UI degrades gracefully
        console.warn("[usePayrollMetrics] fetch error:", e.message);
        return { linked: false, error: e.message };
      }
    },
    staleTime: 2 * 60 * 1000,  // 2 min — live data should refresh more often
    retry: false,
  });
}

// ── Check if weekly check-in is pending ──────────────────────────────────────
// Returns { pending: bool, role: string } from the training backend.

export function useCheckinPending() {
  return useQuery({
    queryKey: ["checkin-pending"],
    queryFn: async () => {
      try {
        return await apiFetch("/api/checkin/pending");
      } catch {
        return { pending: false };
      }
    },
    staleTime: 60 * 60 * 1000,  // Re-check once per hour
    retry: false,
  });
}

// ── Fetch full pay history (up to 13 periods) ────────────────────────────────

export function usePayrollHistory() {
  // Read current user email from auth store
  const userEmail = useAuthStore((s) => s.user?.email);

  return useQuery({
    queryKey: ["payroll-history", userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      try {
        // LIVE source: /api/production/history on Management Portal.
        // Returns same shape as legacy /api/payroll-history but computed
        // from Tekmetric for the last 13 weeks. Heavier query so we
        // cache for 10 min — history doesn't change once a week is closed.
        const data = await getProductionHistory(userEmail, 13);
        return { linked: true, ...data };
      } catch (e) {
        if (e.message?.includes("not found") || e.message?.includes("404")) {
          return { linked: false };
        }
        return { linked: false, error: e.message };
      }
    },
    staleTime: 10 * 60 * 1000,  // 10 min — historical weeks change rarely
    retry: false,
  });
}

// ── Submit check-in response ──────────────────────────────────────────────────
// Returns the full API response including recommended_module (if any).

export function useSubmitCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/checkin", { method: "POST", body: payload }),
    onSuccess: () => {
      // Invalidate so the pending flag re-fetches
      queryClient.invalidateQueries({ queryKey: ["checkin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-metrics"] });
    },
  });
}

// ── Fetch admin suggestions (check-in responses) ─────────────────────────────
// Admin only — returns all weekly check-in responses with user names.

export function useAdminSuggestions() {
  return useQuery({
    queryKey: ["admin-suggestions"],
    queryFn: () => apiFetch("/api/admin/suggestions"),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}
