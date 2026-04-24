import type { ReactNode } from 'react';

interface WorkbenchShellProps {
  header: ReactNode;
  methodRail: ReactNode;
  inputComposer: ReactNode;
  answerRail: ReactNode;
}

export function WorkbenchShell({
  header,
  methodRail,
  inputComposer,
  answerRail,
}: WorkbenchShellProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(16,185,129,0.1),transparent_30%),linear-gradient(180deg,#070b12_0%,#0b1120_58%,#070b12_100%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        {header}
        <section className="grid min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_minmax(360px,420px)]">
          <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">{methodRail}</aside>
          <section className="min-w-0">{inputComposer}</section>
          <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">{answerRail}</aside>
        </section>
      </div>
    </main>
  );
}
