import { Link } from 'react-router-dom';
import type { Agent } from '../lib/frontier-services';
import { CategoryBadge } from './CategoryBadge';
import { PriceTag } from './PriceTag';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  return (
    <Link
      to={`/agent/${agent.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-outline transition-colors no-underline group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{agent.ownerName}</p>
        </div>
        <CategoryBadge category={agent.category} />
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <PriceTag price={agent.pricePerCall} size="sm" />
        <span className="text-xs text-muted-foreground">
          {agent.callCount.toLocaleString()} calls
        </span>
      </div>
    </Link>
  );
};
