# Quick Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an exam-safe, manual-input-only Quick Setup panel for Bisection, Newton-Raphson, and Fixed Point without changing numerical engines or making Modern beta the default.

**Architecture:** Quick Setup is a UI and state-orchestration feature. A new compact React component collects manual inputs, then calls a hook-level `runQuickSetup` function that writes values into the existing method form state and runs the existing root-engine selection path in one synchronous action. Existing result panels continue to provide checks, helpers, steps, tables, graph, final approximation, and CSV export.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, existing Roots Workbench engine adapter.

---

## File Structure

- Create `src/components/QuickSetupPanel.tsx`: compact manual Quick Setup panel and form-to-method value mapping.
- Modify `src/hooks/useRootsWorkbench.ts`: add `runQuickSetup(method, values)` so Quick Setup can update state and run immediately.
- Modify `src/App.tsx`: render Quick Setup inside `Equation Studio`, pass hook callback, and rename suspicious toolbar copy from `Quick command` to `Quick Setup`.
- Modify `src/styles.css`: add compact Quick Setup layout styles using the existing surface, field, segment, and button language.
- Modify `tests/app-smoke.spec.ts`: update UI expectations from Quick Command to Quick Setup and add manual Bisection/Newton coverage.
- Optionally add `src/components/QuickSetupPanel.test.tsx` only if a test renderer is already present. It is not present now, so Playwright coverage is the lower-friction path.

Do not modify `root-engine.js`, `expression-engine.js`, `public/legacy/`, or files under `legacy-static/`.

---

### Task 1: Add Failing Quick Setup E2E Coverage

**Files:**
- Modify: `new-migration/roots-react-workbench/tests/app-smoke.spec.ts`

- [ ] **Step 1: Replace the existing Quick Command interaction with Quick Setup expectations**

In `tests/app-smoke.spec.ts`, replace the block that clicks `Quick Command` and chooses `Newton: sqrt(2)` with assertions that the new in-studio Quick Setup panel exists and no paste-question surface exists.

Use this shape:

```ts
await expect(page.getByRole('heading', { name: 'Quick Setup' })).toBeVisible();
await expect(page.getByText('Quick Setup is calculator-style. It does not parse full problem statements.')).toBeVisible();
await expect(page.getByRole('textbox', { name: /paste/i })).toHaveCount(0);
await expect(page.getByText(/paste.*question/i)).toHaveCount(0);
```

- [ ] **Step 2: Add manual Bisection Quick Setup coverage**

Add this flow in the same smoke test after the Quick Setup visibility assertions:

```ts
await page.getByRole('button', { name: 'Bisection quick setup' }).click();
await page.getByLabel('Quick Setup Bisection f(x)').fill('x^3 - x - 1');
await page.getByLabel('Quick Setup Bisection a').fill('1');
await page.getByLabel('Quick Setup Bisection b').fill('2');
await page.getByLabel('Quick Setup Bisection stop value').fill('6');
await page.getByRole('button', { name: 'Run Table' }).click();

await expect(page.getByRole('heading', { name: 'Bisection' })).toBeVisible();
await expect(page.getByText('Method: Bisection')).toBeVisible();
await expect(page.getByText(/Final approximation/i)).toBeVisible();
await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Graph' })).toBeVisible();
```

- [ ] **Step 3: Add manual Newton Quick Setup coverage**

Add this flow after the Bisection assertions:

```ts
await page.getByRole('button', { name: 'Newton-Raphson quick setup' }).click();
await page.getByLabel('Quick Setup Newton-Raphson f(x)').fill('x^3 - x - 1');
await page.getByLabel('Quick Setup Newton-Raphson x0').fill('1.5');
await page.getByLabel('Quick Setup Newton-Raphson stop value').fill('6');
await page.getByRole('button', { name: 'Run Table' }).click();

await expect(page.getByRole('heading', { name: 'Newton-Raphson' })).toBeVisible();
await expect(page.getByText('Method: Newton-Raphson')).toBeVisible();
await expect(page.getByText(/Final approximation/i)).toBeVisible();
await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible();
```

- [ ] **Step 4: Run the smoke test and confirm it fails for missing Quick Setup**

Run:

```powershell
npm run test:e2e -- tests/app-smoke.spec.ts
```

Expected: FAIL because `Quick Setup` panel and labels do not exist yet.

---

### Task 2: Add Hook-Level Quick Setup Run API

**Files:**
- Modify: `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts`

- [ ] **Step 1: Add a Quick Setup status helper**

Near the existing status helpers, add:

```ts
const QUICK_SETUP_STATUS = (methodLabel: string): WorkbenchStatus => ({
  kind: 'ready',
  message: `${methodLabel} Quick Setup table ready.`,
});
```

- [ ] **Step 2: Add `runQuickSetup` inside `useRootsWorkbench`**

Place this callback after `runActiveMethod` so it can follow the same error handling pattern:

```ts
const runQuickSetup = useCallback(
  (method: RootMethod, values: MethodFormState) => {
    const config = METHOD_CONFIGS.find((entry) => entry.method === method) ?? METHOD_CONFIGS[0];
    const defaults = createDefaultFormState()[method];
    const nextForms: Record<RootMethod, MethodFormState> = {
      ...forms,
      [method]: {
        ...defaults,
        ...values,
      },
    };

    setActiveMethod(method);
    setForms(nextForms);

    if (engineStatus !== 'ready') {
      setWorkbenchStatus(LOADING_STATUS);
      setEvidenceExpanded(false);
      return;
    }

    try {
      const request = createRequestSnapshot(method, nextForms, angleMode);
      const result = runSelectedRootMethod(method, nextForms[method], angleMode, engineMode);

      if (isInvalidRun(result)) {
        setLastRun(null);
        setWorkbenchStatus({ kind: 'error', message: resultFailureMessage(result) });
        setEvidenceExpanded(false);
        return;
      }

      setLastRun({ result, request, ranAt: new Date().toISOString() });
      setWorkbenchStatus(QUICK_SETUP_STATUS(config.label));
      setEvidenceExpanded(true);
    } catch (error) {
      setLastRun(null);
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setEvidenceExpanded(false);
    }
  },
  [angleMode, engineMode, engineStatus, forms],
);
```

- [ ] **Step 3: Return `runQuickSetup` from the hook**

Add it to the returned object:

```ts
runQuickSetup,
```

- [ ] **Step 4: Run typecheck and expect current callers to compile after Task 3**

Run:

```powershell
npm run typecheck
```

Expected before Task 3: PASS, because adding the returned function does not force any caller to consume it.

---

### Task 3: Create the Quick Setup Panel Component

**Files:**
- Create: `new-migration/roots-react-workbench/src/components/QuickSetupPanel.tsx`

- [ ] **Step 1: Add the component file**

Create `src/components/QuickSetupPanel.tsx` with:

```tsx
import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { MethodFormState, RootMethod } from '../types/roots';
import { Button } from './ui/Button';

type QuickSetupMethod = Extract<RootMethod, 'bisection' | 'newton' | 'fixedPoint'>;
type StopKind = 'iterations' | 'epsilon';
type NewtonDerivativeMode = 'auto' | 'provided';

interface QuickSetupPanelProps {
  onRun: (method: RootMethod, values: MethodFormState) => void;
}

const QUICK_METHODS: Array<{ id: QuickSetupMethod; label: string; ariaLabel: string }> = [
  { id: 'bisection', label: 'Bisection', ariaLabel: 'Bisection quick setup' },
  { id: 'newton', label: 'Newton-Raphson', ariaLabel: 'Newton-Raphson quick setup' },
  { id: 'fixedPoint', label: 'Fixed Point', ariaLabel: 'Fixed Point quick setup' },
];

const DEFAULTS = {
  bisection: {
    expression: 'x^3 - x - 1',
    a: '1',
    b: '2',
    stopKind: 'iterations' as StopKind,
    stopValue: '6',
  },
  newton: {
    expression: 'x^3 - x - 1',
    x0: '1.5',
    derivativeMode: 'auto' as NewtonDerivativeMode,
    derivative: '',
    stopKind: 'iterations' as StopKind,
    stopValue: '6',
  },
  fixedPoint: {
    expression: 'cos(x)',
    p0: '1',
    stopKind: 'iterations' as StopKind,
    stopValue: '8',
  },
};

export function QuickSetupPanel({ onRun }: QuickSetupPanelProps) {
  const [method, setMethod] = useState<QuickSetupMethod>('bisection');
  const [bisection, setBisection] = useState(DEFAULTS.bisection);
  const [newton, setNewton] = useState(DEFAULTS.newton);
  const [fixedPoint, setFixedPoint] = useState(DEFAULTS.fixedPoint);

  const selectedLabel = QUICK_METHODS.find((entry) => entry.id === method)?.label ?? 'Bisection';
  const canRun = useMemo(() => {
    if (method === 'bisection') {
      return bisection.expression.trim() && bisection.a.trim() && bisection.b.trim() && bisection.stopValue.trim();
    }
    if (method === 'newton') {
      return newton.expression.trim() && newton.x0.trim() && newton.stopValue.trim();
    }
    return fixedPoint.expression.trim() && fixedPoint.p0.trim() && fixedPoint.stopValue.trim();
  }, [bisection, fixedPoint, method, newton]);

  const run = () => {
    if (!canRun) return;

    if (method === 'bisection') {
      onRun('bisection', {
        'root-bis-expression': bisection.expression,
        'root-bis-a': bisection.a,
        'root-bis-b': bisection.b,
        'root-bis-scan-enabled': 'no',
        'root-bis-stop-kind': bisection.stopKind,
        'root-bis-stop-value': bisection.stopValue,
        'root-bis-tolerance-type': 'absolute',
      });
      return;
    }

    if (method === 'newton') {
      onRun('newton', {
        'root-newton-expression': newton.expression,
        'root-newton-df': newton.derivativeMode === 'auto' ? 'auto' : newton.derivative,
        'root-newton-x0': newton.x0,
        'root-newton-a': '',
        'root-newton-b': '',
        'root-newton-initial-strategy': 'manual',
        'root-newton-stop-kind': newton.stopKind,
        'root-newton-stop-value': newton.stopValue,
      });
      return;
    }

    onRun('fixedPoint', {
      'root-fpi-expression': fixedPoint.expression,
      'root-fpi-x0': fixedPoint.p0,
      'root-fpi-target-expression': '',
      'root-fpi-seeds': '',
      'root-fpi-batch-expressions': '',
      'root-fpi-stop-kind': fixedPoint.stopKind,
      'root-fpi-stop-value': fixedPoint.stopValue,
    });
  };

  return (
    <section className="quick-setup-panel" aria-label="Quick Setup">
      <header className="quick-setup-head">
        <div>
          <p className="section-kicker">Manual calculator mode</p>
          <h2>Quick Setup</h2>
        </div>
        <p>Quick Setup is calculator-style. It does not parse full problem statements.</p>
      </header>

      <div className="quick-setup-methods" role="group" aria-label="Quick Setup method">
        {QUICK_METHODS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-label={entry.ariaLabel}
            aria-pressed={method === entry.id}
            onClick={() => setMethod(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="quick-setup-fields" aria-label={`${selectedLabel} Quick Setup fields`}>
        {method === 'bisection' ? (
          <>
            <label className="field-row">
              <span>f(x)</span>
              <input
                className="field-control numeric-value"
                aria-label="Quick Setup Bisection f(x)"
                value={bisection.expression}
                onChange={(event) => setBisection((current) => ({ ...current, expression: event.target.value }))}
              />
            </label>
            <div className="quick-setup-inline">
              <label className="field-row">
                <span>a</span>
                <input
                  className="field-control numeric-value"
                  aria-label="Quick Setup Bisection a"
                  value={bisection.a}
                  onChange={(event) => setBisection((current) => ({ ...current, a: event.target.value }))}
                />
              </label>
              <label className="field-row">
                <span>b</span>
                <input
                  className="field-control numeric-value"
                  aria-label="Quick Setup Bisection b"
                  value={bisection.b}
                  onChange={(event) => setBisection((current) => ({ ...current, b: event.target.value }))}
                />
              </label>
            </div>
          </>
        ) : null}

        {method === 'newton' ? (
          <>
            <label className="field-row">
              <span>f(x)</span>
              <input
                className="field-control numeric-value"
                aria-label="Quick Setup Newton-Raphson f(x)"
                value={newton.expression}
                onChange={(event) => setNewton((current) => ({ ...current, expression: event.target.value }))}
              />
            </label>
            <label className="field-row">
              <span>x0</span>
              <input
                className="field-control numeric-value"
                aria-label="Quick Setup Newton-Raphson x0"
                value={newton.x0}
                onChange={(event) => setNewton((current) => ({ ...current, x0: event.target.value }))}
              />
            </label>
            <div className="segmented-row">
              <span>Derivative</span>
              <div className="segment">
                <button
                  type="button"
                  className={newton.derivativeMode === 'auto' ? 'active' : ''}
                  onClick={() => setNewton((current) => ({ ...current, derivativeMode: 'auto' }))}
                >
                  Auto
                </button>
                <button
                  type="button"
                  className={newton.derivativeMode === 'provided' ? 'active' : ''}
                  onClick={() => setNewton((current) => ({ ...current, derivativeMode: 'provided' }))}
                >
                  Provided
                </button>
              </div>
            </div>
            {newton.derivativeMode === 'provided' ? (
              <label className="field-row">
                <span>f'(x)</span>
                <input
                  className="field-control numeric-value"
                  aria-label="Quick Setup Newton-Raphson derivative"
                  placeholder="3x^2 - 1"
                  value={newton.derivative}
                  onChange={(event) => setNewton((current) => ({ ...current, derivative: event.target.value }))}
                />
              </label>
            ) : null}
          </>
        ) : null}

        {method === 'fixedPoint' ? (
          <>
            <label className="field-row">
              <span>g(x)</span>
              <input
                className="field-control numeric-value"
                aria-label="Quick Setup Fixed Point g(x)"
                value={fixedPoint.expression}
                onChange={(event) => setFixedPoint((current) => ({ ...current, expression: event.target.value }))}
              />
            </label>
            <label className="field-row">
              <span>p0</span>
              <input
                className="field-control numeric-value"
                aria-label="Quick Setup Fixed Point p0"
                value={fixedPoint.p0}
                onChange={(event) => setFixedPoint((current) => ({ ...current, p0: event.target.value }))}
              />
            </label>
          </>
        ) : null}

        <div className="quick-setup-inline">
          <label className="field-row">
            <span>Stop by</span>
            <select
              className="field-control"
              aria-label={`Quick Setup ${selectedLabel} stop by`}
              value={
                method === 'bisection'
                  ? bisection.stopKind
                  : method === 'newton'
                    ? newton.stopKind
                    : fixedPoint.stopKind
              }
              onChange={(event) => {
                const value = event.target.value as StopKind;
                if (method === 'bisection') setBisection((current) => ({ ...current, stopKind: value }));
                if (method === 'newton') setNewton((current) => ({ ...current, stopKind: value }));
                if (method === 'fixedPoint') setFixedPoint((current) => ({ ...current, stopKind: value }));
              }}
            >
              <option value="iterations">Iterations</option>
              <option value="epsilon">Tolerance</option>
            </select>
          </label>
          <label className="field-row">
            <span>{method === 'bisection' ? 'tolerance or n' : 'tolerance or iterations'}</span>
            <input
              className="field-control numeric-value"
              aria-label={`Quick Setup ${selectedLabel} stop value`}
              value={
                method === 'bisection'
                  ? bisection.stopValue
                  : method === 'newton'
                    ? newton.stopValue
                    : fixedPoint.stopValue
              }
              onChange={(event) => {
                const value = event.target.value;
                if (method === 'bisection') setBisection((current) => ({ ...current, stopValue: value }));
                if (method === 'newton') setNewton((current) => ({ ...current, stopValue: value }));
                if (method === 'fixedPoint') setFixedPoint((current) => ({ ...current, stopValue: value }));
              }}
            />
          </label>
        </div>
      </div>

      <Button className="run-primary quick-setup-run" disabled={!canRun} onClick={run}>
        <Play aria-hidden="true" className="size-4" />
        Run Table
      </Button>
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck and confirm missing import wiring only after Task 4**

Run:

```powershell
npm run typecheck
```

Expected: PASS because the component is self-contained and not imported yet.

---

### Task 4: Wire Quick Setup Into the App and Rename Suspicious UI Copy

**Files:**
- Modify: `new-migration/roots-react-workbench/src/App.tsx`
- Modify: `new-migration/roots-react-workbench/src/components/QuickCommandMenu.tsx`

- [ ] **Step 1: Import `QuickSetupPanel`**

In `src/App.tsx`, add:

```ts
import { QuickSetupPanel } from './components/QuickSetupPanel';
```

- [ ] **Step 2: Destructure `runQuickSetup` from the hook**

In the `useRootsWorkbench()` destructuring, add:

```ts
runQuickSetup,
```

- [ ] **Step 3: Render Quick Setup inside Equation Studio**

Place this between the `workflow-heading` block and `MethodForm`:

```tsx
<QuickSetupPanel onRun={runQuickSetup} />
```

- [ ] **Step 4: Rename toolbar copy from Quick command to Quick Setup**

In `src/App.tsx`, change the toolbar button visible text:

```tsx
<span>Quick Setup</span>
```

Keep the button class as `quick-command` to avoid unrelated CSS churn.

- [ ] **Step 5: Rename popover labels without changing preset behavior**

In `src/components/QuickCommandMenu.tsx`, change UI text and aria label:

```tsx
<section className="utility-popover preset-popover" aria-label="Quick Setup presets">
```

```tsx
<p className="section-kicker">Quick Setup</p>
<h2>Load a manual starter</h2>
```

This keeps existing starter examples available while removing the suspicious command wording. The in-studio Quick Setup remains the manual-input path required by the spec.

- [ ] **Step 6: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

---

### Task 5: Add Quick Setup Styles

**Files:**
- Modify: `new-migration/roots-react-workbench/src/styles.css`

- [ ] **Step 1: Add base panel styles near `.studio-form`**

Insert after the `.studio-form` rule:

```css
.quick-setup-panel {
  display: grid;
  gap: var(--space-md);
  margin: var(--space-lg) 0 var(--space-xl);
  padding: var(--space-lg);
  border: 1px solid var(--line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-muted), transparent 38%);
}

.quick-setup-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-xs);
}

.quick-setup-head h2 {
  margin: 3px 0 0;
  color: var(--ink);
  font-size: 1rem;
  font-weight: 720;
  line-height: 1.2;
}

.quick-setup-head p {
  margin: 0;
}

.quick-setup-head > p {
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.35;
}

.quick-setup-methods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-raised);
}

.quick-setup-methods button {
  min-height: 38px;
  border: 0;
  border-left: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  padding: 0 var(--space-sm);
  font-size: 0.82rem;
  font-weight: 680;
}

.quick-setup-methods button:first-child {
  border-left: 0;
}

.quick-setup-methods button[aria-pressed="true"] {
  background: var(--action-blue);
  color: var(--surface-raised);
}

.quick-setup-fields {
  display: grid;
  gap: var(--space-md);
}

.quick-setup-inline {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.quick-setup-panel .field-row {
  grid-template-columns: 1fr;
  gap: 6px;
}

.quick-setup-run {
  justify-self: start;
  min-width: 160px;
}
```

- [ ] **Step 2: Add responsive adjustment near existing mobile styles**

Near the mobile rules that adjust `.parameter-grid` or `.field-row`, add:

```css
@media (max-width: 720px) {
  .quick-setup-methods,
  .quick-setup-inline {
    grid-template-columns: 1fr;
  }

  .quick-setup-methods button {
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  .quick-setup-methods button:first-child {
    border-top: 0;
  }
}
```

- [ ] **Step 3: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

---

### Task 6: Make Tests Pass and Preserve Existing Engine Behavior

**Files:**
- Modify: `new-migration/roots-react-workbench/tests/app-smoke.spec.ts`
- Possibly modify: `new-migration/roots-react-workbench/tests/modern-engine-smoke.spec.ts`
- Possibly modify: `new-migration/roots-react-workbench/tests/engine-comparison.spec.ts`

- [ ] **Step 1: Run the updated app smoke test**

Run:

```powershell
npm run test:e2e -- tests/app-smoke.spec.ts
```

Expected: PASS after Tasks 2-5. If strict text like `Final approximation` differs, use the exact existing result label visible in `AnswerPanel` rather than weakening the test to a broad page text match.

- [ ] **Step 2: Run unit tests**

Run:

```powershell
npm run test:unit
```

Expected: PASS. Failures in engine tests mean the implementation accidentally touched calculation behavior and must be corrected without editing engine files.

- [ ] **Step 3: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run full e2e**

Run:

```powershell
npm run test:e2e
```

Expected: PASS. Existing Legacy default assertions must remain true.

- [ ] **Step 5: Run comparison e2e**

Run:

```powershell
npm run test:e2e:comparison
```

Expected: PASS.

- [ ] **Step 6: Run Modern engine smoke under environment override**

Run:

```powershell
$env:VITE_ROOT_ENGINE='modern'; $env:CI='1'; npx playwright test tests/modern-engine-smoke.spec.ts
```

Expected: PASS. Modern beta should be active only because the environment variable requests it.

---

### Task 7: Final Review and Commit

**Files:**
- Review all changed files from Tasks 1-6.

- [ ] **Step 1: Confirm forbidden paths stayed untouched**

Run:

```powershell
git diff --name-only
```

Expected output must not include:

```text
legacy-static/
new-migration/roots-react-workbench/root-engine.js
new-migration/roots-react-workbench/expression-engine.js
new-migration/roots-react-workbench/public/legacy/
```

- [ ] **Step 2: Inspect final diff**

Run:

```powershell
git diff -- src/App.tsx src/hooks/useRootsWorkbench.ts src/components/QuickSetupPanel.tsx src/components/QuickCommandMenu.tsx src/styles.css tests/app-smoke.spec.ts
```

Expected: UI/state/test changes only. No numerical method formulas or engine adapters should change except calling the existing `runSelectedRootMethod` path from `runQuickSetup`.

- [ ] **Step 3: Commit implementation**

Run:

```powershell
git add new-migration/roots-react-workbench/src/App.tsx new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts new-migration/roots-react-workbench/src/components/QuickSetupPanel.tsx new-migration/roots-react-workbench/src/components/QuickCommandMenu.tsx new-migration/roots-react-workbench/src/styles.css new-migration/roots-react-workbench/tests/app-smoke.spec.ts
git commit -m "Add manual Quick Setup mode"
```

- [ ] **Step 4: Prepare handoff**

Report:

```text
Files changed:
- ...

Quick Setup behavior:
- Manual compact setup inside Equation Studio.
- Bisection, Newton-Raphson, and Fixed Point write to existing method forms and run existing table/result pipeline.
- No OCR, PDF import, paste-question UI, or prompt parser.

Tests updated:
- ...

Verification:
- npm run test:unit: ...
- npm run typecheck: ...
- npm run test:e2e: ...
- npm run test:e2e:comparison: ...
- modern engine smoke command: ...

Branch:
- ...

Commit:
- ...

Legacy archive:
- legacy-static untouched.
```

---

## Self-Review

Spec coverage:

- Manual-only Quick Setup: covered by Tasks 3 and 4.
- Compact Bisection/Newton/Fixed Point forms: covered by Task 3.
- Existing generated outputs: covered by using `runSelectedRootMethod` in Task 2 and not adding direct solver logic.
- Note text: covered by Task 3.
- No OCR/PDF/paste/problem parser/Professor Problem Solver: covered by Tasks 1, 3, and 7.
- Modern beta remains opt-in: covered by Tasks 6 and 7.
- Forbidden files untouched: covered by Task 7.

Placeholder scan:

- The plan contains no unfinished markers or unspecified implementation steps.

Type consistency:

- `runQuickSetup(method, values)` uses existing `RootMethod` and `MethodFormState`.
- Quick Setup method ids map to existing `RootMethod` values: `bisection`, `newton`, and `fixedPoint`.
- Field ids match `METHOD_CONFIGS` and existing adapter inputs.
