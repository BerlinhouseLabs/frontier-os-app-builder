import { useState, useEffect, useRef } from 'react';
import type { ProjectState } from '../hooks/useStudio';

/** Human-friendly labels for /fos: commands. */
function describeCommand(cmd: string): { label: string; description: string } {
  const m = cmd.match(/^\/fos:(\S+)/);
  if (!m) return { label: cmd, description: '' };
  switch (m[1]) {
    case 'discuss': return { label: 'Discuss', description: 'Choose how features work' };
    case 'plan': return { label: 'Plan', description: 'Create the build plan' };
    case 'execute': return { label: 'Build', description: 'Build this phase' };
    case 'ship': return { label: 'Ship', description: 'Deploy your app' };
    case 'new-milestone': return { label: 'New Version', description: 'Start the next version' };
    default: return { label: m[1], description: '' };
  }
}

interface NextActionProps {
  state: ProjectState;
  onRunCommand?: (cmd: string) => void;
}

export function NextAction({ state, onRunCommand }: NextActionProps) {
  const [working, setWorking] = useState(false);
  const prevActionRef = useRef(state.nextAction);

  // Reset working state when nextAction changes (workflow completed)
  useEffect(() => {
    if (prevActionRef.current !== state.nextAction) {
      setWorking(false);
      prevActionRef.current = state.nextAction;
    }
  }, [state.nextAction]);

  if (!state.nextAction || state.status === 'milestone-complete') return null;

  const command = state.nextAction;
  const { label, description } = describeCommand(command);

  const handleRun = () => {
    if (!onRunCommand || working) return;
    setWorking(true);
    onRunCommand('/clear');
    setTimeout(() => onRunCommand(command), 600);
  };

  // No terminal connection — fall back to display-only
  if (!onRunCommand) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        <code className="text-sm text-blue-400 font-mono">{command}</code>
        <p className="text-xs text-gray-500 mt-1">Run this in Claude Code</p>
      </div>
    );
  }

  // Working state — show progress indicator
  if (working) {
    return (
      <div className="w-full rounded-lg px-4 py-3 bg-gray-800/80 border border-gray-700/50">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 border-2 border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
          </span>
          <div>
            <span className="text-sm font-medium text-gray-300">{label}...</span>
            <p className="text-[11px] text-gray-500 mt-0.5">Working — this may take a few minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state — clickable button
  return (
    <button
      onClick={handleRun}
      className="w-full rounded-lg px-4 py-3 text-left transition-all bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-500/50 cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <div>
            <span className="text-sm font-medium text-blue-200">{label}</span>
            {description && (
              <p className="text-[11px] text-blue-400/60 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
