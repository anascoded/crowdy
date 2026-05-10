import { crowdService } from "@/services/crowdService";
import { CrowdHistory } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface UseCrowdHistoryResult {
  data: CrowdHistory | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * A custom hook to retrieve and manage the crowd history for a given place.
 *
 * @param {string | null} placeId - The unique identifier of the place whose crowd history is to be retrieved. If null, no request will be made.
 * @return {UseCrowdHistoryResult} An object containing the crowd history data, loading status, any error message, and a function to manually refresh the data.
 */
export function useCrowdHistory(placeId: string | null): UseCrowdHistoryResult {
  const [data, setData] = useState<CrowdHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!placeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const history = await crowdService.getHistory(placeId);
      setData(history);
    } catch (err: any) {
      setError(err.message ?? "Failed to load crowd history");
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refresh: fetch };
}
