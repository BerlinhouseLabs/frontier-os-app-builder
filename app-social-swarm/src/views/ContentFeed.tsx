import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentPieces } from '../hooks/useContentPieces';
import { ContentCard } from '../components/ContentCard';
import { EmptyState } from '../components/EmptyState';
import type { SocialPlatform } from '../lib/frontier-services';
import { SOCIAL_PLATFORMS } from '../lib/frontier-services';

export const ContentFeed = () => {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<SocialPlatform | undefined>(undefined);
  const { content, loading, error } = useContentPieces(undefined, activePlatform);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Content Feed</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{content.length} pieces generated</p>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActivePlatform(undefined)}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
            activePlatform === undefined
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-card text-muted-foreground border-border hover:border-outline hover:text-foreground',
          ].join(' ')}
        >
          🌐 All
        </button>
        {SOCIAL_PLATFORMS.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePlatform(p.value)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              activePlatform === p.value
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-card text-muted-foreground border-border hover:border-outline hover:text-foreground',
            ].join(' ')}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      ) : content.length === 0 ? (
        <EmptyState
          title="No content yet"
          description="Run a campaign swarm to generate content pieces across your selected platforms."
          action={{ label: 'New Campaign', onClick: () => navigate('/campaigns/new') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {content.map((piece) => (
            <ContentCard
              key={piece.id}
              piece={piece}
              onClick={() => navigate(`/content/${piece.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
