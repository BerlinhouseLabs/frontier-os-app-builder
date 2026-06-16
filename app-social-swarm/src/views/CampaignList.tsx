import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { CampaignCard } from '../components/CampaignCard';
import { EmptyState } from '../components/EmptyState';

export const CampaignList = () => {
  const navigate = useNavigate();
  const { campaigns, loading, error } = useCampaigns();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Campaigns</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{campaigns.length} campaigns total</p>
        </div>
        <button
          onClick={() => navigate('/campaigns/new')}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          + New Campaign
        </button>
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
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Launch your first swarm to generate content for Frontier Tower."
          action={{ label: 'New Campaign', onClick: () => navigate('/campaigns/new') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
