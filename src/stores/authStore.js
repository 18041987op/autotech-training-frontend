import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      clearAuth: () => set({ user: null, token: null }),

      isAuthenticated: () => !!get().token,
      // Super admin — only Osman (owner). Full unrestricted control.
      isAdmin: () => get().user?.role === 'admin',
      // Administrative staff (e.g. Thalia). Can see and do almost everything admin can,
      // EXCEPT: delete users, change roles, reset passwords, create training modules content.
      isAdministrative: () => get().user?.role?.toLowerCase() === 'administrative',
      // Combined check — use for pages/features that both admin and administrative can access.
      // Do NOT use for destructive actions (delete, role change, password reset).
      hasElevatedAccess: () => {
        const role = get().user?.role?.toLowerCase();
        return role === 'admin' || role === 'administrative';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

// Use the zustand persist API's onFinishHydration listener.
// This is more reliable than onRehydrateStorage in zustand v4.5+.
// It fires once hydration from localStorage completes (even if storage is empty).
useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ _hasHydrated: true });
});

/**
 * Hook: returns true once the auth store has finished hydrating from localStorage.
 * Use this in any component that depends on user data to avoid the race condition
 * where `user` is momentarily null before localStorage is read.
 *
 * Usage:
 *   const authReady = useAuthReady();
 *   const user = useAuthStore((s) => s.user);
 *   // In your useQuery: enabled: authReady && !!user?.email
 *   // In your render:   if (!authReady) return <Spinner />;
 */
export const useAuthReady = () => useAuthStore((s) => s._hasHydrated);
