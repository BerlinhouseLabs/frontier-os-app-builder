import type { Campaign } from '../lib/frontier-services';
import { PlatformBadge } from './PlatformBadge';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'text-muted-foreground bg-muted-background border-border' },
  running: { label: 'Running', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  completed: { label: 'Completed', color: 'text-success bg-success/10 border-success/20' },
  failed: { label: 'Failed', color: 'text-danger bg-danger/10 border-danger/20' },
};

export const CampaignCard = ({ campaign, onClick }: CampaignCardProps) => {
  const status = statusConfig[campaign.status];

  return (
    <div
      onClick={onClick}
      className={[
        'bg-card border border-border rounded-xl p-4 flex flex-col gap-3',
        onClick ? 'cursor-pointer hover:border-outline transition-colors' : '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
          {campaign.title}
        </h3>
        <span
          className={[
            'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border',
            status.color,
          ].join(' ')}
        >
          {status.label}
        </span>
      </div>

      {/* Brief excerpt */}
      <p className="text-xs text-muted-foreground line-clamp-2">{campaign.brief}</p>

      {/* Platforms */}
      <div className="flex flex-wrap gap-1">
        {campaign.platforms.map((p) => (
          <PlatformBadge key={p} platform={p} />
        ))}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {campaign.contentCount} {campaign.contentCount === 1 ? 'piece' : 'pieces'} generated
        </span>
        <span className="text-xs text-muted-foreground">
          {campaign.totalCost !== '0.00' ? `${campaign.totalCost} FND` : 'Not run'}
        </span>
      </div>
    </div>
  );
};
