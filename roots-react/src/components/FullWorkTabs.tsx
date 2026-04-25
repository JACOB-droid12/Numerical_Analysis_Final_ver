import { useId, useRef, useState } from 'react';
import { BarChart3, ClipboardList, LineChart, Table2 } from 'lucide-react';

import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { IterationTable } from './IterationTable';
import { SolutionSteps } from './SolutionSteps';
import type { MethodConfig, RootRunResult } from '../types/roots';

type FullWorkTab = 'diagnostics' | 'graph' | 'steps' | 'table';

const tabs: Array<{
  id: FullWorkTab;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { id: 'diagnostics', label: 'Diagnostics', icon: ClipboardList },
  { id: 'graph', label: 'Graph', icon: LineChart },
  { id: 'steps', label: 'Steps', icon: BarChart3 },
  { id: 'table', label: 'Table', icon: Table2 },
];

interface FullWorkTabsProps {
  config: MethodConfig;
  run: RootRunResult;
}

export function FullWorkTabs({ config, run }: FullWorkTabsProps) {
  const [activeTab, setActiveTab] = useState<FullWorkTab>('diagnostics');
  const panelId = useId();
  const tabRefs = useRef<Record<FullWorkTab, HTMLButtonElement | null>>({
    diagnostics: null,
    graph: null,
    steps: null,
    table: null,
  });

  function activateTab(id: FullWorkTab) {
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);

    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        activateTab(tabs[prevIndex].id);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % tabs.length;
        activateTab(tabs[nextIndex].id);
        break;
      }
      case 'Home': {
        event.preventDefault();
        activateTab(tabs[0].id);
        break;
      }
      case 'End': {
        event.preventDefault();
        activateTab(tabs[tabs.length - 1].id);
        break;
      }
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1 sm:grid-cols-4"
        role="tablist"
        aria-label="Full work sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              type="button"
              role="tab"
              id={`${panelId}-tab-${tab.id}`}
              aria-controls={`${panelId}-panel`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activateTab(tab.id)}
              onKeyDown={handleKeyDown}
              className={[
                'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-950/30'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon aria-hidden="true" className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${panelId}-panel`}
        role="tabpanel"
        aria-labelledby={`${panelId}-tab-${activeTab}`}
        tabIndex={0}
        className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
      >
        {activeTab === 'diagnostics' ? <DiagnosticsPanel run={run} /> : null}
        {activeTab === 'graph' ? <ConvergenceGraph run={run} /> : null}
        {activeTab === 'steps' ? <SolutionSteps run={run} /> : null}
        {activeTab === 'table' ? <IterationTable config={config} run={run} /> : null}
      </div>
    </div>
  );
}
