import { useState, useEffect, useRef, useCallback } from 'react';

// Types duplicated from shared/types.ts for client-side (no shared module resolution in Vite)
export interface PhaseInfo {
  number: number;
  name: string;
  status: string;
}

export interface PlanSummary {
  id: string;
  objective: string;
  taskCount: number;
  status: 'pending' | 'complete';
}

export interface PhaseDetail {
  decisions: string[];
  plans: PlanSummary[];
  summaries: string[];
  verification: string | null;
}

export interface ParseError {
  file: string;
  message: string;
}

export interface ProjectState {
  name: string;
  description: string;
  devPort: number;
  modules: string[];
  permissions: string[];
  milestone: string;
  sdkPhase: number | null | string;
  phases: PhaseInfo[];
  currentPhase: number;
  currentPlan: number | string;
  status: string;
  nextAction: string;
  progressPercent: number;
  coreValue: string;
  planCounts: Record<number, { complete: number; total: number }>;
  phaseDetails: Record<number, PhaseDetail>;
  phaseCount: number;
  completedPhases: number;
}

export interface ActivityEvent {
  timestamp: number;
  type: 'file_created' | 'file_modified' | 'phase_changed' | 'status_changed' | 'git_commit' | 'vite_event';
  message: string;
  detail?: string;
}

export type ViteStatus = 'running' | 'starting' | 'stopped' | 'error';

export interface StudioState {
  state: ProjectState | null;
  viteStatus: ViteStatus;
  viteError: string | null;
  errors: ParseError[];
  activities: ActivityEvent[];
  connected: boolean;
  waiting: boolean;
  restartVite: () => void;
}

export function useStudio(): StudioState {
  const [state, setState] = useState<ProjectState | null>(null);
  const [viteStatus, setViteStatus] = useState<ViteStatus>('stopped');
  const [viteError, setViteError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      attemptRef.current = 0; // Reset backoff on successful connect
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

  return { state, viteStatus, viteError, errors, activities, connected, waiting, restartVite };
}
