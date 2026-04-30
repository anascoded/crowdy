import { crowdService } from "@/services/crowdService";
import { CrowdLive } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface UseCrowdLiveResult {
  data: CrowdLive | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 60_000;

export function useCrowdLive(placeId: string | null): UseCrowdLiveResult {
  const [data, setData] = useState<CrowdLive | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (showLoading = true) => {
      if (!placeId) return;
      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const live = await crowdService.getLive(placeId);
        setData(live);
      } catch (err: any) {
        setError(err.message ?? "Failed to load live crowd data");
      } finally {
        setIsLoading(false);
      }
    },
    [placeId],
  );

  // Initial fetch
  useEffect(() => {
    fetch(true);
  }, [fetch]);

  // Polling — silent refresh (no loading spinner)
  useEffect(() => {
    if (!placeId) return;

    const interval = setInterval(() => fetch(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [placeId, fetch]);

  return { data, isLoading, error, refresh: () => fetch(true) };
}
