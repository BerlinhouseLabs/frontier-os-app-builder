import { useState, useMemo, useCallback } from 'react';
import { CONTEXT_CATEGORIES, type ContextSource } from '../data/context-sources';

interface ContextPickerProps {
  onStart: (description: string, contextPrompt: string) => void;
  onBack: () => void;
}

export function ContextPicker({ onStart, onBack }: ContextPickerProps) {
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editingSource, setEditingSource] = useState<ContextSource | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (editingSource?.id === id) setEditingSource(null);
      } else {
        next.add(id);
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
  const isEdited = (id: string) => id in edits;

  const handleStart = () => {
    if (!canStart) return;
    onStart(description.trim(), contextPrompt);
  };

  const openEditor = (source: ContextSource) => {
    setSelected((prev) => new Set(prev).add(source.id));
    setEditingSource(source);
  };

  const selectAll = () => {
    const allIds = CONTEXT_CATEGORIES.flatMap((c) => c.sources.map((s) => s.id));
    setSelected(new Set(allIds));
  };

  const selectNone = () => setSelected(new Set());

  return (
    <div className="h-screen flex bg-gray-950 text-gray-200">
      {/* Main panel */}
      <div className={`flex flex-col transition-all duration-200 ${editingSource ? 'w-[55%]' : 'w-full'}`}>
        {/* Header */}
        <header className="border-b border-gray-800 px-8 py-5 shrink-0">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-200 transition-colors -ml-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Frontier Studio
              </p>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">What do you want to build?</h1>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A room booking app where citizens can reserve meeting rooms and see real-time availability across all floors..."
              className="w-full mt-3 bg-transparent border-0 text-base text-gray-200 placeholder-gray-600 resize-none focus:outline-none leading-relaxed"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey && canStart) handleStart();
              }}
            />
          </div>
        </header>

        {/* Context grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium text-gray-400">Include context about Frontier Tower</h2>
                <p className="text-xs text-gray-600 mt-0.5">Click any source to preview and edit what gets sent</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <button onClick={selectAll} className="text-gray-500 hover:text-gray-300 transition-colors">Select all</button>
                <span className="text-gray-800">|</span>
                <button onClick={selectNone} className="text-gray-500 hover:text-gray-300 transition-colors">Clear</button>
              </div>
            </div>

            {CONTEXT_CATEGORIES.map((cat) => (
              <div key={cat.id} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{cat.label}</span>
                </div>
                <div className={`grid gap-2 ${editingSource ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {cat.sources.map((source) => {
                    const isSelected = selected.has(source.id);
                    const isActive = editingSource?.id === source.id;
                    const wasEdited = isEdited(source.id);

                    return (
                      <div
                        key={source.id}
                        className={`group relative rounded-lg border p-3 cursor-pointer transition-all duration-150 ${
                          isActive
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                            : isSelected
                            ? 'border-blue-500/40 bg-blue-500/5 hover:border-blue-500/60'
                            : 'border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/60'
                        }`}
                        onClick={() => {
                          if (isSelected && isActive) {
                            // Already viewing — deselect and close
                            toggle(source.id);
                          } else if (isSelected) {
                            // Selected but not viewing — open editor
                            setEditingSource(source);
                          } else {
                            // Not selected — select and open editor
                            openEditor(source);
                          }
                        }}
                      >
                        {/* Checkbox — larger hit target */}
                        <div
                          className="absolute top-2 right-2 p-1"
                          onClick={(e) => { e.stopPropagation(); toggle(source.id); }}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-700 group-hover:border-gray-500'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        <div className="pr-8">
                          <h3 className={`text-sm font-medium transition-colors ${isActive ? 'text-blue-300' : 'text-gray-200'}`}>
                            {source.label}
                            {wasEdited && (
                              <span className="ml-1.5 text-[10px] text-amber-400/80 font-normal">edited</span>
                            )}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{source.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 px-8 py-4 shrink-0 bg-gray-950">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {selected.size > 0
                ? `${selected.size} source${selected.size !== 1 ? 's' : ''} selected`
                : 'SDK reference is always included'}
            </span>
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`group flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                canStart
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              Start Building
              {canStart && (
                <kbd className="text-[10px] text-blue-200/60 bg-blue-500/30 px-1 py-0.5 rounded font-mono">
                  &#8984;&#9166;
                </kbd>
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* Editor panel */}
      {editingSource && (
        <div className="w-[45%] flex flex-col border-l border-gray-800 bg-gray-900/20">
          {/* Editor header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">{editingSource.label}</h2>
                {isEdited(editingSource.id) && (
                  <button
                    onClick={() => setEdits((prev) => { const n = { ...prev }; delete n[editingSource.id]; return n; })}
                    className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors"
                  >
                    reset
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{editingSource.description}</p>
            </div>
            <button
              onClick={() => setEditingSource(null)}
              className="text-gray-600 hover:text-gray-300 transition-colors p-1 ml-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Editor body */}
          <textarea
            value={getSourceText(editingSource)}
            onChange={(e) => setEdits((prev) => ({ ...prev, [editingSource.id]: e.target.value }))}
            className="flex-1 bg-transparent text-[13px] text-gray-300 font-mono leading-relaxed p-5 resize-none focus:outline-none selection:bg-blue-500/30"
            spellCheck={false}
          />

          {/* Editor footer */}
          <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-600 font-mono">
              {getSourceText(editingSource).length} chars
            </span>
            <button
              onClick={() => {
                const wasSelected = selected.has(editingSource.id);
                toggle(editingSource.id);
                if (wasSelected) setEditingSource(null);
              }}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                selected.has(editingSource.id)
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-red-500/20 hover:text-red-400'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {selected.has(editingSource.id) ? 'Remove' : 'Include'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
