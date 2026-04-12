import { useState, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type {
  Campaign,
  ContentPiece,
  SwarmStep,
  WalletBalanceFormatted,
} from '../lib/frontier-services';

// Total cost per swarm run (sum of all agent prices)
export const SWARM_RUN_COST = '0.23';
// Payment address: the swarm treasury collects fees
export const SWARM_TREASURY_ADDRESS = '0xfrontierswarm0000000000000000000000000001';

interface UseSwarmRunResult {
  steps: SwarmStep[];
  generatedContent: ContentPiece[];
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
  txHash: string | null;
  startRun: (campaign: Campaign, balance: WalletBalanceFormatted | null) => Promise<void>;
  reset: () => void;
}

export function useSwarmRun(): UseSwarmRunResult {
  const services = useServices();
  const [steps, setSteps] = useState<SwarmStep[]>([]);
  const [generatedContent, setGeneratedContent] = useState<ContentPiece[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const startRun = useCallback(
    async (campaign: Campaign, balance: WalletBalanceFormatted | null) => {
      setError(null);
      setSteps([]);
      setGeneratedContent([]);
      setIsComplete(false);
      setTxHash(null);

      // Balance check
      if (!balance) {
        setError('Could not load wallet balance. Please try again.');
        return;
      }
      if (parseFloat(balance.total) < parseFloat(SWARM_RUN_COST)) {
        setError(`Insufficient balance. You need ${SWARM_RUN_COST} FND but have ${balance.total} FND.`);
        return;
      }

      setIsRunning(true);

      try {
        // Pay for the swarm run
        const receipt = await services.wallet.transferOverallFrontierDollar(
          SWARM_TREASURY_ADDRESS,
          SWARM_RUN_COST,
        );

        if (!receipt.success) {
          throw new Error('Payment transaction failed');
        }

        setTxHash(receipt.transactionHash);

        // Record payment
        await services.swarm.recordPayment({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          amount: SWARM_RUN_COST,
          transactionHash: receipt.transactionHash,
          timestamp: new Date().toISOString(),
          status: 'success',
        });

        // Execute swarm
        const gen = services.swarm.runSwarm(campaign.id);
        const allSteps: SwarmStep[] = [];

        for await (const step of gen) {
          const s = step as SwarmStep;
          const existingIdx = allSteps.findIndex((st) => st.agentRole === s.agentRole);
          if (existingIdx >= 0) {
            allSteps[existingIdx] = s;
          } else {
            allSteps.push(s);
          }
          setSteps([...allSteps]);
        }

        // Collect generated content after the generator completes
        const finalContent = await services.swarm.listContent(campaign.id);
        setGeneratedContent(finalContent);
        setIsComplete(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Swarm run failed');
        // Record failed payment if we got past the payment step
        if (txHash) {
          await services.swarm.recordPayment({
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            amount: SWARM_RUN_COST,
            transactionHash: txHash,
            timestamp: new Date().toISOString(),
            status: 'failed',
          });
        }
      } finally {
        setIsRunning(false);
      }
    },
    [services, txHash],
  );

  const reset = useCallback(() => {
    setSteps([]);
    setGeneratedContent([]);
    setIsRunning(false);
    setIsComplete(false);
    setError(null);
    setTxHash(null);
  }, []);

  return { steps, generatedContent, isRunning, isComplete, error, txHash, startRun, reset };
}
