import { QueryClient } from '@tanstack/react-query';

/**
 * The API already caches upstream data in Redis, so the browser only needs a
 * short freshness window and a conservative retry policy: upstream failures are
 * surfaced quickly instead of hammering a degraded provider.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        const status = typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status: unknown }).status)
          : 0;
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
