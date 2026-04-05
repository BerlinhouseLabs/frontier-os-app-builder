import { describe, it, expect, vi } from 'vitest';
import { ActivityTracker } from '../activity.js';
import type { ProjectState } from '../../shared/types.js';

function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    name: 'Test App',
    description: '',
    devPort: 5173,
    modules: [],
    permissions: [],
    milestone: 'v1',
    sdkPhase: null,
    phases: [],
    currentPhase: 1,
    currentPlan: 0,
    status: 'active',
    nextAction: '',
    progressPercent: 0,
    coreValue: '',
    planCounts: {},
    phaseDetails: {},
    phaseCount: 0,
    completedPhases: 0,
    ...overrides,
  };
}

describe('ActivityTracker', () => {
  it('push() adds an event with timestamp', () => {
    const tracker = new ActivityTracker();
    tracker.push({ type: 'status_changed', message: 'Test' });
    const events = tracker.getRecent(10);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('status_changed');
    expect(events[0].message).toBe('Test');
    expect(typeof events[0].timestamp).toBe('number');
  });

  it('getRecent() returns last N events', () => {
    const tracker = new ActivityTracker();
    for (let i = 0; i < 10; i++) {
      tracker.push({ type: 'file_created', message: `file-${i}` });
    }
    const recent = tracker.getRecent(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].message).toBe('file-7');
    expect(recent[2].message).toBe('file-9');
  });

  it('enforces circular buffer at 100 events', () => {
    const tracker = new ActivityTracker();
    for (let i = 0; i < 105; i++) {
      tracker.push({ type: 'file_modified', message: `event-${i}` });
    }
    const all = tracker.getRecent(200);
    expect(all).toHaveLength(100);
    expect(all[0].message).toBe('event-5');
    expect(all[99].message).toBe('event-104');
  });

  it('onEvent() listener receives pushed events', () => {
    const tracker = new ActivityTracker();
    const listener = vi.fn();
    tracker.onEvent(listener);
    tracker.push({ type: 'git_commit', message: 'initial commit' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([expect.objectContaining({ type: 'git_commit', message: 'initial commit' })]);
  });

  it('onEvent() returns working unsubscribe function', () => {
    const tracker = new ActivityTracker();
    const listener = vi.fn();
    const unsub = tracker.onEvent(listener);
    tracker.push({ type: 'file_created', message: 'a' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    tracker.push({ type: 'file_created', message: 'b' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('multiple listeners all receive events', () => {
    const tracker = new ActivityTracker();
    const l1 = vi.fn();
    const l2 = vi.fn();
    tracker.onEvent(l1);
    tracker.onEvent(l2);
    tracker.push({ type: 'vite_event', message: 'ready' });
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);
  });

  describe('diffStates', () => {
    it('emits "Project initialized" when prev is null', () => {
      const tracker = new ActivityTracker();
      const listener = vi.fn();
      tracker.onEvent(listener);
      tracker.diffStates(null, makeState({ name: 'My App' }));
      expect(listener).toHaveBeenCalledWith([expect.objectContaining({
        type: 'status_changed',
        message: 'Project initialized: My App',
      })]);
    });

    it('emits nothing when next is null', () => {
      const tracker = new ActivityTracker();
      const listener = vi.fn();
      tracker.onEvent(listener);
      tracker.diffStates(makeState(), null);
      expect(listener).not.toHaveBeenCalled();
    });

    it('emits status_changed on status change', () => {
      const tracker = new ActivityTracker();
      const listener = vi.fn();
      tracker.onEvent(listener);
      tracker.diffStates(
        makeState({ status: 'planning' }),
        makeState({ status: 'executing' }),
      );
      expect(listener).toHaveBeenCalledWith([expect.objectContaining({
        type: 'status_changed',
        message: expect.stringContaining('Planning'),
      })]);
    });

    it('emits phase_changed on phase change', () => {
      const tracker = new ActivityTracker();
      const listener = vi.fn();
      tracker.onEvent(listener);
      tracker.diffStates(
        makeState({ currentPhase: 1, phases: [{ number: 1, name: 'Scaffold', status: 'complete' }, { number: 2, name: 'Features', status: 'active' }] }),
        makeState({ currentPhase: 2, phases: [{ number: 1, name: 'Scaffold', status: 'complete' }, { number: 2, name: 'Features', status: 'active' }] }),
      );
      expect(listener).toHaveBeenCalledWith([expect.objectContaining({
        type: 'phase_changed',
        message: 'Phase 2: Features',
      })]);
    });

    it('emits phase completion event', () => {
      const tracker = new ActivityTracker();
      const listener = vi.fn();
      tracker.onEvent(listener);
      tracker.diffStates(
        makeState({ completedPhases: 0, phases: [{ number: 1, name: 'Scaffold', status: 'active' }] }),
        makeState({ completedPhases: 1, phases: [{ number: 1, name: 'Scaffold', status: 'complete' }] }),
      );
      expect(listener).toHaveBeenCalledWith([expect.objectContaining({
        type: 'phase_changed',
        message: 'Phase 1 complete: Scaffold',
      })]);
    });

    it('emits nothing when states are identical', () => {
      const tracker = new ActivityTracker();
      const listener = vi.fn();
      tracker.onEvent(listener);
      const state = makeState();
      tracker.diffStates(state, { ...state });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
