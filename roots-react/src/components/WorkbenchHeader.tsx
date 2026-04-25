import { Calculator, Cloud, Sparkles } from 'lucide-react';

import { AngleToggle } from './AngleToggle';
import type { AngleMode } from '../types/roots';

interface WorkbenchHeaderProps {
  angleMode: AngleMode;
  onToggleAngleMode: () => void;
}

export function WorkbenchHeader({ angleMode, onToggleAngleMode }: WorkbenchHeaderProps) {
  return (
    <header className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 shadow-2xl shadow-black/20 backdrop-blur sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-200">
            <Calculator aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              NET+ Roots Workbench
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              Solve roots with answer-first numerical evidence.
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 sm:w-[280px]">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Cloud aria-hidden="true" className="mb-1 size-4 text-emerald-300" />
              Vercel-ready pilot
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Sparkles aria-hidden="true" className="mb-1 size-4 text-sky-300" />
              Legacy engine adapter
            </div>
          </div>
          <AngleToggle angleMode={angleMode} onToggle={onToggleAngleMode} />
        </div>
      </div>
    </header>
  );
}
