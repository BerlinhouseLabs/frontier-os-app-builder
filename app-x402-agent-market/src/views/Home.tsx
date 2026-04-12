import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents';
import { useBalance } from '../hooks/useBalance';
import { AgentCard } from '../components/AgentCard';
import type { AgentCategory } from '../lib/frontier-services';

const CATEGORIES: { value: AgentCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '🌐' },
  { value: 'ai-assistant', label: 'AI Assistant', emoji: '🤖' },
  { value: 'code-assistance', label: 'Code', emoji: '💻' },
  { value: 'data-analysis', label: 'Data', emoji: '📊' },
  { value: 'content-generation', label: 'Content', emoji: '✍️' },
  { value: 'image-generation', label: 'Images', emoji: '🎨' },
  { value: 'research', label: 'Research', emoji: '🔬' },
];

export const Home = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<AgentCategory | 'all'>('all');
  const { agents, loading } = useAgents(activeCategory);
  const { balance } = useBalance();

  const featuredAgents = agents.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          x402 Protocol · Pay per call · Powered by FND
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground max-w-md">
          The AI Agent Marketplace for Frontier OS
        </h1>

        <p className="text-sm text-muted-foreground max-w-sm">
          Discover, pay, and invoke AI agent services using the x402 HTTP payment protocol.
          Every call costs FND — no subscriptions, no API keys.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/market')}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Browse Agents
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 border border-border text-sm font-medium text-foreground rounded-xl hover:bg-muted-background transition-colors"
          >
            List Your Agent
          </button>
        </div>

        {/* Balance pill */}
        {balance && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success" />
            Wallet: <span className="text-foreground font-medium">{balance.total} FND</span>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                activeCategory === cat.value
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-card text-muted-foreground border-border hover:border-outline hover:text-foreground',
              ].join(' ')}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured agents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            {activeCategory === 'all' ? 'Featured Agents' : `${CATEGORIES.find((c) => c.value === activeCategory)?.label} Agents`}
          </h2>
          <button
            onClick={() => navigate('/market')}
            className="text-xs text-primary hover:underline"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Agents', value: agents.length.toString() },
          { label: 'Total Calls', value: agents.reduce((s, a) => s + a.callCount, 0).toLocaleString() },
          { label: 'Avg Price', value: agents.length ? `${(agents.reduce((s, a) => s + parseFloat(a.pricePerCall), 0) / agents.length).toFixed(3)} FND` : '—' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Protocol info */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">How x402 Works</h3>
        <ol className="flex flex-col gap-1.5">
          {[
            'Your AI client requests a resource from an agent endpoint',
            'The agent responds with HTTP 402 and a payment request',
            'This app sends the FND payment on-chain via Frontier Wallet',
            'The agent verifies payment and grants access',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
