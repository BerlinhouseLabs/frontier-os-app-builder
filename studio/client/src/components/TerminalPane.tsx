import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalPaneProps {
  visible: boolean;
}

/**
 * Embedded terminal that opens its own WebSocket and pipes a server-side PTY.
 * Server spawns `claude` (or $SHELL fallback) on first 'pty-start' message.
 *
 * The pane is presented as "Frontier Builder" — a Frontier-branded surface
 * with the underlying CLI as an implementation detail.
 */

export function TerminalPane({ visible }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const startedRef = useRef(false);
  const [status, setStatus] = useState<'connecting' | 'ready' | 'exited' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize xterm once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: '"SF Mono", Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      allowProposedApi: true,
      theme: {
        background: '#0a0a0a',
        foreground: '#e5e7eb',
        cursor: '#60a5fa',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#374151',
        black: '#1f2937',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e5e7eb',
        brightBlack: '#4b5563',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f9fafb',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);

    termRef.current = term;
    fitRef.current = fit;

    // Initial fit (deferred so the container has measured)
    requestAnimationFrame(() => {
      try {
        fit.fit();
      } catch {
        // container not yet measurable
      }
    });

    // Open WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      const { cols, rows } = term;
      ws.send(JSON.stringify({ type: 'pty-start', cols, rows }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pty-started') {
          startedRef.current = true;
          setStatus('ready');
        } else if (msg.type === 'pty-data' && typeof msg.data === 'string') {
          term.write(msg.data);
        } else if (msg.type === 'pty-exit') {
          setStatus('exited');
          term.write(`\r\n\x1b[33m[builder session ended — code ${msg.code}]\x1b[0m\r\n`);
        } else if (msg.type === 'pty-error') {
          setStatus('error');
          setErrorMsg(msg.message || 'Builder failed to start');
        }
      } catch {
        // ignore non-JSON / unrelated messages on this ws
      }
    };

    ws.onclose = () => {
      if (status !== 'exited' && status !== 'error') {
        setStatus('error');
        setErrorMsg('Connection lost');
      }
    };

    // xterm → server
    const inputDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pty-input', data }));
      }
    });

    const resizeDisposable = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN && startedRef.current) {
        ws.send(JSON.stringify({ type: 'pty-resize', cols, rows }));
      }
    });

    // Container resize → fit
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // ignore
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      inputDisposable.dispose();
      resizeDisposable.dispose();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.send(JSON.stringify({ type: 'pty-kill' }));
        } catch {
          // ignore
        }
        ws.close();
      }
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      wsRef.current = null;
    };
    // Mount-only — TerminalPane is conditionally rendered, so a fresh mount means a fresh PTY.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refit when visibility toggles (in case the pane was hidden during a window resize)
  useEffect(() => {
    if (visible && fitRef.current) {
      requestAnimationFrame(() => {
        try {
          fitRef.current?.fit();
          termRef.current?.focus();
        } catch {
          // ignore
        }
      });
    }
  }, [visible]);

  const statusDot =
    status === 'ready' ? 'bg-emerald-400' :
    status === 'connecting' ? 'bg-amber-400 animate-pulse' :
    status === 'exited' ? 'bg-gray-500' :
    'bg-red-500';

  const statusLabel =
    status === 'ready' ? 'Online' :
    status === 'connecting' ? 'Waking the Builder…' :
    status === 'exited' ? 'Offline' :
    errorMsg || 'Error';

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header — claimed as Frontier Builder, not "Terminal" */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            F
          </div>
          <span className="text-gray-200 font-medium">Frontier Builder</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className="text-gray-400 text-[11px]" title={errorMsg || ''}>{statusLabel}</span>
        </div>
      </div>

      {/* Body: xterm */}
      <div ref={containerRef} className="flex-1 min-h-0 px-1 pt-1" />
    </div>
  );
}
