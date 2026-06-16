import { useState, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type { Agent, WalletBalanceFormatted } from '../lib/frontier-services';

interface UseAgentPaymentResult {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  pay: (agent: Agent, balance: WalletBalanceFormatted | null) => Promise<void>;
  reset: () => void;
}

export function useAgentPayment(): UseAgentPaymentResult {
  const services = useServices();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const pay = useCallback(
    async (agent: Agent, balance: WalletBalanceFormatted | null) => {
      setIsLoading(true);
      setError(null);

      try {
        const price = parseFloat(agent.pricePerCall);
        const total = balance ? parseFloat(balance.total) : 0;

        if (total < price) {
          throw new Error(
            `Insufficient balance. You have ${balance?.total ?? '0'} FND but need ${agent.pricePerCall} FND.`,
          );
        }

        const receipt = await services.wallet.transferOverallFrontierDollar(
          agent.paymentAddress,
          agent.pricePerCall,
        );

        if (!receipt.success) {
          throw new Error('Transaction failed. Please try again.');
        }

        // Record payment in storage
        await services.agents.recordPayment({
          agentId: agent.id,
          agentName: agent.name,
          amount: agent.pricePerCall,
          transactionHash: receipt.transactionHash,
          timestamp: new Date().toISOString(),
          status: 'success',
        });

        setTxHash(receipt.transactionHash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [services],
  );

  const reset = useCallback(() => {
    setError(null);
    setTxHash(null);
    setIsLoading(false);
  }, []);

  return { isLoading, error, txHash, pay, reset };
}
