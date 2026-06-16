import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type { Agent } from '../lib/frontier-services';

interface UseUserAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserAgents(): UseUserAgentsResult {
  const services = useServices();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const address = await services.wallet.getAddress();
      const myAgents = await services.agents.getMyAgents(address);
      setAgents(myAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your agents');
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    fetchMyAgents();
  }, [fetchMyAgents]);

  return { agents, loading, error, refetch: fetchMyAgents };
}
