import { useState } from 'react';
import type { ProjectState } from '../hooks/useStudio';

export function NextAction({ state }: { state: ProjectState }) {
  const [copied, setCopied] = useState(false);

  if (!state.nextAction || state.status === 'milestone-complete') return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(state.nextAction);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleCopy}
        className="w-full text-left bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-500/20 transition-colors group"
      >
        <div className="flex items-center justify-between gap-2">
          <code className="text-sm text-blue-400 font-mono">{state.nextAction}</code>
          <svg className="w-3.5 h-3.5 text-blue-500/50 group-hover:text-blue-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {copied ? <span className="text-green-400">Copied!</span> : 'Click to copy — run in Claude Code'}
        </p>
      </button>
    </div>
  );
}
