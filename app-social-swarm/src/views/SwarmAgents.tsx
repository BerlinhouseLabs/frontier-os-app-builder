import { useState, useEffect } from 'react';
import { useServices } from '../lib/frontier-services';
import type { SwarmAgent, SwarmPayment } from '../lib/frontier-services';
import { SWARM_AGENT_ROLES } from '../lib/frontier-services';

export const SwarmAgents = () => {
  const services = useServices();
  const [agents, setAgents] = useState<SwarmAgent[]>([]);
  const [payments, setPayments] = useState<SwarmPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, p] = await Promise.all([
          services.swarm.listSwarmAgents(),
          services.swarm.getPaymentHistory(),
        ]);
        setAgents(a);
        setPayments(p);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [services]);

  const totalSpent = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Swarm Agents</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          5 specialised AI agents that collaborate to create your content
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Agents', value: agents.filter((a) => a.isActive).length.toString() },
          { label: 'Total Runs', value: agents.reduce((s, a) => s + a.runsCompleted, 0).toLocaleString() },
          { label: 'FND Paid Out', value: `${totalSpent.toFixed(2)} FND` },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">The Swarm</h2>
        {agents.map((agent) => {
          const roleInfo = SWARM_AGENT_ROLES.find((r) => r.value === agent.role);
          return (
            <div key={agent.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                    {roleInfo?.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                      <span
                        className={[
                          'px-1.5 py-0.5 rounded-full text-xs font-medium',
                          agent.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-muted-background text-muted-foreground',
                        ].join(' ')}
                      >
                        {agent.isActive ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-primary mt-0.5">{roleInfo?.label}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{agent.pricePerRun} FND</p>
                  <p className="text-xs text-muted-foreground">per run</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <span className="font-mono text-xs truncate max-w-xs">
                  {agent.endpoint}
                </span>
                <span>{agent.runsCompleted.toLocaleString()} runs</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Payment History</h2>
          <div className="flex flex-col gap-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{payment.campaignTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.timestamp).toLocaleString()}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {payment.transactionHash.slice(0, 20)}…
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-sm font-semibold text-foreground">{payment.amount} FND</span>
                  <span
                    className={[
                      'text-xs font-medium',
                      payment.status === 'success' ? 'text-success' : 'text-danger',
                    ].join(' ')}
                  >
                    {payment.status === 'success' ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
