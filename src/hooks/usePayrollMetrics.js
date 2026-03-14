import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

// ── Fetch payroll metrics from training backend ───────────────────────────────
// Training backend proxies the call to the payroll portal using the shared API key.
// Returns null / { linked: false } if the employee's email isn't found in payroll.

export function usePayrollMetrics() {
  return useQuery({
    queryKey: ["payroll-metrics"],
    queryFn: async () => {
      try {
        const data = await apiFetch("/api/payroll-metrics");
        return { linked: true, ...data };
      } catch (e) {
        // 404 = employee email not linked yet in payroll portal
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
    staleTime: 5 * 60 * 1000,  // Cache for 5 min — metrics don't change mid-shift
    retry: false,               // Don't retry 404s
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
  return useQuery({
    queryKey: ["payroll-history"],
    queryFn: async () => {
      try {
        const data = await apiFetch("/api/payroll-history");
        return { linked: true, ...data };
      } catch (e) {
        if (e.message?.includes("not found") || e.message?.includes("404")) {
          return { linked: false };
        }
        return { linked: false, error: e.message };
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

// ── Submit check-in response ──────────────────────────────────────────────────

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
