import type { SwarmStep } from '../lib/frontier-services';
import { AgentStatusBadge } from './AgentStatusBadge';

interface SwarmProgressProps {
  steps: SwarmStep[];
  isRunning: boolean;
  isComplete: boolean;
  txHash: string | null;
  contentCount: number;
}

export const SwarmProgress = ({
  steps,
  isRunning,
  isComplete,
  txHash,
  contentCount,
}: SwarmProgressProps) => {
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const totalAgents = 5;
  const progress = totalAgents > 0 ? Math.round((doneCount / totalAgents) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isComplete ? 'Swarm complete' : isRunning ? 'Swarm running…' : 'Waiting to start'}
          </span>
          <span className="text-foreground font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted-background rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Agent steps */}
      {steps.length > 0 && (
        <div className="flex flex-col gap-2 bg-muted-background rounded-lg p-3">
          {steps.map((step) => (
            <AgentStatusBadge key={step.agentRole} role={step.agentRole} status={step.status} />
          ))}
        </div>
      )}

      {/* Completion summary */}
      {isComplete && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-success text-lg">✅</span>
            <h4 className="text-sm font-semibold text-foreground">Swarm completed!</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Generated <span className="text-foreground font-medium">{contentCount} content pieces</span> across your selected platforms.
          </p>
          {txHash && (
            <p className="text-xs text-muted-foreground font-mono break-all">
              Tx: {txHash.slice(0, 20)}…{txHash.slice(-8)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
