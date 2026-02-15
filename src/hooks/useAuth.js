import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, setToken, clearToken } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const { setUser, setToken: setStoreToken, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials) => apiFetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    }),
    onSuccess: (data) => {
      setToken(data.token);
      setStoreToken(data.token);
      setUser(data.user);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => apiFetch('/api/auth/verify'),
    onSuccess: (data) => {
      setUser(data.user);
    },
    onError: () => {
      clearAuth();
      clearToken();
    },
  });

  const logout = () => {
    clearAuth();
    clearToken();
    queryClient.clear();
  };

  return {
    login: loginMutation.mutate,
    verify: verifyMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || verifyMutation.isPending,
  };
}
