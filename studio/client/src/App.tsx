import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStudio } from './hooks/useStudio';
import { useToasts } from './hooks/useToasts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Sidebar } from './components/Sidebar';
import { PreviewFrame } from './components/PreviewFrame';
import { DeviceToolbar, type DeviceMode } from './components/DeviceToolbar';
import { ToastContainer } from './components/ToastContainer';
import { WaitingScreen } from './components/WaitingScreen';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { ViteLogViewer } from './components/ViteLogViewer';

const DEVICE_STORAGE_KEY = 'studio-device';

function getInitialDevice(): DeviceMode {
  const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (stored === 'desktop' || stored === 'tablet' || stored === 'mobile') return stored;
  return 'desktop';
}

export function App() {
  const { state, viteStatus, viteError, errors, activities, connected, waiting, reconnectAttempt, reconnectDelay, restartVite, viteLogs, requestViteLogs } = useStudio();
  const { toasts, addToast, dismissToast } = useToasts();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [device, setDevice] = useState<DeviceMode>(getInitialDevice);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Track previous values for toast triggers
  const prevStatusRef = useRef<string | null>(null);
  const prevCompletedRef = useRef<number>(0);
  const prevViteRef = useRef<string>('stopped');

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleSetDevice = useCallback((d: DeviceMode) => {
    setDevice(d);
    localStorage.setItem(DEVICE_STORAGE_KEY, d);
  }, []);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    '1': () => handleSetDevice('desktop'),
    '2': () => handleSetDevice('tablet'),
    '3': () => handleSetDevice('mobile'),
    'r': () => handleRefresh(),
    's': () => { if (!isDesktop) setSidebarOpen(o => !o); },
    '?': () => setShowHelp(v => !v),
    'l': () => { setShowLogs(v => { if (!v) requestViteLogs(); return !v; }); },
    'k': { handler: () => setShowPalette(v => !v), meta: true },
    'Escape': () => {
      if (showPalette) { setShowPalette(false); return; }
      if (showLogs) { setShowLogs(false); return; }
      if (showHelp) { setShowHelp(false); return; }
      if (sidebarOpen && !isDesktop) setSidebarOpen(false);
    },
  }), [handleSetDevice, handleRefresh, isDesktop, sidebarOpen, showPalette, showLogs, showHelp, requestViteLogs]);

  useKeyboardShortcuts(shortcuts);

  // Toast triggers on state changes
  useEffect(() => {
    if (!state) return;

    if (prevStatusRef.current && prevStatusRef.current !== state.status) {
      const label = state.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addToast(label, state.status.includes('complete') ? 'success' : 'info');
    }
    prevStatusRef.current = state.status;

    if (prevCompletedRef.current < state.completedPhases) {
      const justDone = state.phases.find(
        (p, i) => p.status === 'complete' && i === state.completedPhases - 1
      );
      if (justDone) {
        addToast(`Phase ${justDone.number} complete: ${justDone.name}`, 'success');
      }
    }
    prevCompletedRef.current = state.completedPhases;
  }, [state, addToast]);

  useEffect(() => {
    if (prevViteRef.current !== viteStatus) {
      if (viteStatus === 'running' && prevViteRef.current !== 'running') {
        addToast('Dev server ready', 'success');
      } else if (viteStatus === 'error' && prevViteRef.current !== 'error') {
        addToast('Dev server error', 'warning');
      }
    }
    prevViteRef.current = viteStatus;
  }, [viteStatus, addToast]);

  // Dynamic favicon + tab title
  useEffect(() => {
    let color: string;
    let prefix: string;
    if (!connected) {
      color = '#ef4444'; prefix = '\u25CB';
    } else if (viteStatus === 'error' || errors.length > 0) {
      color = '#ef4444'; prefix = '\u2715';
    } else if (state?.status === 'executing' || state?.status === 'starting' || viteStatus === 'starting') {
      color = '#f59e0b'; prefix = '\u25CC';
    } else if (state?.status === 'phase-complete' || state?.status === 'milestone-complete') {
      color = '#22c55e'; prefix = '\u25CF';
    } else {
      color = '#3b82f6'; prefix = '\u25CF';
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${color}"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold">F</text></svg>`;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.title = `${prefix} Frontier Studio`;
  }, [connected, viteStatus, state?.status, errors.length]);

  // No connection and no prior state — full-screen spinner
  if (!connected && !state) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-blue-400 rounded-full animate-spin mx-auto" />
          {reconnectAttempt > 0 ? (
            <p className="text-sm text-gray-400">
              Reconnecting... (attempt {reconnectAttempt}, next retry in {Math.ceil(reconnectDelay / 1000)}s)
            </p>
          ) : (
            <p className="text-sm text-gray-400">Connecting to Frontier Studio...</p>
          )}
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Waiting for app
  if (waiting || !state) {
    return (
      <div className="h-screen bg-gray-950">
        <WaitingScreen />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const handleShowLogs = useCallback(() => {
    setShowLogs(true);
    requestViteLogs();
  }, [requestViteLogs]);

  const sidebarProps = {
    state,
    viteStatus,
    viteError,
    errors,
    activities,
    onRestartVite: restartVite,
    onShowLogs: handleShowLogs,
  };

  // Command palette actions
  const paletteActions: PaletteAction[] = useMemo(() => {
    const actions: PaletteAction[] = [
      { id: 'desktop', label: 'Switch to Desktop', shortcut: '1', action: () => handleSetDevice('desktop') },
      { id: 'tablet', label: 'Switch to Tablet', shortcut: '2', action: () => handleSetDevice('tablet') },
      { id: 'mobile', label: 'Switch to Mobile', shortcut: '3', action: () => handleSetDevice('mobile') },
      { id: 'refresh', label: 'Refresh Preview', shortcut: 'R', action: handleRefresh },
      { id: 'restart-vite', label: 'Restart Dev Server', action: restartVite },
      { id: 'open-tab', label: 'Open in New Tab', action: () => window.open(`http://localhost:${state.devPort}`, '_blank') },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: '?', action: () => setShowHelp(true) },
    ];
    if (state.nextAction) {
      actions.push({
        id: 'copy-next',
        label: 'Copy Next Action',
        action: () => navigator.clipboard.writeText(state.nextAction),
      });
    }
    if (!isDesktop) {
      actions.push({ id: 'sidebar', label: 'Toggle Sidebar', shortcut: 'S', action: () => setSidebarOpen(o => !o) });
    }
    return actions;
  }, [handleSetDevice, handleRefresh, restartVite, state.devPort, state.nextAction, isDesktop]);

  const isReconnecting = !connected && !!state;

  // Main layout
  return (
    <div className="h-screen flex bg-gray-950">
      {/* Reconnection banner */}
      {isReconnecting && (
        <div className="fixed top-0 inset-x-0 z-40 bg-amber-500/90 text-center text-xs py-1.5 text-black font-medium">
          Reconnecting... (attempt {reconnectAttempt}, next retry in {Math.ceil(reconnectDelay / 1000)}s)
        </div>
      )}

      <div className={`flex flex-1 h-full ${isReconnecting ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* Desktop sidebar — normal flex child */}
        {isDesktop && <Sidebar {...sidebarProps} />}

        {/* Mobile sidebar — fixed overlay with backdrop */}
        {!isDesktop && (
          <>
            <div
              className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ${
                sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setSidebarOpen(false)}
            />
            <div
              className={`fixed inset-y-0 left-0 z-40 w-80 transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <Sidebar {...sidebarProps} />
            </div>
          </>
        )}

        <main className="flex-1 h-full flex flex-col">
          <DeviceToolbar
            device={device}
            setDevice={handleSetDevice}
            devPort={state.devPort}
            onRefresh={handleRefresh}
            onToggleSidebar={() => setSidebarOpen(o => !o)}
            showMenuButton={!isDesktop}
          />
          <div className="flex-1">
            <PreviewFrame
              devPort={state.devPort}
              viteStatus={viteStatus}
              viteError={viteError}
              device={device}
              refreshKey={refreshKey}
              errors={errors}
            />
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      {showPalette && <CommandPalette actions={paletteActions} onClose={() => setShowPalette(false)} />}
      {showLogs && <ViteLogViewer lines={viteLogs} onRefresh={requestViteLogs} onClose={() => setShowLogs(false)} />}
    </div>
  );
}
