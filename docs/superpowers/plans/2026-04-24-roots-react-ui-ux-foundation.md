# Roots React UI/UX Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Roots React pilot shell into a modern command workbench while preserving all current calculation behavior.

**Architecture:** Keep `useRootsWorkbench` as the single state/behavior owner and add presentational shell components around the existing method, answer, and evidence components. Convert full work into a tabbed evidence surface so diagnostics, graph, steps, and iteration table are reachable without turning the page into a long panel stack.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, lucide-react, existing GSAP dependency for restrained state motion.

---

## File Structure

Create:

- `roots-react/src/components/WorkbenchShell.tsx`  
  Page frame, responsive command-workbench grid, and region placement.
- `roots-react/src/components/WorkbenchHeader.tsx`  
  NET+ identity, concise product context, angle mode placement.
- `roots-react/src/components/MethodRail.tsx`  
  Method selection plus active method metadata.
- `roots-react/src/components/InputComposer.tsx`  
  Wraps `MethodForm` and `RunControls` in the center work area.
- `roots-react/src/components/AnswerRail.tsx`  
  Wraps answer, confidence, evidence preview, compare callout, and full work.
- `roots-react/src/components/FullWorkTabs.tsx`  
  Segmented/tabbed diagnostics, graph, steps, and iteration table.
- `roots-react/src/hooks/useRunRevealMotion.ts`  
  Small GSAP hook for answer/evidence reveal when run identity changes.

Modify:

- `roots-react/src/App.tsx`  
  Replace inline page layout with shell components. Keep `useRootsWorkbench` data flow unchanged.
- `roots-react/src/components/MethodPicker.tsx`  
  Make method buttons compact enough for rail/top segmented use.
- `roots-react/src/components/AnswerPanel.tsx`  
  Strengthen answer typography and copy action hierarchy.
- `roots-react/src/components/EvidencePanel.tsx`  
  Delegate full-work rendering to `FullWorkTabs`.
- `roots-react/src/styles.css`  
  Add app-level tokens, subtle surface utilities, and reduced-motion-safe polish.

Do not modify:

- `index.html`
- `app.js`
- `styles.css`
- `roots/`
- `root-engine.js`
- `roots-react/src/lib/rootEngineAdapter.ts`
- `roots-react/public/legacy/**`, except through the existing sync script if the release gate updates tracked synced files.

---

### Task 1: Add Workbench Shell Components

**Files:**
- Create: `roots-react/src/components/WorkbenchShell.tsx`
- Create: `roots-react/src/components/WorkbenchHeader.tsx`
- Create: `roots-react/src/components/MethodRail.tsx`
- Create: `roots-react/src/components/InputComposer.tsx`
- Modify: `roots-react/src/App.tsx`

- [ ] **Step 1: Create the shell component**

Create `roots-react/src/components/WorkbenchShell.tsx`:

```tsx
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
```

- [ ] **Step 2: Create the header component**

Create `roots-react/src/components/WorkbenchHeader.tsx`:

```tsx
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
```

- [ ] **Step 3: Create the method rail component**

Create `roots-react/src/components/MethodRail.tsx`:

```tsx
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
```

- [ ] **Step 4: Create the input composer component**

Create `roots-react/src/components/InputComposer.tsx`:

```tsx
import { Play } from 'lucide-react';

import { MethodForm } from './MethodForm';
import { RunControls } from './RunControls';
import type { MethodConfig, MethodFormState, RootMethod, RunStatus } from '../types/roots';

interface InputComposerProps {
  activeConfig: MethodConfig;
  activeForm: MethodFormState;
  status: RunStatus;
  onChange: (method: RootMethod, fieldId: string, value: string) => void;
  onRun: () => void;
}

export function InputComposer({
  activeConfig,
  activeForm,
  status,
  onChange,
  onRun,
}: InputComposerProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
      <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
            Input composer
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{activeConfig.runLabel}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
          <Play aria-hidden="true" className="size-3.5" />
          Ready to run
        </div>
      </div>
      <div className="space-y-5">
        <MethodForm config={activeConfig} formState={activeForm} onChange={onChange} />
        <RunControls
          disabled={status.kind === 'loading'}
          runLabel={activeConfig.runLabel}
          status={status}
          onRun={onRun}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire the shell in `App.tsx`**

Modify `roots-react/src/App.tsx` so it imports and renders the new shell:

```tsx
import { useId } from 'react';

import { AnswerRail } from './components/AnswerRail';
import { InputComposer } from './components/InputComposer';
import { MethodRail } from './components/MethodRail';
import { WorkbenchHeader } from './components/WorkbenchHeader';
import { WorkbenchShell } from './components/WorkbenchShell';
import { useRootsWorkbench } from './hooks/useRootsWorkbench';

export default function App() {
  const fullWorkRegionId = useId();
  const {
    activeConfig,
    activeForm,
    activeMethod,
    angleMode,
    displayConfig,
    displayRun,
    evidenceExpanded,
    methodConfigs,
    runActiveMethod,
    setEvidenceExpanded,
    setMethod,
    status,
    toggleAngleMode,
    updateField,
  } = useRootsWorkbench();

  return (
    <WorkbenchShell
      header={<WorkbenchHeader angleMode={angleMode} onToggleAngleMode={toggleAngleMode} />}
      methodRail={
        <MethodRail
          activeConfig={activeConfig}
          activeMethod={activeMethod}
          methods={methodConfigs}
          onSelect={setMethod}
        />
      }
      inputComposer={
        <InputComposer
          activeConfig={activeConfig}
          activeForm={activeForm}
          status={status}
          onChange={updateField}
          onRun={runActiveMethod}
        />
      }
      answerRail={
        <AnswerRail
          config={displayConfig}
          evidenceExpanded={evidenceExpanded}
          fullWorkRegionId={fullWorkRegionId}
          displayRun={displayRun}
          onToggleEvidence={() => setEvidenceExpanded((current) => !current)}
        />
      }
    />
  );
}
```

- [ ] **Step 6: Run typecheck**

Run:

```powershell
npm run typecheck
```

from `roots-react/`.

Expected: TypeScript reports missing `AnswerRail` until Task 2 is complete. If the worker completes Task 1 and Task 2 in one pass, expected result is PASS.

- [ ] **Step 7: Commit Task 1 and Task 2 together**

Commit after Task 2 typecheck passes:

```bash
git add roots-react/src/App.tsx roots-react/src/components/WorkbenchShell.tsx roots-react/src/components/WorkbenchHeader.tsx roots-react/src/components/MethodRail.tsx roots-react/src/components/InputComposer.tsx roots-react/src/components/AnswerRail.tsx
git commit -m "feat: add roots react workbench shell"
```

---

### Task 2: Add Answer Rail

**Files:**
- Create: `roots-react/src/components/AnswerRail.tsx`
- Modify: `roots-react/src/components/AnswerPanel.tsx`

- [ ] **Step 1: Create `AnswerRail.tsx`**

Create `roots-react/src/components/AnswerRail.tsx`:

```tsx
import { CompareMethodsCallout } from './CompareMethodsCallout';
import { ConfidenceSummary } from './ConfidenceSummary';
import { EmptyState } from './EmptyState';
import { EvidencePanel } from './EvidencePanel';
import { EvidencePreview } from './EvidencePreview';
import { AnswerPanel } from './AnswerPanel';
import type { DisplayRun, MethodConfig } from '../types/roots';

interface AnswerRailProps {
  config: MethodConfig;
  displayRun: DisplayRun;
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
      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur">
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
```

- [ ] **Step 2: Confirm `DisplayRun` type name**

Open `roots-react/src/types/roots.ts`.

If no exported `DisplayRun` type exists, create a local type in `AnswerRail.tsx`:

```tsx
import type { MethodConfig, RootRunResult, RunFreshness } from '../types/roots';

interface DisplayRunState {
  run: RootRunResult | null;
  freshness: RunFreshness;
  staleReason: string | null;
  hasCompareEntry: boolean;
}
```

Then replace `displayRun: DisplayRun;` with:

```tsx
displayRun: DisplayRunState;
```

- [ ] **Step 3: Restyle `AnswerPanel` as the primary answer card**

Modify only classes and small copy in `roots-react/src/components/AnswerPanel.tsx`.

Target outer section:

```tsx
<section className="rounded-xl border border-sky-300/20 bg-slate-950/80 p-4 shadow-[0_24px_80px_rgba(14,165,233,0.14)]">
```

Target answer value:

```tsx
<p className="mt-2 break-words text-4xl font-semibold tracking-normal text-sky-200 sm:text-5xl">
  {approximation}
</p>
```

Target copy button wrapper remains the existing `Button`; do not change copy logic.

- [ ] **Step 4: Run typecheck**

Run:

```powershell
npm run typecheck
```

from `roots-react/`.

Expected: PASS after `AnswerRail` typing is correct.

- [ ] **Step 5: Commit with Task 1**

Use the Task 1 commit step once shell and answer rail compile.

---

### Task 3: Convert Full Work To Tabs

**Files:**
- Create: `roots-react/src/components/FullWorkTabs.tsx`
- Modify: `roots-react/src/components/EvidencePanel.tsx`

- [ ] **Step 1: Create `FullWorkTabs.tsx`**

Create `roots-react/src/components/FullWorkTabs.tsx`:

```tsx
import { useState } from 'react';
import { BarChart3, ClipboardList, LineChart, Table2 } from 'lucide-react';

import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { IterationTable } from './IterationTable';
import { SolutionSteps } from './SolutionSteps';
import type { MethodConfig, RootRunResult } from '../types/roots';

type FullWorkTab = 'diagnostics' | 'graph' | 'steps' | 'table';

const tabs: Array<{
  id: FullWorkTab;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { id: 'diagnostics', label: 'Diagnostics', icon: ClipboardList },
  { id: 'graph', label: 'Graph', icon: LineChart },
  { id: 'steps', label: 'Steps', icon: BarChart3 },
  { id: 'table', label: 'Table', icon: Table2 },
];

interface FullWorkTabsProps {
  config: MethodConfig;
  run: RootRunResult;
}

export function FullWorkTabs({ config, run }: FullWorkTabsProps) {
  const [activeTab, setActiveTab] = useState<FullWorkTab>('diagnostics');

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1 sm:grid-cols-4"
        role="tablist"
        aria-label="Full work sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-950/30'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon aria-hidden="true" className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
        {activeTab === 'diagnostics' ? <DiagnosticsPanel run={run} /> : null}
        {activeTab === 'graph' ? <ConvergenceGraph run={run} /> : null}
        {activeTab === 'steps' ? <SolutionSteps run={run} /> : null}
        {activeTab === 'table' ? <IterationTable config={config} run={run} /> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Use tabs in `EvidencePanel.tsx`**

Replace the direct diagnostics/graph/steps/table render with:

```tsx
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
```

- [ ] **Step 3: Run typecheck**

Run:

```powershell
npm run typecheck
```

from `roots-react/`.

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add roots-react/src/components/FullWorkTabs.tsx roots-react/src/components/EvidencePanel.tsx
git commit -m "feat: organize roots full work tabs"
```

---

### Task 4: Refine Method Picker And Surface Styling

**Files:**
- Modify: `roots-react/src/components/MethodPicker.tsx`
- Modify: `roots-react/src/styles.css`

- [ ] **Step 1: Restyle `MethodPicker.tsx` for rail and mobile use**

Replace the component body with:

```tsx
export function MethodPicker({ activeMethod, methods, onSelect }: MethodPickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {methods.map((method) => {
        const isActive = method.method === activeMethod;

        return (
          <button
            key={method.method}
            type="button"
            onClick={() => onSelect(method.method)}
            aria-pressed={isActive}
            className={[
              'group rounded-xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-300',
              isActive
                ? 'border-sky-300/70 bg-sky-300 text-slate-950 shadow-lg shadow-sky-950/30'
                : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-300/40 hover:bg-white/[0.08]',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{method.shortLabel}</span>
            <span
              className={[
                'mt-1 block text-xs',
                isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-300',
              ].join(' ')}
            >
              {method.group}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add global visual tokens to `styles.css`**

Modify `roots-react/src/styles.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  font-family:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #070b12;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background-color: #070b12;
  color: #e2e8f0;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
select,
textarea {
  font: inherit;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}

::selection {
  background: rgba(56, 189, 248, 0.35);
  color: #ffffff;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Run typecheck and build**

Run:

```powershell
npm run typecheck
npm run build
```

from `roots-react/`.

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add roots-react/src/components/MethodPicker.tsx roots-react/src/styles.css
git commit -m "style: refine roots workbench surface"
```

---

### Task 5: Add Restrained Run Reveal Motion

**Files:**
- Create: `roots-react/src/hooks/useRunRevealMotion.ts`
- Modify: `roots-react/src/components/AnswerRail.tsx`

- [ ] **Step 1: Create `useRunRevealMotion.ts`**

Create `roots-react/src/hooks/useRunRevealMotion.ts`:

```ts
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useRunRevealMotion<T extends HTMLElement>(runKey: string | null) {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !runKey) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    gsap.fromTo(
      element,
      { opacity: 0.86, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
    );
  }, [runKey]);

  return elementRef;
}
```

- [ ] **Step 2: Use the hook in `AnswerRail.tsx`**

In `AnswerRail.tsx`, import the hook:

```tsx
import { useRunRevealMotion } from '../hooks/useRunRevealMotion';
```

Create a run key after `const run = displayRun.run;`:

```tsx
const runKey = run
  ? `${run.method}-${run.summary?.approximation ?? 'no-approximation'}-${run.rows.length}`
  : null;
const revealRef = useRunRevealMotion<HTMLElement>(runKey);
```

Apply the ref to the rail section:

```tsx
<section ref={revealRef} className="space-y-4" aria-label="Answer and evidence">
```

- [ ] **Step 3: Run typecheck and build**

Run:

```powershell
npm run typecheck
npm run build
```

from `roots-react/`.

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add roots-react/src/hooks/useRunRevealMotion.ts roots-react/src/components/AnswerRail.tsx
git commit -m "feat: add restrained roots run reveal motion"
```

---

### Task 6: Browser QA And Release Gate

**Files:**
- Modify only files required to fix visual or accessibility defects found during QA.

- [ ] **Step 1: Run canonical release check**

Run from repo root:

```powershell
.\scripts\roots-react-release-check.ps1
```

Expected:

- engine correctness audit passes 47/47,
- root engine audit passes 45/45,
- `sync:legacy` passes,
- stale synced legacy diff guard passes,
- typecheck passes,
- Vite build passes.

- [ ] **Step 2: Confirm legacy backup remains untouched**

Run:

```bash
git diff -- index.html app.js styles.css roots/
```

Expected: no output.

- [ ] **Step 3: Start local preview**

Run from `roots-react/`:

```powershell
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 4: Desktop browser check**

Open the Vite URL in the in-app browser.

Verify at desktop width:

- header is visible,
- method rail is on the left,
- input composer is in the center,
- answer rail is on the right after a run,
- no text overlaps,
- no horizontal scrollbar,
- console has no errors.

- [ ] **Step 5: Mobile browser check**

Resize the browser to approximately `390x844`.

Verify:

- workflow stacks as header, method selector, inputs, run, answer, evidence,
- method buttons remain touch-friendly,
- answer value wraps inside its panel,
- full work defaults collapsed,
- no text overlaps.

- [ ] **Step 6: Method smoke checks**

Run one calculation for each method using existing defaults or known valid sample inputs:

- Bisection,
- Newton-Raphson,
- Secant,
- False Position,
- Fixed Point.

For each method verify:

- run completes,
- answer appears,
- copy answer button is visible,
- evidence preview appears,
- full work tabs can be opened.

- [ ] **Step 7: Stale-state check**

After one successful run, edit the expression or one numeric input.

Expected:

- answer remains visible,
- stale/outdated result message appears,
- evidence preview indicates it reflects the last successful run.

- [ ] **Step 8: Commit QA fixes**

If QA required code changes:

```bash
git add roots-react/src
git commit -m "fix: polish roots workbench responsive qa"
```

If QA required no changes, do not create an empty commit.

---

### Task 7: Final Release Handoff

**Files:**
- Modify: `docs/deployment/roots-react-agent-release-checklist.md` only if the checklist needs a new note discovered during QA.

- [ ] **Step 1: Final status check**

Run:

```bash
git status --short
git diff -- index.html app.js styles.css roots/
```

Expected:

- worktree clean after commits,
- no legacy backup diff.

- [ ] **Step 2: Push the implementation branch**

If working on `master` directly in this worktree, create a feature branch before pushing implementation:

```bash
git switch -c codex/roots-react-ui-ux-foundation
git push -u origin codex/roots-react-ui-ux-foundation
```

If already on a feature branch:

```bash
git push
```

- [ ] **Step 3: Prepare handoff summary**

Final handoff must include:

- changed files,
- release check result,
- browser QA result,
- legacy backup diff result,
- branch name and commit SHA,
- remaining risks.

Do not claim Vercel Git deployment unless Vercel shows a new Git-connected deployment for the pushed branch or production branch.

---

## Self-Review

Spec coverage:

- Answer-first workflow is covered by Tasks 1 and 2.
- Modern command-workbench shell is covered by Tasks 1 and 4.
- Component boundaries are covered by the file structure and Tasks 1 through 3.
- Full work organization is covered by Task 3.
- Restrained GSAP motion is covered by Task 5.
- Accessibility and responsive requirements are covered by Task 6.
- Release safety and legacy backup protection are covered by Tasks 6 and 7.

Red-flag wording scan:

- No incomplete work markers are present.

Type consistency:

- Components use existing `MethodConfig`, `RootMethod`, `MethodFormState`, `RunStatus`, `RootRunResult`, and `RunFreshness` types.
- `DisplayRun` is guarded with an explicit fallback instruction if the current type file does not export it.
