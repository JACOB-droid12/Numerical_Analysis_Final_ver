export function EmptyState() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Result rail
        </h2>
        <p className="text-sm text-slate-500">Reserved for the first successful run.</p>
      </div>

      <div className="mt-4 space-y-3">
        <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Result will appear here.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Run the method to turn this side into the answer anchor.
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confidence
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Stop reason, error or residual, and basis summary will appear beside the answer.
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Evidence preview
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            A graph preview and one diagnostic summary will show here before the full work expands.
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Compare methods
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            This area is reserved for the next-phase comparison action after the first successful
            run.
          </p>
        </section>
      </div>
    </section>
  );
}
