import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudio } from './hooks/useStudio';
import { useToasts } from './hooks/useToasts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { Sidebar } from './components/Sidebar';
import { PreviewFrame } from './components/PreviewFrame';
import { DeviceToolbar, type DeviceMode } from './components/DeviceToolbar';
import { ToastContainer } from './components/ToastContainer';
import { WaitingScreen } from './components/WaitingScreen';

const DEVICE_STORAGE_KEY = 'studio-device';

function getInitialDevice(): DeviceMode {
  const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (stored === 'desktop' || stored === 'tablet' || stored === 'mobile') return stored;
  return 'desktop';
}

export function App() {
  const { state, viteStatus, viteError, errors, activities, connected, waiting, restartVite } = useStudio();
  const { toasts, addToast, dismissToast } = useToasts();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [device, setDevice] = useState<DeviceMode>(getInitialDevice);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Close sidebar on Escape
  useEffect(() => {
    if (isDesktop || !sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isDesktop, sidebarOpen]);

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

  // No connection
  if (!connected) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-blue-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Connecting to Frontier Studio...</p>
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

  const sidebarProps = {
    state,
    viteStatus,
    viteError,
    errors,
    activities,
    onRestartVite: restartVite,
  };

  // Main layout
  return (
    <div className="h-screen flex bg-gray-950">
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
          />
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
