import { Activity, Binary, Gauge } from 'lucide-react';

import { MethodPicker } from './MethodPicker';
import type { MethodConfig, RootMethod } from '../types/roots';

interface MethodRailProps {
  activeConfig: MethodConfig;
  activeMethod: RootMethod;
  methods: MethodConfig[];
  onSelect: (method: RootMethod) => void;
}

export function MethodRail({ activeConfig, activeMethod, methods, onSelect }: MethodRailProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Binary aria-hidden="true" className="size-4 text-sky-300" />
        Method
      </div>
      <MethodPicker activeMethod={activeMethod} methods={methods} onSelect={onSelect} />
      <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          <Activity aria-hidden="true" className="size-4 text-emerald-300" />
          Active model
        </div>
        <p className="text-base font-semibold text-white">{activeConfig.shortLabel}</p>
        <p className="text-sm leading-6 text-slate-300">{activeConfig.summary}</p>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
          <Gauge aria-hidden="true" className="size-4 text-sky-300" />
          {activeConfig.group}
        </div>
      </div>
    </section>
  );
}
