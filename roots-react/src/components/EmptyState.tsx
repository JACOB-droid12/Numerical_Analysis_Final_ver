export function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-700 bg-slate-950/70 px-4 py-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        No result yet
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Pick a method, enter the inputs, and run the calculation to see the answer, diagnostics,
        and iteration evidence here.
      </p>
    </section>
  );
}
