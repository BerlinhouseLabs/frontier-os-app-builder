import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type { Agent, AgentCategory } from '../lib/frontier-services';

interface UseAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgents(category?: AgentCategory | 'all', query?: string): UseAgentsResult {
  const services = useServices();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await services.agents.listAgents();
      let filtered = all;

      if (category && category !== 'all') {
        filtered = filtered.filter((a) => a.category === category);
      }

      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q)),
        );
      }

      setAgents(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [services, category, query]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
}
