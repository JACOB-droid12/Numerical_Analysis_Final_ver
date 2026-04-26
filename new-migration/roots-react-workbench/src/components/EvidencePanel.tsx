import { useState } from 'react';

import { ConvergenceGraph } from './ConvergenceGraph';
import { IterationTable } from './IterationTable';
import { SolutionSteps } from './SolutionSteps';
import { WorkflowPanel } from './WorkflowPanel';
import type { MethodConfig, PrecisionDisplayConfig, RootRunResult } from '../types/roots';

interface EvidencePanelProps {
  config: MethodConfig;
  contentId: string;
  expanded: boolean;
  precisionDisplay: PrecisionDisplayConfig;
  run: RootRunResult | null;
}

type EvidenceTab = 'graph' | 'steps' | 'workflow' | 'table';

function hasWorkflowContent(run: RootRunResult) {
  const helpers = run.helpers;
  return Boolean(
    helpers?.requiredIterations ||
      helpers?.bracketScan ||
      helpers?.derivative ||
      helpers?.newtonInitial ||
      helpers?.fixedPointBatch,
  );
}

export function EvidencePanel({ config, contentId, expanded, precisionDisplay, run }: EvidencePanelProps) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('steps');

  if (!run || !expanded) {
    return null;
  }

  const tabs: Array<{ id: EvidenceTab; label: string }> = [
    { id: 'graph', label: 'Graph' },
    { id: 'steps', label: 'Steps' },
    ...(hasWorkflowContent(run) ? [{ id: 'workflow' as const, label: 'Setup checks' }] : []),
    { id: 'table', label: 'Table' },
  ];
  const currentTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;

  return (
    <section className="evidence-panel">
      <header>
        <div>
          <h2 className="section-kicker">Evidence workspace</h2>
          <p className="mt-1 text-sm muted-copy">
            Diagnostics, graph, steps, and iteration table for {config.shortLabel}.
          </p>
        </div>
      </header>

      <div className="evidence-tabs" role="tablist" aria-label="Evidence views">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={currentTab === tab.id}
            aria-controls={`${contentId}-${tab.id}`}
            id={`${contentId}-${tab.id}-tab`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id={contentId} role="region" aria-label="Full work details" className="evidence-detail">
        {currentTab === 'graph' ? (
          <div
            id={`${contentId}-graph`}
            role="tabpanel"
            aria-labelledby={`${contentId}-graph-tab`}
            className="evidence-pane"
          >
            <ConvergenceGraph run={run} hero />
          </div>
        ) : null}
        {currentTab === 'steps' ? (
          <div
            id={`${contentId}-steps`}
            role="tabpanel"
            aria-labelledby={`${contentId}-steps-tab`}
            className="evidence-pane"
          >
            <SolutionSteps run={run} />
          </div>
        ) : null}
        {currentTab === 'workflow' ? (
          <div
            id={`${contentId}-workflow`}
            role="tabpanel"
            aria-labelledby={`${contentId}-workflow-tab`}
            className="evidence-pane"
          >
            <WorkflowPanel run={run} />
          </div>
        ) : null}
        {currentTab === 'table' ? (
          <div
            id={`${contentId}-table`}
            role="tabpanel"
            aria-labelledby={`${contentId}-table-tab`}
            className="evidence-pane"
          >
            <IterationTable config={config} precisionDisplay={precisionDisplay} run={run} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
