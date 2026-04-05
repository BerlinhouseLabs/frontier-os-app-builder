export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface DeviceToolbarProps {
  device: DeviceMode;
  setDevice: (d: DeviceMode) => void;
  devPort: number;
  onRefresh: () => void;
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

const DEVICES: Array<{ mode: DeviceMode; label: string; width: string }> = [
  { mode: 'desktop', label: 'Desktop', width: '100%' },
  { mode: 'tablet', label: 'Tablet', width: '768px' },
  { mode: 'mobile', label: 'Mobile', width: '375px' },
];

export function DeviceToolbar({ device, setDevice, devPort, onRefresh, onToggleSidebar, showMenuButton }: DeviceToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-1">
        {showMenuButton && (
          <button
            onClick={onToggleSidebar}
            className="p-1 mr-1 text-gray-400 hover:text-gray-200 transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {DEVICES.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setDevice(mode)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              device === mode
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Refresh preview"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={() => window.open(`http://localhost:${devPort}`, '_blank')}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Open in new tab"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
