import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStudio } from './hooks/useStudio';
import { useToasts } from './hooks/useToasts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Sidebar } from './components/Sidebar';
import { PreviewFrame, PHONE_SIZES, findPhoneSize, DEFAULT_PHONE_ID } from './components/PreviewFrame';
import { ToastContainer } from './components/ToastContainer';
import { WaitingScreen } from './components/WaitingScreen';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { ViteLogViewer } from './components/ViteLogViewer';
import { TerminalPane, type TerminalPaneHandle } from './components/TerminalPane';
import { NextAction } from './components/NextAction';
import { AppPicker } from './components/AppPicker';
import { ContextPicker } from './components/ContextPicker';

export function App() {
  const {
    state, viteStatus, viteError, errors, activities, connected, waiting,
    reconnectAttempt, reconnectDelay, restartVite, viteLogs, requestViteLogs,
    appDir, apps, workspaceRoot, appsLoading, selectApp, backToApps, refreshApps,
    appChangeKey, writeContext, contextWritePending,
  } = useStudio();
  const { toasts, addToast, dismissToast } = useToasts();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [creatingApp, setCreatingApp] = useState(false);
  const [createCommand, setCreateCommand] = useState<string | null>(null);
  const [pendingDescription, setPendingDescription] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef<TerminalPaneHandle>(null);
  const [phoneId, setPhoneId] = useState<string>(() => {
    try {
      return localStorage.getItem('studio-phone') || DEFAULT_PHONE_ID;
    } catch {
      return DEFAULT_PHONE_ID;
    }
  });
  const phone = findPhoneSize(phoneId);

  const handleSetPhoneId = useCallback((id: string) => {
    setPhoneId(id);
    try { localStorage.setItem('studio-phone', id); } catch { /* ignore */ }
  }, []);

  // Set the create command once context write completes
  useEffect(() => {
    if (pendingDescription && !contextWritePending) {
      const escaped = pendingDescription.replace(/"/g, '\\"');
      setCreateCommand(`/fos:new-app "${escaped}"`);
      setPendingDescription(null);
    }
  }, [pendingDescription, contextWritePending]);

  // Snapshot apps count when entering creation terminal, poll for new apps, auto-select
  const appsAtCreationRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!(creatingApp && createCommand)) return;
    // Record which apps existed when creation started
    appsAtCreationRef.current = new Set(apps.map(a => a.path));
    const interval = setInterval(() => refreshApps(), 3000);
    return () => clearInterval(interval);
  }, [creatingApp, createCommand, refreshApps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!(creatingApp && createCommand)) return;
    const newApp = apps.find(a => !appsAtCreationRef.current.has(a.path));
    if (newApp) {
      setCreatingApp(false);
      setCreateCommand(null);
      selectApp(newApp.path);
    }
  }, [apps, creatingApp, createCommand, selectApp]);

  // Track previous values for toast triggers
  const prevStatusRef = useRef<string | null>(null);
  const prevCompletedRef = useRef<number>(0);
  const prevViteRef = useRef<string>('stopped');

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleRunCommand = useCallback((cmd: string) => {
    terminalRef.current?.sendCommand(cmd);
    // If terminal is hidden, show it so the user sees what's happening
    if (!showTerminal) setShowTerminal(true);
  }, [showTerminal]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    'r': () => handleRefresh(),
    's': () => { if (!isDesktop) setSidebarOpen(o => !o); },
    '?': () => setShowHelp(v => !v),
    'l': () => { setShowLogs(v => { if (!v) requestViteLogs(); return !v; }); },
    't': () => setShowTerminal(v => !v),
    'k': { handler: () => setShowPalette(v => !v), meta: true },
    'Escape': () => {
      if (showPalette) { setShowPalette(false); return; }
      if (showLogs) { setShowLogs(false); return; }
      if (showHelp) { setShowHelp(false); return; }
      if (sidebarOpen && !isDesktop) setSidebarOpen(false);
    },
  }), [handleRefresh, isDesktop, sidebarOpen, showPalette, showLogs, showHelp, requestViteLogs]);

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

  const handleShowLogs = useCallback(() => {
    setShowLogs(true);
    requestViteLogs();
  }, [requestViteLogs]);

  // Command palette actions
  const paletteActions: PaletteAction[] = useMemo(() => {
    const actions: PaletteAction[] = [
      { id: 'refresh', label: 'Refresh Preview', shortcut: 'R', action: handleRefresh },
      { id: 'restart-vite', label: 'Restart Dev Server', action: restartVite },
      { id: 'toggle-terminal', label: 'Toggle Terminal', shortcut: 'T', action: () => setShowTerminal(v => !v) },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: '?', action: () => setShowHelp(true) },
    ];
    if (state?.devPort) {
      actions.push({
        id: 'open-tab',
        label: 'Open in New Tab',
        action: () => window.open(`http://localhost:${state.devPort}`, '_blank'),
      });
    }
    if (state?.nextAction) {
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
  }, [handleRefresh, restartVite, state?.devPort, state?.nextAction, isDesktop]);

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

  // No connection at all — full-screen spinner
  if (!connected && !state && !apps.length) {
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

  // No app selected — show the picker, context picker, or creation terminal
  if (!appDir) {
    // Step 2: Terminal with the command ready to run
    if (creatingApp && createCommand) {
      const copyCmd = () => {
        navigator.clipboard.writeText(createCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="h-screen flex flex-col bg-gray-950">
          {/* Compact top bar with command pill */}
          <div className="border-b border-gray-800 px-4 py-2 shrink-0 flex items-center gap-3">
            <button
              onClick={() => { setCreatingApp(false); setCreateCommand(null); }}
              className="text-gray-500 hover:text-gray-200 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={copyCmd}
              className="flex-1 min-w-0 flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg px-3 py-1.5 transition-colors group text-left"
              title="Click to copy"
            >
              <code className="text-xs text-blue-400 font-mono truncate flex-1">{createCommand}</code>
              <span className={`text-[10px] shrink-0 transition-colors ${copied ? 'text-green-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
                {copied ? 'Copied!' : 'Click to copy'}
              </span>
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <TerminalPane key="create" visible={true} />
          </div>
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
      );
    }

    // Step 1: Context picker (description + context sources)
    if (creatingApp) {
      return (
        <>
          <ContextPicker
            onStart={(description, contextPrompt) => {
              if (contextPrompt) {
                // Write context file first, then set command after write ack
                writeContext(`# Frontier Tower Context\n\nSelected by the developer in Frontier Studio for this app.\n\n${contextPrompt}`);
                setPendingDescription(description);
              } else {
                // No context to write — set command immediately
                const escaped = description.replace(/"/g, '\\"');
                setCreateCommand(`/fos:new-app "${escaped}"`);
              }
            }}
            onBack={() => setCreatingApp(false)}
          />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
      );
    }

    // App picker (default view)
    return (
      <>
        <AppPicker
          apps={apps}
          workspaceRoot={workspaceRoot}
          loading={appsLoading}
          onSelect={selectApp}
          onRefresh={refreshApps}
          onCreateApp={() => setCreatingApp(true)}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // App selected but state not yet loaded — waiting screen
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
    onShowLogs: handleShowLogs,
    onBackToApps: backToApps,
  };

  const isReconnecting = !connected && !!state;

  // Main layout — 3 columns: sidebar | preview (mobile only) | terminal
  return (
    <div className="h-screen flex bg-gray-950">
      {/* Reconnection banner */}
      {isReconnecting && (
        <div className="fixed top-0 inset-x-0 z-40 bg-amber-500/90 text-center text-xs py-1.5 text-black font-medium">
          Reconnecting... (attempt {reconnectAttempt}, next retry in {Math.ceil(reconnectDelay / 1000)}s)
        </div>
      )}

      <div className={`flex flex-1 h-full ${isReconnecting ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* LEFT: Sidebar / progress — desktop normal flex child */}
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

        {/* MIDDLE: Phone preview */}
        <main className="flex-1 h-full flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2">
              {!isDesktop && (
                <button
                  onClick={() => setSidebarOpen(o => !o)}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Toggle sidebar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <span className="text-xs text-gray-500 font-mono">localhost:{state.devPort}</span>
              <select
                value={phoneId}
                onChange={(e) => handleSetPhoneId(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-600 cursor-pointer hover:bg-gray-750 transition-colors"
                title="Phone size"
              >
                {PHONE_SIZES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.width}×{p.height}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Refresh preview (R)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => window.open(`http://localhost:${state.devPort}`, '_blank')}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Open in new tab"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button
                onClick={() => setShowTerminal(v => !v)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${showTerminal ? 'text-gray-300 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                title="Toggle terminal (T)"
              >
                Terminal
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <PreviewFrame
              devPort={state.devPort}
              viteStatus={viteStatus}
              viteError={viteError}
              phone={phone}
              refreshKey={refreshKey}
              errors={errors}
            />
          </div>
        </main>

        {/* RIGHT: Claude Code terminal + workflow buttons — keyed on appChangeKey so it remounts on app swap */}
        {showTerminal && isDesktop && (
          <aside className="w-[480px] shrink-0 h-full border-l border-gray-800 flex flex-col">
            <div className="flex-1 min-h-0">
              <TerminalPane ref={terminalRef} key={appChangeKey} visible={showTerminal} />
            </div>
            {state.nextAction && (
              <div className="border-t border-gray-800 px-3 py-3 bg-gray-900/50 shrink-0">
                <NextAction state={state} onRunCommand={handleRunCommand} />
              </div>
            )}
          </aside>
        )}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      {showPalette && <CommandPalette actions={paletteActions} onClose={() => setShowPalette(false)} />}
      {showLogs && <ViteLogViewer lines={viteLogs} onRefresh={requestViteLogs} onClose={() => setShowLogs(false)} />}
    </div>
  );
}
