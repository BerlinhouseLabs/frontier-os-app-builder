import { useState, useEffect } from 'react';
import { useServices } from '../lib/frontier-services';
import type { WalletBalanceFormatted } from '../lib/frontier-services';

interface UseBalanceResult {
  balance: WalletBalanceFormatted | null;
  loading: boolean;
  error: string | null;
}

export function useBalance(): UseBalanceResult {
  const services = useServices();
  const [balance, setBalance] = useState<WalletBalanceFormatted | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await services.wallet.getBalanceFormatted();
        setBalance(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balance');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [services]);

  return { balance, loading, error };
}
