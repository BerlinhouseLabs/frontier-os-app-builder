import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAgentPayment } from '../../hooks/useAgentPayment';
import { FrontierServicesProvider } from '../../lib/frontier-services';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <FrontierServicesProvider>{children}</FrontierServicesProvider>
);

describe('useAgentPayment', () => {
  const mockAgent = {
    id: 'agent-001',
    name: 'Test Agent',
    description: 'Test',
    longDescription: 'Test',
    category: 'ai-assistant' as const,
    endpoint: 'https://test.example.com',
    pricePerCall: '0.05',
    paymentAddress: '0x1234567890123456789012345678901234567890',
    ownerAddress: '0x1234567890123456789012345678901234567890',
    ownerName: 'Tester',
    tags: [],
    callCount: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const sufficientBalance = {
    total: '10.00',
    fnd: '8.00',
    internalFnd: '2.00',
  };

  const insufficientBalance = {
    total: '0.01',
    fnd: '0.01',
    internalFnd: '0.00',
  };

  it('starts with clean state', () => {
    const { result } = renderHook(() => useAgentPayment(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
  });

  it('sets txHash on successful payment', async () => {
    const { result } = renderHook(() => useAgentPayment(), { wrapper });

    await act(async () => {
      await result.current.pay(mockAgent, sufficientBalance);
    });

    await waitFor(() => {
      expect(result.current.txHash).not.toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sets error when balance is insufficient', async () => {
    const { result } = renderHook(() => useAgentPayment(), { wrapper });

    await act(async () => {
      await result.current.pay(mockAgent, insufficientBalance);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error).toContain('Insufficient balance');
      expect(result.current.txHash).toBeNull();
    });
  });

  it('sets error when balance is null', async () => {
    const { result } = renderHook(() => useAgentPayment(), { wrapper });

    await act(async () => {
      await result.current.pay(mockAgent, null);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.txHash).toBeNull();
    });
  });

  it('reset clears state', async () => {
    const { result } = renderHook(() => useAgentPayment(), { wrapper });

    await act(async () => {
      await result.current.pay(mockAgent, sufficientBalance);
    });

    await waitFor(() => expect(result.current.txHash).not.toBeNull());

    act(() => {
      result.current.reset();
    });

    expect(result.current.txHash).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
