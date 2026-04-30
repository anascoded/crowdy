import { ApiError } from "@/types";
import { QueryClient } from "@tanstack/react-query";

// ─── Query Client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min — crowd data changes frequently
      gcTime: 1000 * 60 * 10, // 10 min cache
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Don't retry on 4xx errors — only on network/5xx
        if (apiError.status && apiError.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true, // refresh when user returns to app
      refetchOnReconnect: true, // refresh after reconnecting
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
