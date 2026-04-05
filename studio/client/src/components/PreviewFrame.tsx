import type { ViteStatus } from '../hooks/useStudio';
import type { DeviceMode } from './DeviceToolbar';

interface PreviewFrameProps {
  devPort: number;
  viteStatus: ViteStatus;
  viteError: string | null;
  device: DeviceMode;
  refreshKey: number;
}

const DEVICE_WIDTHS: Record<DeviceMode, number | null> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
};

export function PreviewFrame({ devPort, viteStatus, viteError, device, refreshKey }: PreviewFrameProps) {
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
            <pre className="text-[11px] text-amber-400/80 bg-gray-800 rounded-lg p-3 text-left overflow-x-auto whitespace-pre-wrap">
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

  return (
    <div className={`h-full ${width ? 'flex items-start justify-center bg-gray-950 p-4 overflow-auto' : ''}`}>
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
    </div>
  );
}
