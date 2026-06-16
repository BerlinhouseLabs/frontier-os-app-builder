import type { SwarmAgentRole } from '../lib/frontier-services';
import { SWARM_AGENT_ROLES } from '../lib/frontier-services';

interface AgentStatusBadgeProps {
  role: SwarmAgentRole;
  status: 'pending' | 'running' | 'done' | 'failed';
}

const statusConfig = {
  pending: { label: 'Pending', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  running: { label: 'Running', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
  done: { label: 'Done', color: 'text-success', dot: 'bg-success' },
  failed: { label: 'Failed', color: 'text-danger', dot: 'bg-danger' },
};

export const AgentStatusBadge = ({ role, status }: AgentStatusBadgeProps) => {
  const agentInfo = SWARM_AGENT_ROLES.find((a) => a.value === role);
  const statusInfo = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
      <span className="text-xs text-muted-foreground">
        {agentInfo?.emoji} {agentInfo?.label}
      </span>
      <span className={`text-xs font-medium ml-auto ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    </div>
  );
};
