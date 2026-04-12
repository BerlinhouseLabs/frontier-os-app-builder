import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import type { Agent } from '../lib/frontier-services';
import { CategoryBadge } from '../components/CategoryBadge';
import { PriceTag } from '../components/PriceTag';
import { PaymentModal } from '../components/PaymentModal';
import { useBalance } from '../hooks/useBalance';
import { useAgentPayment } from '../hooks/useAgentPayment';

export const AgentDetail = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const services = useServices();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const { balance } = useBalance();
  const { isLoading, error, txHash, pay, reset } = useAgentPayment();

  useEffect(() => {
    if (!agentId) return;
    services.agents.getAgent(agentId).then((a) => {
      setAgent(a);
      setLoading(false);
    });
  }, [agentId, services]);

  const handlePay = async () => {
    if (!agent) return;
    await pay(agent, balance);
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowPayment(false);
      reset();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-muted-foreground">Loading agent…</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Agent not found.</p>
          <button
            onClick={() => navigate('/market')}
            className="text-primary text-sm hover:underline"
          >
            ← Back to Market
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={agent.category} size="md" />
              {agent.isActive ? (
                <span className="text-xs text-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Inactive</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">by {agent.ownerName}</p>
          </div>
          <div className="text-right">
            <PriceTag price={agent.pricePerCall} size="lg" />
            <p className="text-xs text-muted-foreground mt-0.5">
              {agent.callCount.toLocaleString()} total calls
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            About
          </h2>
          <p className="text-sm text-foreground leading-relaxed">{agent.longDescription}</p>
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {agent.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted-background border border-border rounded-md text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Technical details */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Technical Details
          </h2>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Endpoint (x402)</p>
            <div className="flex items-center gap-2 bg-muted-background rounded-lg px-3 py-2">
              <code className="text-xs text-primary flex-1 break-all">{agent.endpoint}</code>
              <button
                onClick={() => navigator.clipboard?.writeText(agent.endpoint)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
                title="Copy endpoint"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Payment Address</p>
            <div className="bg-muted-background rounded-lg px-3 py-2">
              <code className="text-xs text-foreground font-mono break-all">{agent.paymentAddress}</code>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Listed {new Date(agent.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* x402 usage guide */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-foreground">How to Use This Agent</h2>
          <ol className="flex flex-col gap-1.5">
            {[
              'Click "Pay & Invoke" to send FND payment via Frontier Wallet',
              'Receive the transaction hash as your x402 payment proof',
              `Make a request to ${agent.endpoint} with X-PAYMENT header`,
              'The agent verifies your payment and returns the result',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold text-xs">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 pb-4">
          <div className="bg-background/95 backdrop-blur-sm pt-3">
            <button
              onClick={() => setShowPayment(true)}
              disabled={!agent.isActive}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {agent.isActive
                ? `Pay ${agent.pricePerCall} FND & Invoke Agent`
                : 'Agent Inactive'}
            </button>
            {balance && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Balance: <span className="text-foreground">{balance.total} FND</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          agent={agent}
          balance={balance}
          isLoading={isLoading}
          error={error}
          txHash={txHash}
          onConfirm={handlePay}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};
