import { ChevronDown, ChevronUp } from 'lucide-react';

import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { Button } from './ui/Button';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface EvidencePreviewProps {
  fullWorkRegionId: string;
  run: RootRunResult | null;
  freshness: RunFreshness;
  expanded: boolean;
  onToggle: () => void;
}

export function EvidencePreview({
  fullWorkRegionId,
  run,
  freshness,
  expanded,
  onToggle,
}: EvidencePreviewProps) {
  if (!run) {
    return null;
  }

  return (
    <section className="panel-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-kicker">
            Evidence preview
          </h2>
          <p className="mt-1 text-sm muted-copy">Quick proof the result is grounded.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={fullWorkRegionId}
        >
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
          {expanded ? 'Hide full work' : 'Show full work'}
        </Button>
      </div>

      {freshness === 'stale' ? (
        <p className="mt-4 rounded-[6px] border border-[rgba(244,173,50,0.38)] bg-[rgba(244,173,50,0.1)] px-4 py-3 text-sm text-[var(--amber)]">
          The preview below reflects the last successful run and may not match the current draft inputs.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ConvergenceGraph run={run} compact />
        <DiagnosticsPanel run={run} compact />
      </div>
    </section>
  );
}
