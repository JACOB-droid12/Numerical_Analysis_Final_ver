import { ConvergenceGraph } from './ConvergenceGraph';
import { IterationTable } from './IterationTable';
import { SolutionSteps } from './SolutionSteps';
import type { MethodConfig, RootRunResult } from '../types/roots';

interface EvidencePanelProps {
  config: MethodConfig;
  contentId: string;
  expanded: boolean;
  run: RootRunResult | null;
}

export function EvidencePanel({ config, contentId, expanded, run }: EvidencePanelProps) {
  if (!run || !expanded) {
    return null;
  }

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

      <div id={contentId} role="region" aria-label="Full work details" className="evidence-grid">
        <ConvergenceGraph run={run} />
        <SolutionSteps run={run} />
        <IterationTable config={config} run={run} />
      </div>
    </section>
  );
}
