import { useNavigate } from 'react-router-dom';
import { useUserAgents } from '../hooks/useUserAgents';
import { useServices } from '../lib/frontier-services';
import { CategoryBadge } from '../components/CategoryBadge';
import { PriceTag } from '../components/PriceTag';
import { EmptyState } from '../components/EmptyState';
import type { Agent } from '../lib/frontier-services';
import { useState } from 'react';

const AgentRow = ({
  agent,
  onToggle,
  onDelete,
}: {
  agent: Agent;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                agent.isActive ? 'bg-success' : 'bg-muted-foreground'
              }`}
            />
            <h3 className="font-semibold text-sm text-foreground truncate">{agent.name}</h3>
          </div>
          <CategoryBadge category={agent.category} />
        </div>
        <PriceTag price={agent.pricePerCall} size="sm" />
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {agent.callCount.toLocaleString()} calls
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/agent/${agent.id}`)}
            className="text-xs text-primary hover:underline"
          >
            View
          </button>
          <button
            onClick={() => onToggle(agent.id, !agent.isActive)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {agent.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(agent.id)}
            className="text-xs text-danger hover:text-danger/80 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const MyAgents = () => {
  const navigate = useNavigate();
  const services = useServices();
  const { agents, loading, error, refetch } = useUserAgents();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await services.agents.updateAgent(id, { isActive: active });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await services.agents.deleteAgent(id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">My Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Loading…' : `${agents.length} agent${agents.length !== 1 ? 's' : ''} listed`}
          </p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          + List Agent
        </button>
      </div>

      {/* Errors */}
      {(error || actionError) && (
        <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
          <p className="text-xs text-alert">{error ?? actionError}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          title="No agents listed yet"
          description="List your first x402-enabled agent to start earning FND per call."
          action={{ label: 'List Your First Agent', onClick: () => navigate('/register') }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Summary stats */}
      {agents.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">
              {agents.filter((a) => a.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">
              {agents.reduce((s, a) => s + a.callCount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Calls</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">
              {(
                agents.reduce((s, a) => s + a.callCount * parseFloat(a.pricePerCall), 0)
              ).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Est. FND Earned</p>
          </div>
        </div>
      )}
    </div>
  );
};
