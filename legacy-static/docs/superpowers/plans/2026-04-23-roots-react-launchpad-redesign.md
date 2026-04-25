# Roots React Launchpad Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the isolated `roots-react/` pilot into a balanced launchpad that stays answer-first, adds compact confidence plus preview-first evidence, preserves stale-result honesty, and leaves room for future method comparison without changing legacy numerical behavior.

**Architecture:** Keep the current Vite + React + TypeScript pilot and the legacy engine adapter. Replace the current “active method owns the displayed run” model with a single last-successful-run model plus freshness tracking, split the result side into smaller focused components, and recompose the app into a balanced before-run layout that becomes answer-anchored after run.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, existing legacy `RootEngine` adapter, Node audit scripts, browser smoke tests

---

## File Structure

Modify:

- `roots-react/src/types/roots.ts` - add request snapshot, run freshness, and displayed-run contracts
- `roots-react/src/hooks/useRootsWorkbench.ts` - preserve the last successful run, derive freshness, and expose launchpad-ready state
- `roots-react/src/lib/resultFormatters.ts` - add compact confidence and preview helpers used by the redesigned result surface
- `roots-react/src/components/AnswerPanel.tsx` - narrow this component to the answer anchor and stale-state messaging
- `roots-react/src/components/ConvergenceGraph.tsx` - support compact preview rendering
- `roots-react/src/components/DiagnosticsPanel.tsx` - support compact preview rendering
- `roots-react/src/components/EvidencePanel.tsx` - render full evidence detail only when expanded
- `roots-react/src/components/EmptyState.tsx` - show a quiet before-run launchpad placeholder instead of a plain empty message
- `roots-react/src/App.tsx` - recompose the page into the Balanced Launchpad layout
- `roots-react/src/styles.css` - adjust global layout/focus/background primitives for the redesigned shell

Create:

- `roots-react/src/components/ConfidenceSummary.tsx` - compact trust and stopping summary beside the answer
- `roots-react/src/components/EvidencePreview.tsx` - graph/diagnostic preview with a `Show full work` action
- `roots-react/src/components/CompareMethodsCallout.tsx` - reserved secondary action area for next-phase comparison

No new test framework files in this phase. Validation stays with:

- `node scripts/engine-correctness-audit.js`
- `node scripts/root-engine-audit.js`
- `npm run sync:legacy`
- `npm run typecheck`
- `npm run build`
- browser smoke tests against the Vite app

## Task 1: Reshape Workbench State Around Last Successful Run

**Files:**
- Modify: `roots-react/src/types/roots.ts`
- Modify: `roots-react/src/hooks/useRootsWorkbench.ts`

- [ ] **Step 1: Add freshness and request snapshot types**

Update `roots-react/src/types/roots.ts` by adding the run-state contracts below after `MethodConfig` and before `WorkbenchStatus`:

```ts
export type RunFreshness = 'empty' | 'current' | 'stale';

export interface RunRequestSnapshot {
  method: RootMethod;
  angleMode: AngleMode;
  values: MethodFormState;
}

export interface StoredRunState {
  result: RootRunResult;
  request: RunRequestSnapshot;
}

export interface DisplayedRunState {
  run: RootRunResult | null;
  request: RunRequestSnapshot | null;
  freshness: RunFreshness;
  staleReason: string | null;
  hasCompareEntry: boolean;
}
```

- [ ] **Step 2: Replace per-method displayed runs with one last-successful-run state**

In `roots-react/src/hooks/useRootsWorkbench.ts`, update imports and local state so the hook tracks a single `lastRun` and derives a display state from the current draft request:

```ts
import type {
  AngleMode,
  DisplayedRunState,
  MethodFormState,
  RootMethod,
  RunRequestSnapshot,
  StoredRunState,
  WorkbenchStatus,
} from '../types/roots';

function createRequestSnapshot(
  method: RootMethod,
  forms: Record<RootMethod, MethodFormState>,
  angleMode: AngleMode,
): RunRequestSnapshot {
  return {
    method,
    angleMode,
    values: { ...forms[method] },
  };
}

function sameSnapshot(left: RunRequestSnapshot | null, right: RunRequestSnapshot): boolean {
  if (!left) return false;
  if (left.method !== right.method || left.angleMode !== right.angleMode) return false;

  const leftEntries = Object.entries(left.values);
  const rightEntries = Object.entries(right.values);
  if (leftEntries.length !== rightEntries.length) return false;

  return rightEntries.every(([key, value]) => left.values[key] === value);
}

function staleReason(
  previous: RunRequestSnapshot | null,
  current: RunRequestSnapshot,
): string | null {
  if (!previous) return null;
  if (previous.method !== current.method) return 'Method changed. Run again to update the answer.';
  if (previous.angleMode !== current.angleMode) {
    return 'Angle mode changed. Re-run to update trig values.';
  }
  return 'Inputs changed. Run again to update the answer.';
}
```

Then replace:

```ts
const [runs, setRuns] = useState<Partial<Record<RootMethod, RootRunResult>>>({});
```

with:

```ts
const [lastRun, setLastRun] = useState<StoredRunState | null>(null);
```

- [ ] **Step 3: Derive display state, displayed config, and compare availability**

Still in `roots-react/src/hooks/useRootsWorkbench.ts`, replace `activeRun`/`runs` derivation with a single `displayRun` object and a `displayConfig` that follows the displayed result method when stale:

```ts
const activeRequest = useMemo(
  () => createRequestSnapshot(activeMethod, forms, angleMode),
  [activeMethod, angleMode, forms],
);

const displayRun = useMemo<DisplayedRunState>(() => {
  if (!lastRun) {
    return {
      run: null,
      request: null,
      freshness: 'empty',
      staleReason: null,
      hasCompareEntry: false,
    };
  }

  const freshness = sameSnapshot(lastRun.request, activeRequest) ? 'current' : 'stale';
  return {
    run: lastRun.result,
    request: lastRun.request,
    freshness,
    staleReason: freshness === 'stale' ? staleReason(lastRun.request, activeRequest) : null,
    hasCompareEntry: true,
  };
}, [activeRequest, lastRun]);

const displayConfig = useMemo(() => {
  const displayMethod = displayRun.run?.method ?? activeMethod;
  return METHOD_CONFIGS.find((config) => config.method === displayMethod) ?? METHOD_CONFIGS[0];
}, [activeMethod, displayRun.run]);
```

- [ ] **Step 4: Stop deleting the last result on edits, method changes, and angle toggles**

Update the action handlers in `roots-react/src/hooks/useRootsWorkbench.ts` so they preserve `lastRun` and only change status/evidence state until the next successful run:

```ts
const updateField = useCallback(
  (method: RootMethod, fieldId: string, value: string) => {
    setForms((current) => ({
      ...current,
      [method]: {
        ...current[method],
        [fieldId]: value,
      },
    }));
    setWorkbenchStatus(INPUTS_CHANGED_STATUS);
    setEvidenceExpanded(false);
  },
  [],
);

const runActiveMethod = useCallback(() => {
  if (engineStatus !== 'ready') {
    return;
  }

  try {
    const request = createRequestSnapshot(activeMethod, forms, angleMode);
    const result = runRootMethod(activeMethod, forms[activeMethod], angleMode);
    setLastRun({ result, request });
    setWorkbenchStatus({ kind: 'ready', message: 'Answer ready.' });
    setEvidenceExpanded(false);
  } catch (error) {
    setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
    setEvidenceExpanded(false);
  }
}, [activeMethod, angleMode, engineStatus, forms]);

const toggleAngleMode = useCallback(() => {
  setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'));
  setEvidenceExpanded(false);
  setWorkbenchStatus(ANGLE_MODE_CHANGED_STATUS);
}, []);

const setMethod = useCallback((method: RootMethod) => {
  setActiveMethod(method);
  setEvidenceExpanded(false);
  setWorkbenchStatus(READY_STATUS);
}, []);
```

Return `displayRun`, `displayConfig`, and `hasRun` data from the hook:

```ts
return {
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
};
```

- [ ] **Step 5: Run React validation for the state refactor**

Run:

```powershell
Set-Location roots-react
npm run typecheck
npm run build
Set-Location ..
```

Expected:

- `typecheck` passes
- `build` passes
- no UI files outside `roots-react/` are changed

- [ ] **Step 6: Commit the state-model task**

Run:

```powershell
git add roots-react/src/types/roots.ts roots-react/src/hooks/useRootsWorkbench.ts
git commit -m "feat: track stale roots results in workbench state"
```

Expected: one commit containing only the new state and type contracts.

## Task 2: Build the Answer Anchor, Confidence Summary, and Compare Entry

**Files:**
- Modify: `roots-react/src/lib/resultFormatters.ts`
- Modify: `roots-react/src/components/AnswerPanel.tsx`
- Create: `roots-react/src/components/ConfidenceSummary.tsx`
- Create: `roots-react/src/components/CompareMethodsCallout.tsx`

- [ ] **Step 1: Add formatter helpers for compact confidence and stale labels**

Extend `roots-react/src/lib/resultFormatters.ts` with the helper types and functions below near the existing answer/interpretation helpers:

```ts
export interface ConfidenceItem {
  label: string;
  value: string;
}

export function compactConfidenceItems(run: RootRunResult): ConfidenceItem[] {
  return [
    {
      label: 'Stop',
      value: stopReasonLabel(run.summary?.stopReason, run.method),
    },
    {
      label: 'Metric',
      value: formatValue(run.summary?.error ?? run.summary?.bound ?? run.summary?.residual),
    },
    {
      label: 'Basis',
      value:
        run.summary?.residualBasis ??
        (run.decisionBasis ? `${run.decisionBasis} signs` : 'Current precision'),
    },
  ];
}

export function staleStatusText(staleReason: string | null): string {
  return staleReason ?? 'This result is from the most recent successful run.';
}
```

- [ ] **Step 2: Create the compact confidence summary component**

Create `roots-react/src/components/ConfidenceSummary.tsx`:

```tsx
import { compactConfidenceItems, staleStatusText } from '../lib/resultFormatters';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface ConfidenceSummaryProps {
  run: RootRunResult | null;
  freshness: RunFreshness;
  staleReason: string | null;
}

export function ConfidenceSummary({
  run,
  freshness,
  staleReason,
}: ConfidenceSummaryProps) {
  if (!run) {
    return null;
  }

  const items = compactConfidenceItems(run);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confidence
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100">
            Quick check
          </h2>
        </div>
        <span
          className={
            freshness === 'stale'
              ? 'rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200'
              : 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200'
          }
        >
          {freshness === 'stale' ? 'Stale' : 'Current'}
        </span>
      </div>

      <dl className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm text-slate-100">{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        {staleStatusText(freshness === 'stale' ? staleReason : null)}
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Add the reserved compare-methods entry card**

Create `roots-react/src/components/CompareMethodsCallout.tsx`:

```tsx
import type { RunFreshness } from '../types/roots';

interface CompareMethodsCalloutProps {
  visible: boolean;
  freshness: RunFreshness;
}

export function CompareMethodsCallout({
  visible,
  freshness,
}: CompareMethodsCalloutProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-xl border border-sky-500/20 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
        Compare methods
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-100">
        Reserved next-step action
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        After you verify one answer, the next phase will let you compare the same problem
        across multiple methods.
      </p>
      <button
        type="button"
        disabled
        className="mt-4 inline-flex items-center justify-center rounded-md border border-sky-500/20 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-400"
      >
        {freshness === 'stale' ? 'Re-run before comparing' : 'Compare methods (next phase)'}
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Narrow `AnswerPanel` to the answer anchor**

Replace the props and top-of-card stale messaging in `roots-react/src/components/AnswerPanel.tsx` so it shows the answer, copy action, and one compact freshness note instead of the full trust summary:

```tsx
import type { RootRunResult, RunFreshness } from '../types/roots';

interface AnswerPanelProps {
  run: RootRunResult | null;
  freshness: RunFreshness;
  staleReason: string | null;
}
```

Render the stale/current note immediately above the answer card:

```tsx
{freshness === 'stale' ? (
  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
      Outdated result
    </p>
    <p className="mt-1 text-sm text-amber-100">
      {staleReason ?? 'Inputs changed. Run again to update the answer.'}
    </p>
  </div>
) : (
  <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
      Current result
    </p>
    <p className="mt-1 text-sm text-emerald-100">
      Copy the answer now or inspect the confidence and evidence below.
    </p>
  </div>
)}
```

Keep:

- the existing copy logic
- the large approximate root
- method label

Remove from `AnswerPanel`:

- the stopping parameter cards
- interpretation card
- next-action card

Those move to the dedicated confidence/evidence components in this redesign.

- [ ] **Step 5: Run React validation for the answer-side split**

Run:

```powershell
Set-Location roots-react
npm run typecheck
npm run build
Set-Location ..
```

Expected:

- both commands pass
- no missing imports
- the result side is now split into smaller components without changing numerical behavior

- [ ] **Step 6: Commit the answer-side split**

Run:

```powershell
git add roots-react/src/lib/resultFormatters.ts roots-react/src/components/AnswerPanel.tsx roots-react/src/components/ConfidenceSummary.tsx roots-react/src/components/CompareMethodsCallout.tsx
git commit -m "feat: split answer anchor from confidence summary"
```

Expected: one commit for the answer anchor, compact confidence, and compare entry placeholder.

## Task 3: Add Evidence Preview and Keep Full Evidence Behind Expansion

**Files:**
- Modify: `roots-react/src/lib/resultFormatters.ts`
- Modify: `roots-react/src/components/ConvergenceGraph.tsx`
- Modify: `roots-react/src/components/DiagnosticsPanel.tsx`
- Modify: `roots-react/src/components/EvidencePanel.tsx`
- Create: `roots-react/src/components/EvidencePreview.tsx`

- [ ] **Step 1: Add a compact diagnostics preview helper**

Extend `roots-react/src/lib/resultFormatters.ts` with one compact preview helper:

```ts
export function diagnosticsPreviewText(run: RootRunResult): string {
  if (run.warnings?.length) {
    return run.warnings[0]?.message ?? 'Warnings were reported for this run.';
  }

  const metric = formatValue(run.summary?.error ?? run.summary?.bound ?? run.summary?.residual);
  const stop = stopReasonLabel(run.summary?.stopReason, run.method);
  return `${stop}. Final metric: ${metric}.`;
}
```

- [ ] **Step 2: Make the graph and diagnostics reusable in compact mode**

In `roots-react/src/components/ConvergenceGraph.tsx`, add a `compact?: boolean` prop and shrink the section chrome when `compact` is true:

```tsx
interface ConvergenceGraphProps {
  run: RootRunResult;
  compact?: boolean;
}
```

Apply the prop to the wrapper:

```tsx
<section className={compact ? 'rounded-lg border border-slate-800 bg-slate-900/60 p-3' : 'rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20'}>
```

In `roots-react/src/components/DiagnosticsPanel.tsx`, add the same prop and render one summary sentence when compact:

```tsx
import { diagnosticsPreviewText, formatValue } from '../lib/resultFormatters';

interface DiagnosticsPanelProps {
  run: RootRunResult;
  compact?: boolean;
}

if (compact) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <h3 className="text-sm font-semibold text-slate-100">Diagnostic preview</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {diagnosticsPreviewText(run)}
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Create the evidence preview card**

Create `roots-react/src/components/EvidencePreview.tsx`:

```tsx
import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface EvidencePreviewProps {
  run: RootRunResult | null;
  freshness: RunFreshness;
  expanded: boolean;
  onToggle: () => void;
}

export function EvidencePreview({
  run,
  freshness,
  expanded,
  onToggle,
}: EvidencePreviewProps) {
  if (!run) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Evidence preview
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-100">
            Quick proof the result is grounded
          </h2>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          {expanded ? 'Hide full work' : 'Show full work'}
        </button>
      </div>

      {freshness === 'stale' ? (
        <p className="mt-3 text-xs leading-5 text-amber-200">
          The preview below reflects the last successful run and may not match the current draft inputs.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
        <ConvergenceGraph run={run} compact />
        <DiagnosticsPanel run={run} compact />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Make `EvidencePanel` full-detail only**

Replace the outer header in `roots-react/src/components/EvidencePanel.tsx` so the component only renders when `expanded` is true and always shows the full detail set:

```tsx
if (!run || !expanded) {
  return null;
}

return (
  <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Full work
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Steps, diagnostics, graph, and iteration table for {config.shortLabel}.
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
      >
        Hide full work
      </button>
    </div>

    <div id={contentId} role="region" aria-label="Evidence details" className="mt-4 space-y-4">
      <DiagnosticsPanel run={run} />
      <ConvergenceGraph run={run} />
      <SolutionSteps run={run} />
      <IterationTable config={config} run={run} />
    </div>
  </section>
);
```

- [ ] **Step 5: Run React validation for preview/detail evidence**

Run:

```powershell
Set-Location roots-react
npm run typecheck
npm run build
Set-Location ..
```

Expected:

- both commands pass
- compact preview and full-detail components coexist cleanly
- no accessibility regressions are introduced in the toggle flow

- [ ] **Step 6: Commit the evidence preview split**

Run:

```powershell
git add roots-react/src/lib/resultFormatters.ts roots-react/src/components/ConvergenceGraph.tsx roots-react/src/components/DiagnosticsPanel.tsx roots-react/src/components/EvidencePanel.tsx roots-react/src/components/EvidencePreview.tsx
git commit -m "feat: preview roots evidence before expansion"
```

Expected: one commit containing the preview/detail evidence split only.

## Task 4: Recompose the App Into the Balanced Launchpad Layout

**Files:**
- Modify: `roots-react/src/App.tsx`
- Modify: `roots-react/src/components/EmptyState.tsx`
- Modify: `roots-react/src/styles.css`

- [ ] **Step 1: Replace the plain empty state with a quiet result-side placeholder**

Replace `roots-react/src/components/EmptyState.tsx` with:

```tsx
export function EmptyState() {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Answer
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">
          Result will appear here
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Run the method to turn this side into the answer anchor.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Confidence
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Stop reason, error or residual, and basis summary will appear beside the answer.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Evidence preview
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          A graph preview and one diagnostic summary will show here before the full work expands.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-sky-500/20 bg-slate-950/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          Compare methods
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          This area is reserved for the next-phase comparison action after the first successful run.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Recompose `App.tsx` around `displayRun` and the new right-side stack**

Replace the main composition in `roots-react/src/App.tsx` with the launchpad structure below:

```tsx
import { CompareMethodsCallout } from './components/CompareMethodsCallout';
import { ConfidenceSummary } from './components/ConfidenceSummary';
import { EvidencePreview } from './components/EvidencePreview';

export default function App() {
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

  const hasResult = displayRun.run !== null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              Roots React pilot
            </p>
            <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
              NET+ Roots Workbench
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Solve fast, verify quickly, and expand into the full numerical record only when needed.
            </p>
          </div>
          <AngleToggle angleMode={angleMode} onToggle={toggleAngleMode} />
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/20">
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Method
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select the numerical method you want to run.
                  </p>
                </div>
                <MethodPicker
                  activeMethod={activeMethod}
                  methods={methodConfigs}
                  onSelect={setMethod}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/20">
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Method inputs
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{activeConfig.summary}</p>
                </div>
                <MethodForm
                  config={activeConfig}
                  formState={activeForm}
                  onChange={updateField}
                />
                <RunControls
                  disabled={status.kind === 'loading'}
                  runLabel={activeConfig.runLabel}
                  status={status}
                  onRun={runActiveMethod}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {hasResult ? (
              <>
                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(220px,0.88fr)]">
                  <AnswerPanel
                    run={displayRun.run}
                    freshness={displayRun.freshness}
                    staleReason={displayRun.staleReason}
                  />
                  <ConfidenceSummary
                    run={displayRun.run}
                    freshness={displayRun.freshness}
                    staleReason={displayRun.staleReason}
                  />
                </section>

                <EvidencePreview
                  run={displayRun.run}
                  freshness={displayRun.freshness}
                  expanded={evidenceExpanded}
                  onToggle={() => setEvidenceExpanded((current) => !current)}
                />

                <CompareMethodsCallout
                  visible={displayRun.hasCompareEntry}
                  freshness={displayRun.freshness}
                />

                <EvidencePanel
                  config={displayConfig}
                  expanded={evidenceExpanded}
                  run={displayRun.run}
                  onToggle={() => setEvidenceExpanded(false)}
                />
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Tighten the global shell styles**

Replace `roots-react/src/styles.css` with:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #020617;
  color: #e2e8f0;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

body {
  margin: 0;
  min-width: 320px;
  background: radial-gradient(circle at top, rgba(14, 165, 233, 0.08), transparent 32%), #020617;
}

button,
input,
select,
textarea {
  font: inherit;
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid #7dd3fc;
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run React validation for the full launchpad composition**

Run:

```powershell
Set-Location roots-react
npm run typecheck
npm run build
Set-Location ..
```

Expected:

- both commands pass
- before-run view shows the balanced placeholder stack
- after-run view uses the new answer + confidence + preview composition

- [ ] **Step 5: Commit the launchpad composition**

Run:

```powershell
git add roots-react/src/App.tsx roots-react/src/components/EmptyState.tsx roots-react/src/styles.css
git commit -m "feat: redesign roots app as balanced launchpad"
```

Expected: one commit for app composition and shell styling only.

## Task 5: Verify the Redesign Against Engine and UX Requirements

**Files:**
- No planned file changes unless verification finds a bug.

- [ ] **Step 1: Run the deterministic engine audits**

Run from repository root:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

Expected:

- `Summary: 47/47 passed`
- `Summary: 45/45 passed`

- [ ] **Step 2: Rebuild the React app from copied legacy engines**

Run:

```powershell
Set-Location roots-react
npm run sync:legacy
npm run typecheck
npm run build
Set-Location ..
```

Expected:

- copied legacy engine files update successfully
- `typecheck` passes
- `build` passes

- [ ] **Step 3: Start the Vite app for browser smoke tests**

Run:

```powershell
Set-Location roots-react
npm run dev -- --host 127.0.0.1 --port 49737 --strictPort
```

Expected: Vite prints `http://127.0.0.1:49737/` and stays running.

- [ ] **Step 4: Smoke-test the five methods and the redesigned right-side behavior**

In the browser, verify:

1. **Bisection**
   - use `x^2 - 2`, `a = 1`, `b = 2`, `k = 6`, `round`, `n = 4`
   - answer appears
   - `Copy answer` is the most obvious post-run action
   - compact confidence appears beside the answer
   - evidence preview appears before full detail

2. **Newton-Raphson**
   - use `x^2 - 2`, `2*x`, `x0 = 1`, `k = 6`, `round`, `n = 4`
   - answer and confidence update

3. **Secant**
   - use `x^2 - 2`, `x0 = 1`, `x1 = 2`, `k = 6`, `round`, `n = 4`

4. **False Position**
   - use `x^2 - 2`, `a = 1`, `b = 2`, `k = 6`, `round`, `n = 4`

5. **Fixed Point**
   - use `g(x) = cos(x)`, `x0 = 1`, `k = 6`, `round`, `n = 4`

Expected: all five methods return valid answer cards and evidence preview cards.

- [ ] **Step 5: Smoke-test stale-state honesty**

In the same browser session:

1. Run any method successfully.
2. Change one input.
3. Confirm the old answer stays visible but is marked stale.
4. Change angle mode.
5. Confirm the same stale treatment appears again.
6. Change method.
7. Confirm the displayed answer remains visible but is marked stale, and the displayed evidence/table headers still correspond to the last successful run.

Expected:

- stale results are clearly marked
- no stale result is silently presented as current
- compare entry appears only when a successful run exists

- [ ] **Step 6: Expand and collapse full evidence**

Verify:

- `Show full work` expands diagnostics, graph, steps, and table
- `Hide full work` collapses back to preview
- preview stays available whether the result is current or stale

Expected: preview/detail flow behaves exactly as described in the design spec.

- [ ] **Step 7: Stop the dev server and inspect git status**

Stop Vite with `Ctrl+C`, then run:

```powershell
git status --short
```

Expected:

- no `node_modules/`, `dist/`, or `*.tsbuildinfo` files remain tracked
- only intended source changes remain, or the tree is clean if no bug fixes were needed

- [ ] **Step 8: Commit only if verification required a bug fix**

If verification changed files, run:

```powershell
git add roots-react
git commit -m "fix: verify roots launchpad redesign"
```

If no files changed, skip this step.

## Self-Review Checklist

Before executing this plan, confirm:

1. **Spec coverage**
   - last-successful-run model with freshness: Task 1
   - answer-first post-run behavior: Tasks 2 and 4
   - compact confidence beside answer: Task 2 + Task 4
   - preview-first evidence: Task 3 + Task 4
   - compare entry reserved for next phase: Task 2 + Task 4
   - browser and audit verification: Task 5

2. **Placeholder scan**
   - no red-flag placeholder text remains
   - each code-changing step includes an explicit code block

3. **Type consistency**
   - `DisplayedRunState`, `StoredRunState`, and `RunFreshness` names match across files
   - `displayConfig` follows the displayed run method, not the active draft method
   - stale-state wording is consistent across the hook and the answer/confidence UI

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-23-roots-react-launchpad-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
