import { useState } from 'react';
import type { ParseError } from '../hooks/useStudio';

interface ErrorPanelProps {
  errors: ParseError[];
  viteError: string | null;
}

export function ErrorPanel({ errors, viteError }: ErrorPanelProps) {
  const [dismissed, setDismissed] = useState(false);

  const hasErrors = errors.length > 0 || viteError;
  if (!hasErrors || dismissed) return null;

  return (
    <div className="mx-4 mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-amber-400">Issues detected</span>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500/50 hover:text-amber-400 text-xs"
        >
          dismiss
        </button>
      </div>
      <div className="px-3 pb-2 space-y-1.5">
        {errors.map((err, i) => (
          <div key={i} className="text-xs">
            <span className="text-amber-300 font-mono">{err.file}</span>
            <span className="text-gray-400 ml-1.5">{err.message}</span>
          </div>
        ))}
        {viteError && (
          <div className="text-xs">
            <span className="text-amber-300 font-mono">vite</span>
            <span className="text-gray-400 ml-1.5">{viteError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
