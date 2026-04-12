import { useEffect } from 'react';
import type { Agent, WalletBalanceFormatted } from '../lib/frontier-services';

interface PaymentModalProps {
  agent: Agent;
  balance: WalletBalanceFormatted | null;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const PaymentModal = ({
  agent,
  balance,
  isLoading,
  error,
  txHash,
  onConfirm,
  onClose,
}: PaymentModalProps) => {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLoading, onClose]);

  const price = parseFloat(agent.pricePerCall);
  const totalBalance = balance ? parseFloat(balance.total) : 0;
  const hasSufficientBalance = totalBalance >= price;

  if (txHash) {
    // Success state
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
          {/* Success icon */}
          <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
            <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">Payment Sent</h2>
            <p className="text-xs text-muted-foreground mt-1">
              You paid <span className="text-foreground font-medium">{agent.pricePerCall} FND</span>{' '}
              to use <span className="text-foreground font-medium">{agent.name}</span>
            </p>
          </div>

          {/* Tx hash */}
          <div className="w-full bg-muted-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Transaction</p>
            <p className="text-xs text-foreground font-mono break-all">
              {txHash.slice(0, 10)}…{txHash.slice(-8)}
            </p>
          </div>

          {/* Endpoint */}
          <div className="w-full bg-muted-background rounded-lg p-3 text-left">
            <p className="text-xs text-muted-foreground mb-1">Agent endpoint (x402)</p>
            <p className="text-xs text-primary font-mono break-all">{agent.endpoint}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Use this endpoint with your <code className="text-foreground">X-PAYMENT</code> header to invoke the agent.
          </p>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Confirm Payment</h2>
          {!isLoading && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Agent info */}
        <div className="bg-muted-background rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Agent</span>
            <span className="text-xs font-semibold text-foreground">{agent.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Price per call</span>
            <span className="text-sm font-semibold text-foreground">{agent.pricePerCall} FND</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Your balance</span>
            <span className={`text-xs font-medium ${hasSufficientBalance ? 'text-foreground' : 'text-danger'}`}>
              {balance ? `${balance.total} FND` : '—'}
            </span>
          </div>
        </div>

        {/* Payment type badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          x402 protocol — pay-per-call via Frontier Dollars
        </div>

        {/* Error */}
        {error && (
          <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
            <p className="text-xs text-alert">{error}</p>
          </div>
        )}

        {/* Insufficient balance warning */}
        {!hasSufficientBalance && !error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
            <p className="text-xs text-danger">
              Insufficient balance. You need {agent.pricePerCall} FND to invoke this agent.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted-background transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !hasSufficientBalance}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="spinner w-4 h-4 border-white/30 border-t-white" style={{ borderWidth: 2 }} />
                Sending…
              </>
            ) : (
              `Pay ${agent.pricePerCall} FND`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
