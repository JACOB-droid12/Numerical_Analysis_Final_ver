import { useState } from 'react';
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
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
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

      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
        {activeTab === 'diagnostics' ? <DiagnosticsPanel run={run} /> : null}
        {activeTab === 'graph' ? <ConvergenceGraph run={run} /> : null}
        {activeTab === 'steps' ? <SolutionSteps run={run} /> : null}
        {activeTab === 'table' ? <IterationTable config={config} run={run} /> : null}
      </div>
    </div>
  );
}
