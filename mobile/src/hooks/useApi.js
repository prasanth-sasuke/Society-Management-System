import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client';

// Fetches one GET endpoint for a screen. Pass null as the path to skip the request.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  const run = useCallback(async () => {
    if (!path) return;
    const call = latest.current + 1;
    latest.current = call;
    try {
      const data = await apiRequest(path);
      if (latest.current === call) setState({ data, error: null, loading: false });
    } catch (error) {
      if (latest.current === call) setState((prev) => ({ data: prev.data, error, loading: false }));
    }
  }, [path]);

  useEffect(() => {
    setState({ data: null, error: null, loading: Boolean(path) });
    run();
    return () => {
      latest.current += 1;
    };
  }, [path, run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { ...state, refreshing, refresh };
}
