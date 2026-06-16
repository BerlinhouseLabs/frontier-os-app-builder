import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type { ContentPiece, SocialPlatform } from '../lib/frontier-services';

interface UseContentPiecesResult {
  content: ContentPiece[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useContentPieces(campaignId?: string, platform?: SocialPlatform): UseContentPiecesResult {
  const services = useServices();
  const [content, setContent] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.swarm.listContent(campaignId, platform);
      setContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [services, campaignId, platform]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, error, refetch: fetchContent };
}
