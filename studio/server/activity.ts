import type { ActivityEvent, ProjectState } from '../shared/types.js';

export class ActivityTracker {
  private events: ActivityEvent[] = [];
  private listeners: Array<(events: ActivityEvent[]) => void> = [];
  private readonly MAX_EVENTS = 100;

  push(event: Omit<ActivityEvent, 'timestamp'>): void {
    const full: ActivityEvent = { ...event, timestamp: Date.now() };
    this.events.push(full);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }
    for (const listener of this.listeners) {
      listener([full]);
    }
  }

  getRecent(n: number = 20): ActivityEvent[] {
    return this.events.slice(-n);
  }

  /** Drop all buffered events. Called when the active app is swapped. */
  clear(): void {
    this.events = [];
  }

  onEvent(callback: (events: ActivityEvent[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Diff two states and emit activity events
  diffStates(prev: ProjectState | null, next: ProjectState | null): void {
    if (!next) return;

    if (!prev) {
      this.push({ type: 'status_changed', message: `Project initialized: ${next.name}` });
      return;
    }

    if (prev.status !== next.status) {
      this.push({
        type: 'status_changed',
        message: `Status: ${formatStatus(prev.status)} → ${formatStatus(next.status)}`,
      });
    }

    if (prev.currentPhase !== next.currentPhase) {
      const phase = next.phases.find(p => p.number === next.currentPhase);
      this.push({
        type: 'phase_changed',
        message: `Phase ${next.currentPhase}: ${phase?.name || 'Unknown'}`,
      });
    }

    if (prev.completedPhases < next.completedPhases) {
      const justCompleted = next.phases.find(
        p => p.status === 'complete' && prev.phases.find(pp => pp.number === p.number)?.status !== 'complete'
      );
      if (justCompleted) {
        this.push({
          type: 'phase_changed',
          message: `Phase ${justCompleted.number} complete: ${justCompleted.name}`,
        });
      }
    }
  }
}

function formatStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
