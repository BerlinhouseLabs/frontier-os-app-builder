import { useState, useEffect, useRef, useCallback } from 'react';
import type { PhaseInfo, ParseError, PlanSummary, PhaseDetail, ProjectState, ActivityEvent, ViteStatus, AppSummary } from '@studio/shared/types';

export type { PhaseInfo, ParseError, PlanSummary, PhaseDetail, ProjectState, ActivityEvent, ViteStatus, AppSummary };

export interface StudioState {
  state: ProjectState | null;
  viteStatus: ViteStatus;
  viteError: string | null;
  errors: ParseError[];
  activities: ActivityEvent[];
  connected: boolean;
  waiting: boolean;
  reconnectAttempt: number;
  reconnectDelay: number;
  restartVite: () => void;
  viteLogs: string[];
  requestViteLogs: () => void;
  // Workspace / app picker
  appDir: string | null;
  apps: AppSummary[];
  workspaceRoot: string | null;
  appsLoading: boolean;
  selectApp: (path: string) => void;
  backToApps: () => void;
  refreshApps: () => void;
  /** Bumped whenever the server switches apps — use as a React key to remount child trees. */
  appChangeKey: number;
  /** Write a context file to the workspace root for /fos:new-app to read. */
  writeContext: (content: string) => void;
}

export function useStudio(): StudioState {
  const [state, setState] = useState<ProjectState | null>(null);
  const [viteStatus, setViteStatus] = useState<ViteStatus>('stopped');
  const [viteError, setViteError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [viteLogs, setViteLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [reconnectDelay, setReconnectDelay] = useState(0);
  const [appDir, setAppDir] = useState<string | null>(null);
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appChangeKey, setAppChangeKey] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      attemptRef.current = 0;
      setReconnectAttempt(0);
      setReconnectDelay(0);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'state':
            setState(msg.data);
            setWaiting(false);
            break;
          case 'vite':
            setViteStatus(msg.status);
            setViteError(msg.error || null);
            break;
          case 'waiting':
            setWaiting(true);
            setState(null);
            break;
          case 'no-app':
            setWaiting(false);
            setState(null);
            setAppDir(null);
            setActivities([]);
            setErrors([]);
            break;
          case 'app-changed':
            setAppDir(msg.appDir ?? null);
            setAppChangeKey(k => k + 1);
            // When switching, clear the previous app's transient state
            if (!msg.appDir) {
              setState(null);
              setActivities([]);
              setErrors([]);
            }
            break;
          case 'apps':
            setApps(msg.apps || []);
            setWorkspaceRoot(msg.workspaceRoot || null);
            setAppsLoading(false);
            break;
          case 'error':
            setErrors(msg.errors || []);
            break;
          case 'activity':
            setActivities(prev => [...prev, ...(msg.events || [])].slice(-100));
            break;
          case 'activity-history':
            setActivities(prev => {
              if (prev.length === 0) return msg.events || [];
              return prev;
            });
            break;
          case 'vite-logs':
            setViteLogs(msg.lines || []);
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, cap at 30s
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current++;
      setReconnectAttempt(attemptRef.current);
      setReconnectDelay(delay);
      reconnectRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const restartVite = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'restart-vite' }));
    }
  }, []);

  const requestViteLogs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'request-vite-logs' }));
    }
  }, []);

  const selectApp = useCallback((path: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'select-app', path }));
    }
  }, []);

  const backToApps = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'back-to-apps' }));
    }
  }, []);

  const writeContext = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'write-context', content }));
    }
  }, []);

  const refreshApps = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setAppsLoading(true);
      wsRef.current.send(JSON.stringify({ type: 'list-apps' }));
    }
  }, []);

  return {
    state,
    viteStatus,
    viteError,
    errors,
    activities,
    connected,
    waiting,
    reconnectAttempt,
    reconnectDelay,
    restartVite,
    viteLogs,
    requestViteLogs,
    appDir,
    apps,
    workspaceRoot,
    appsLoading,
    selectApp,
    backToApps,
    refreshApps,
    appChangeKey,
    writeContext,
  };
}
