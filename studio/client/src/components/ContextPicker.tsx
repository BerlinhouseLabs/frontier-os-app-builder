import { useState, useMemo, useCallback } from 'react';
import { CONTEXT_CATEGORIES, type ContextSource } from '../data/context-sources';

interface ContextPickerProps {
  onStart: (description: string, contextPrompt: string) => void;
  onBack: () => void;
}

export function ContextPicker({ onStart, onBack }: ContextPickerProps) {
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  // Editable overrides: source id → edited text. Missing = use default.
  const [edits, setEdits] = useState<Record<string, string>>({});
  // Which source is open in the editor panel
  const [editingSource, setEditingSource] = useState<ContextSource | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (catId: string) => {
    const cat = CONTEXT_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    const allSelected = cat.sources.every((s) => selected.has(s.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of cat.sources) {
        if (allSelected) next.delete(s.id);
        else next.add(s.id);
      }
      return next;
    });
  };

  const getSourceText = useCallback(
    (source: ContextSource) => edits[source.id] ?? source.context,
    [edits],
  );

  const contextPrompt = useMemo(() => {
    const blocks: string[] = [];
    for (const cat of CONTEXT_CATEGORIES) {
      for (const source of cat.sources) {
        if (selected.has(source.id)) {
          blocks.push(`## ${source.label}\n${getSourceText(source)}`);
        }
      }
    }
    return blocks.length > 0 ? blocks.join('\n\n') : '';
  }, [selected, getSourceText]);

  const canStart = description.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    onStart(description.trim(), contextPrompt);
  };

  const openEditor = (source: ContextSource) => {
    // Auto-select when opening editor
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(source.id);
      return next;
    });
    setEditingSource(source);
  };

  const isEdited = (id: string) => id in edits;

  return (
    <div className="h-screen flex bg-gray-950 text-gray-200">
      {/* Left panel: description + sources */}
      <div className={`flex flex-col ${editingSource ? 'w-1/2' : 'w-full'} transition-all`}>
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Back to apps"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Create New App</h1>
              <p className="text-xs text-gray-500">Describe your app and select relevant context</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Description input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">What do you want to build?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your Frontier OS app in plain language... e.g. 'A room booking app where citizens can reserve meeting rooms and see availability'"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 px-4 py-3 h-28 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey && canStart) handleStart();
                }}
              />
            </div>

            {/* Context sources */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Context Sources</label>
                <span className="text-xs text-gray-500">{selected.size} selected</span>
              </div>
              <p className="text-xs text-gray-500">
                Select context to include. Click a source name to view and edit the exact text that will be sent.
              </p>

              <div className={`grid ${editingSource ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 mt-3`}>
                {CONTEXT_CATEGORIES.map((cat) => {
                  const catSelected = cat.sources.filter((s) => selected.has(s.id)).length;
                  const allSelected = catSelected === cat.sources.length;
                  const isExpanded = expandedCat === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`rounded-xl border transition-colors ${
                        catSelected > 0
                          ? 'border-blue-500/40 bg-blue-500/5'
                          : 'border-gray-800 bg-gray-900/50'
                      }`}
                    >
                      {/* Category header */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            allSelected
                              ? 'bg-blue-500 border-blue-500'
                              : catSelected > 0
                              ? 'border-blue-500/50 bg-blue-500/20'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {allSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {catSelected > 0 && !allSelected && (
                            <div className="w-1.5 h-1.5 rounded-sm bg-blue-400" />
                          )}
                        </button>
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm font-medium text-gray-200 flex-1">{cat.label}</span>
                        {catSelected > 0 && (
                          <span className="text-[10px] text-blue-400 font-medium">
                            {catSelected}/{cat.sources.length}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Expanded sources */}
                      {isExpanded && (
                        <div className="border-t border-gray-800/60 px-3 py-2 space-y-1">
                          {cat.sources.map((source) => (
                            <SourceItem
                              key={source.id}
                              source={source}
                              checked={selected.has(source.id)}
                              edited={isEdited(source.id)}
                              active={editingSource?.id === source.id}
                              onToggle={() => toggle(source.id)}
                              onOpen={() => openEditor(source)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer / CTA */}
        <footer className="border-t border-gray-800 px-6 py-4 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {selected.size > 0 ? (
                <span>
                  {selected.size} context source{selected.size !== 1 ? 's' : ''} will be included
                </span>
              ) : (
                <span>No extra context selected — SDK reference is always included</span>
              )}
            </div>
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                canStart
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              Start Building
            </button>
          </div>
        </footer>
      </div>

      {/* Right panel: source text editor */}
      {editingSource && (
        <div className="w-1/2 flex flex-col border-l border-gray-800 bg-gray-900/30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{editingSource.label}</h2>
              <p className="text-[11px] text-gray-500">{editingSource.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isEdited(editingSource.id) && (
                <button
                  onClick={() => {
                    setEdits((prev) => {
                      const next = { ...prev };
                      delete next[editingSource.id];
                      return next;
                    });
                  }}
                  className="text-[11px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setEditingSource(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <textarea
            value={getSourceText(editingSource)}
            onChange={(e) =>
              setEdits((prev) => ({ ...prev, [editingSource.id]: e.target.value }))
            }
            className="flex-1 bg-transparent text-xs text-gray-300 font-mono leading-relaxed p-4 resize-none focus:outline-none"
            spellCheck={false}
          />
          <div className="border-t border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-600">
              {getSourceText(editingSource).length} chars
              {isEdited(editingSource.id) && ' (edited)'}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(editingSource.id)}
                onChange={() => toggle(editingSource.id)}
                className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[11px] text-gray-400">Include this source</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceItem({
  source,
  checked,
  edited,
  active,
  onToggle,
  onOpen,
}: {
  source: ContextSource;
  checked: boolean;
  edited: boolean;
  active: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={`flex items-start gap-2 py-1 rounded px-1 ${active ? 'bg-blue-500/10' : ''}`}>
      <button
        onClick={onToggle}
        className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
          checked ? 'bg-blue-500 border-blue-500' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <button onClick={onOpen} className="min-w-0 text-left group">
        <span className={`text-xs font-medium transition-colors ${active ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'}`}>
          {source.label}
          {edited && <span className="ml-1 text-amber-400/70 text-[10px]">(edited)</span>}
        </span>
        <p className="text-[11px] text-gray-500 leading-tight">{source.description}</p>
      </button>
    </div>
  );
}
