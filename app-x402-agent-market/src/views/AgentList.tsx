import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { AgentCard } from '../components/AgentCard';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import type { AgentCategory } from '../lib/frontier-services';
import { AGENT_CATEGORIES } from '../lib/frontier-services';

export const AgentList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AgentCategory | 'all'>('all');
  const { agents, loading, error } = useAgents(category, query);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Agent Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {loading ? 'Loading…' : `${agents.length} agent${agents.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Search */}
      <SearchBar value={query} onChange={setQuery} />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('all')}
          className={[
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            category === 'all'
              ? 'bg-primary text-white border-primary'
              : 'border-border text-muted-foreground hover:border-outline hover:text-foreground',
          ].join(' ')}
        >
          All
        </button>
        {AGENT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              category === cat.value
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted-foreground hover:border-outline hover:text-foreground',
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {error && (
        <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
          <p className="text-xs text-alert">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          title="No agents found"
          description={query ? `No agents match "${query}"` : 'No agents in this category yet.'}
          action={{ label: 'List your agent', onClick: () => navigate('/register') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
};
