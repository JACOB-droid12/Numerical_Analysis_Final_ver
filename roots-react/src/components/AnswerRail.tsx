import { CompareMethodsCallout } from './CompareMethodsCallout';
import { ConfidenceSummary } from './ConfidenceSummary';
import { EmptyState } from './EmptyState';
import { EvidencePanel } from './EvidencePanel';
import { EvidencePreview } from './EvidencePreview';
import { AnswerPanel } from './AnswerPanel';
import type { DisplayedRunState, MethodConfig } from '../types/roots';

interface AnswerRailProps {
  config: MethodConfig;
  displayRun: DisplayedRunState;
  evidenceExpanded: boolean;
  fullWorkRegionId: string;
  onToggleEvidence: () => void;
}

export function AnswerRail({
  config,
  displayRun,
  evidenceExpanded,
  fullWorkRegionId,
  onToggleEvidence,
}: AnswerRailProps) {
  const run = displayRun.run;

  if (!run) {
    return (
      <section
        aria-label="Answer"
        className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur"
      >
        <EmptyState />
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Answer and evidence">
      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-xl shadow-black/20 backdrop-blur">
        <AnswerPanel
          run={run}
          freshness={displayRun.freshness}
          staleReason={displayRun.staleReason}
        />
      </div>
      <ConfidenceSummary
        run={run}
        freshness={displayRun.freshness}
        staleReason={displayRun.staleReason}
      />
      <EvidencePreview
        fullWorkRegionId={fullWorkRegionId}
        expanded={evidenceExpanded}
        freshness={displayRun.freshness}
        run={run}
        onToggle={onToggleEvidence}
      />
      {!evidenceExpanded ? <div id={fullWorkRegionId} hidden /> : null}
      <CompareMethodsCallout
        visible={displayRun.hasCompareEntry}
        freshness={displayRun.freshness}
      />
      <EvidencePanel
        config={config}
        contentId={fullWorkRegionId}
        expanded={evidenceExpanded}
        run={run}
      />
    </section>
  );
}
