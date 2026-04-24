import { FullWorkTabs } from './FullWorkTabs';
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
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            Full work
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Diagnostics, graph, steps, and iteration table for {config.shortLabel}.
          </p>
        </div>
      </div>

      <div id={contentId} role="region" aria-label="Full work details" className="mt-4">
        <FullWorkTabs config={config} run={run} />
      </div>
    </section>
  );
}
