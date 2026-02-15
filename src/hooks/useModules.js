import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useModules() {
  return useQuery({
    queryKey: ['modules', 'user'],
    queryFn: async () => {
      const data = await apiFetch('/api/modules/user');
      return data;
    },
  });
}

export function useModule(id) {
  return useQuery({
    queryKey: ['modules', id],
    queryFn: async () => {
      const data = await apiFetch(`/api/modules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSyncModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId) => apiFetch(`/api/admin/modules/${moduleId}/sync`, { method: 'POST' }),
    onSuccess: (data, moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['modules', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'user'] });
    },
  });
}
