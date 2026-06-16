import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSwarmRun } from '../../hooks/useSwarmRun';
import { FrontierServicesProvider } from '../../lib/frontier-services';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <FrontierServicesProvider>{children}</FrontierServicesProvider>
);

const mockCampaign = {
  id: 'campaign-001',
  title: 'Test Campaign',
  brief: 'A brief for testing the swarm run hook',
  targetAudience: 'Web3 developers',
  platforms: ['twitter', 'linkedin'] as const,
  tone: 'Professional',
  status: 'completed' as const,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null,
  contentCount: 0,
  totalCost: '0.00',
};

const sufficientBalance = {
  total: '10.00',
  fnd: '8.00',
  internalFnd: '2.00',
};

const insufficientBalance = {
  total: '0.10',
  fnd: '0.10',
  internalFnd: '0.00',
};

describe('useSwarmRun', () => {
  it('starts with clean state', () => {
    const { result } = renderHook(() => useSwarmRun(), { wrapper });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
    expect(result.current.steps).toHaveLength(0);
    expect(result.current.generatedContent).toHaveLength(0);
  });

  it('sets error when balance is insufficient', async () => {
    const { result } = renderHook(() => useSwarmRun(), { wrapper });

    await act(async () => {
      await result.current.startRun(mockCampaign, insufficientBalance);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error).toContain('Insufficient balance');
      expect(result.current.isComplete).toBe(false);
    });
  });

  it('sets error when balance is null', async () => {
    const { result } = renderHook(() => useSwarmRun(), { wrapper });

    await act(async () => {
      await result.current.startRun(mockCampaign, null);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.isComplete).toBe(false);
    });
  });

  it('completes run with sufficient balance and sets txHash', async () => {
    const { result } = renderHook(() => useSwarmRun(), { wrapper });

    await act(async () => {
      await result.current.startRun(mockCampaign, sufficientBalance);
    });

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 10000 },
    );

    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.current.steps.length).toBeGreaterThan(0);
    expect(result.current.isRunning).toBe(false);
  }, 15000);

  it('reset clears all state', async () => {
    const { result } = renderHook(() => useSwarmRun(), { wrapper });

    // First trigger an error
    await act(async () => {
      await result.current.startRun(mockCampaign, null);
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      result.current.reset();
    });

    expect(result.current.steps).toHaveLength(0);
    expect(result.current.generatedContent).toHaveLength(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
  });
});
