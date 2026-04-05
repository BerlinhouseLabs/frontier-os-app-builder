import { useState, useEffect } from 'react';
import type { ViteStatus, ParseError } from '../hooks/useStudio';
import type { DeviceMode } from './DeviceToolbar';

interface PreviewFrameProps {
  devPort: number;
  viteStatus: ViteStatus;
  viteError: string | null;
  device: DeviceMode;
  refreshKey: number;
  errors?: ParseError[];
}

const DEVICE_WIDTHS: Record<DeviceMode, number | null> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
};

export function PreviewFrame({ devPort, viteStatus, viteError, device, refreshKey, errors = [] }: PreviewFrameProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Reset dismissed state when errors change
  useEffect(() => {
    setDismissed(false);
    setExpanded(false);
  }, [errors]);
  if (viteStatus === 'starting') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Starting dev server...</p>
        </div>
      </div>
    );
  }

  if (viteStatus === 'stopped' || viteStatus === 'error') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center space-y-2 max-w-sm px-4">
          <p className="text-sm text-gray-400">
            {viteStatus === 'error' ? 'Dev server encountered an error' : 'Dev server is not running'}
          </p>
          {viteError && (
            <pre className="text-xs text-amber-400/80 bg-gray-800 rounded-lg p-3 text-left overflow-x-auto whitespace-pre-wrap">
              {viteError}
            </pre>
          )}
          {!viteError && (
            <p className="text-xs text-gray-500">
              Waiting for scaffold to complete or run <code className="text-gray-400 font-mono">npm run dev</code> manually
            </p>
          )}
        </div>
      </div>
    );
  }

  const width = DEVICE_WIDTHS[device];
  const showOverlay = viteStatus === 'running' && errors.length > 0 && !dismissed;

  return (
    <div className={`h-full relative ${width ? 'flex items-start justify-center bg-gray-950 p-4 overflow-auto' : ''}`}>
      <iframe
        key={refreshKey}
        src={`http://localhost:${devPort}`}
        className={width
          ? 'border border-gray-700 rounded-lg shadow-2xl bg-white'
          : 'w-full h-full border-0'
        }
        style={width ? { width: `${width}px`, height: device === 'mobile' ? '812px' : '1024px' } : undefined}
        title="App Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      {showOverlay && (
        <div className="absolute bottom-0 inset-x-0 z-10 bg-red-950/90 backdrop-blur-sm border-t border-red-500/30">
          <div
            className="flex items-center justify-between px-3 py-2 cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <span className="text-xs text-red-300">
              {errors.length} issue{errors.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 text-red-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                className="text-xs text-red-400 hover:text-red-200"
              >
                dismiss
              </button>
            </div>
          </div>
          {expanded && (
            <div className="px-3 pb-2 space-y-1 max-h-40 overflow-y-auto">
              {errors.map((err, i) => (
                <div key={i} className="text-xs">
                  <span className="text-red-400 font-mono">{err.file}</span>
                  <span className="text-red-300/70 ml-1.5">{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
