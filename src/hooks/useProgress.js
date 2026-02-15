import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const data = await apiFetch('/api/progress');
      return data;
    },
  });
}
