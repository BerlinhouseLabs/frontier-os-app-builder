import type { ViteStatus as ViteStatusType } from '../hooks/useStudio';

const VITE_CONFIG: Record<ViteStatusType, { label: string; dot: string }> = {
  running: { label: 'Dev server running', dot: 'bg-green-400' },
  starting: { label: 'Starting dev server...', dot: 'bg-amber-400 animate-pulse' },
  stopped: { label: 'Dev server stopped', dot: 'bg-gray-500' },
  error: { label: 'Dev server error', dot: 'bg-red-400' },
};

interface Props {
  status: ViteStatusType;
  error: string | null;
  onRestart: () => void;
}

export function ViteStatus({ status, error, onRestart }: Props) {
  const config = VITE_CONFIG[status];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-xs text-gray-400">{config.label}</span>
        </div>
        {(status === 'stopped' || status === 'error') && (
          <button
            onClick={onRestart}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            restart
          </button>
        )}
      </div>
      {error && status === 'error' && (
        <p className="text-xs text-amber-400/70 truncate" title={error}>
          {error.split('\n')[0]}
        </p>
      )}
    </div>
  );
}
