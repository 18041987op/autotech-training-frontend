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

export function useProgressBadges() {
  return useQuery({
    queryKey: ['progress-badges'],
    queryFn: async () => {
      const data = await apiFetch('/api/progress/badges').catch(() => ({ badges: [] }));
      return data;
    },
  });
}
