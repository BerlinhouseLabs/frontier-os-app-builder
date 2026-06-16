import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { useSwarmRun, SWARM_RUN_COST } from '../hooks/useSwarmRun';
import { useBalance } from '../hooks/useBalance';
import { useContentPieces } from '../hooks/useContentPieces';
import { SwarmProgress } from '../components/SwarmProgress';
import { ContentCard } from '../components/ContentCard';
import { PlatformBadge } from '../components/PlatformBadge';
import type { Campaign } from '../lib/frontier-services';

export const CampaignDetail = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const services = useServices();
  const { balance } = useBalance();
  const { steps, generatedContent, isRunning, isComplete, error: swarmError, txHash, startRun, reset } = useSwarmRun();
  const { content, refetch: refetchContent } = useContentPieces(campaignId);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    const load = async () => {
      try {
        const c = await services.swarm.getCampaign(campaignId);
        setCampaign(c);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [services, campaignId]);

  const handleRunSwarm = async () => {
    if (!campaign) return;
    reset();
    await startRun(campaign, balance);
    const updated = await services.swarm.getCampaign(campaign.id);
    if (updated) setCampaign(updated);
    refetchContent();
  };

  const handleDelete = async () => {
    if (!campaign) return;
    setDeleteLoading(true);
    try {
      await services.swarm.deleteCampaign(campaign.id);
      navigate('/campaigns');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground">Campaign not found.</p>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: 'Draft', color: 'text-muted-foreground' },
    running: { label: 'Running', color: 'text-yellow-400' },
    completed: { label: 'Completed', color: 'text-success' },
    failed: { label: 'Failed', color: 'text-danger' },
  };

  const statusInfo = statusConfig[campaign.status];
  const displayContent = isComplete && generatedContent.length > 0 ? generatedContent : content;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => navigate('/campaigns')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            ← Campaigns
          </button>
          <h1 className="text-lg font-bold text-foreground">{campaign.title}</h1>
          <div className="flex flex-wrap gap-1">
            {campaign.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          <button
            onClick={handleDelete}
            disabled={deleteLoading || isRunning}
            className="px-3 py-1.5 border border-danger/30 text-xs text-danger rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Campaign info */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Brief</p>
            <p className="text-foreground mt-0.5">{campaign.brief}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-muted-foreground">Audience</p>
              <p className="text-foreground mt-0.5">{campaign.targetAudience}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tone</p>
              <p className="text-foreground mt-0.5">{campaign.tone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cost</p>
              <p className="text-foreground mt-0.5">{campaign.totalCost !== '0.00' ? `${campaign.totalCost} FND` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Run swarm / progress */}
      {campaign.status === 'draft' && !isRunning && !isComplete && (
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Ready to run the swarm?</h3>
            <span className="text-xs text-muted-foreground">{SWARM_RUN_COST} FND</span>
          </div>
          {swarmError && (
            <p className="text-xs text-danger">{swarmError}</p>
          )}
          <button
            onClick={handleRunSwarm}
            className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            🐝 Launch Swarm · {SWARM_RUN_COST} FND
          </button>
        </div>
      )}

      {(isRunning || isComplete) && (
        <SwarmProgress
          steps={steps}
          isRunning={isRunning}
          isComplete={isComplete}
          txHash={txHash}
          contentCount={generatedContent.length || campaign.contentCount}
        />
      )}

      {/* Content pieces */}
      {displayContent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Generated Content ({displayContent.length})
            </h2>
            <button
              onClick={() => navigate('/content')}
              className="text-xs text-primary hover:underline"
            >
              Browse all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayContent.map((piece) => (
              <ContentCard
                key={piece.id}
                piece={piece}
                onClick={() => navigate(`/content/${piece.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
