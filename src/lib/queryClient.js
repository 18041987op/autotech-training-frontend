import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes (deprecated, will be gcTime in future)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
