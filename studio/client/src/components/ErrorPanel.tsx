import { useState } from 'react';
import type { ParseError } from '../hooks/useStudio';

interface ErrorPanelProps {
  errors: ParseError[];
  viteError: string | null;
}

export function ErrorPanel({ errors, viteError }: ErrorPanelProps) {
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [viteExpanded, setViteExpanded] = useState(false);

  const visibleErrors = errors.filter(err => !dismissedKeys.has(`${err.file}:${err.message}`));
  const viteVisible = viteError && !dismissedKeys.has('vite');
  const hasVisible = visibleErrors.length > 0 || viteVisible;

  if (!hasVisible) return null;

  const dismissOne = (key: string) => {
    setDismissedKeys(prev => new Set(prev).add(key));
  };

  const dismissAll = () => {
    const keys = new Set(dismissedKeys);
    for (const err of errors) keys.add(`${err.file}:${err.message}`);
    if (viteError) keys.add('vite');
    setDismissedKeys(keys);
  };

  const viteFirstLine = viteError?.split('\n')[0] ?? '';
  const viteIsMultiline = viteError ? viteError.includes('\n') : false;

  return (
    <div className="mx-4 mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-amber-400">Issues detected</span>
        <button
          onClick={dismissAll}
          className="text-amber-500/50 hover:text-amber-400 text-xs transition-colors"
        >
          dismiss all
        </button>
      </div>
      <div className="px-3 pb-2 space-y-1.5">
        {visibleErrors.map((err) => {
          const key = `${err.file}:${err.message}`;
          return (
            <div key={key} className="flex items-start justify-between gap-2 text-xs">
              <div>
                <span className="text-amber-300 font-mono">{err.file}</span>
                <span className="text-gray-400 ml-1.5">{err.message}</span>
              </div>
              <button
                onClick={() => dismissOne(key)}
                className="text-amber-500/40 hover:text-amber-400 shrink-0 transition-colors"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          );
        })}
        {viteVisible && (
          <div className="text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-amber-300 font-mono">vite</span>
                <span className="text-gray-400 ml-1.5">{viteFirstLine}</span>
              </div>
              <button
                onClick={() => dismissOne('vite')}
                className="text-amber-500/40 hover:text-amber-400 shrink-0 transition-colors"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
            {viteIsMultiline && (
              <button
                onClick={() => setViteExpanded(v => !v)}
                className="text-xs text-amber-500/60 hover:text-amber-400 mt-1 transition-colors"
              >
                {viteExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
            {viteExpanded && viteError && (
              <pre className="mt-1 text-xs text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-900/50 rounded p-2">
                {viteError}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
