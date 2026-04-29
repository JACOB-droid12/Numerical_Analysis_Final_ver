import { expect, type Page, test } from '@playwright/test';

test.skip(
  process.env.VITE_ROOT_ENGINE === 'legacy',
  'Modern engine smoke runs when the default or explicit Modern engine is active.',
);

const MODERN_LABEL = 'Modern engine';
const LEGACY_LABEL = 'Legacy compatibility fallback';
const MODERN_NOTE =
  'Modern engine is the default. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.';
const LEGACY_NOTE =
  'Legacy compatibility fallback is retained for strict stepwise machine-arithmetic behavior and compatibility checks.';
const MODERN_PRECISION_NOTE =
  'Modern engine: Digits and Rule format displayed final root, table, and CSV values. Some Modern methods support method-level precision behavior, but strict stepwise Legacy arithmetic remains available through Legacy compatibility fallback.';

async function setField(page: Page, name: string, value: string) {
  await page.locator(`[name="${name}"]`).fill(value);
}

async function setIterations(page: Page, stopValueField: string, iterations: string) {
  await page.getByText('Computation settings').click();
  await setField(page, stopValueField, iterations);
}

async function selectMethod(page: Page, label: string) {
  await page
    .getByLabel('Root method picker')
    .getByRole('button', { name: label, exact: true })
    .click();
}

async function runCurrentMethod(page: Page, label: string | RegExp) {
  await page.getByRole('button', { name: label }).click();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
}

async function openClassroomTools(page: Page) {
  const classroomCopy = page.getByText(
    MODERN_PRECISION_NOTE,
  );
  if (!(await classroomCopy.isVisible().catch(() => false))) {
    await page.locator('summary').filter({ hasText: 'Classroom tools' }).click();
  }
}

async function openAdvancedTesting(page: Page) {
  const engineSelector = page.getByLabel('Root engine selector');
  if (!(await engineSelector.isVisible().catch(() => false))) {
    await page.locator('summary').filter({ hasText: 'Advanced/testing' }).click();
  }
}

async function expectMethodResult(page: Page, methodLabel: string, expectedRoot?: number) {
  await expect(page.getByLabel('Calculator display')).toBeVisible();
  await expect(page.getByText(`Method: ${methodLabel}`)).toBeVisible();

  if (expectedRoot == null) {
    return;
  }

  const rootText = await page.locator('.answer-hero-major .answer-root').innerText();
  const root = Number(rootText);
  expect(Number.isFinite(root)).toBe(true);
  expect(root).toBeCloseTo(expectedRoot, 4);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Answer workstation' })).toBeVisible();
  await expect(page.getByText('Engine ready')).toBeVisible();
});

test('loads the workbench in modern engine mode without crashing', async ({ page }) => {
  await expect(page.getByLabel('Root method picker')).toBeVisible();
  await expect(page.getByLabel('Equation studio')).toBeVisible();
  await expect(page.getByLabel('Result console')).toBeVisible();
  await expect(page.getByLabel('Classroom project helpers')).toBeVisible();
  const toolbar = page.getByRole('navigation', { name: 'Application controls' });
  await expect(toolbar.getByText(MODERN_LABEL)).toHaveCount(0);
  await openAdvancedTesting(page);
  await expect(page.getByRole('button', { name: MODERN_LABEL })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(MODERN_NOTE)).toBeVisible();
  await expect(page.getByText('Modern engine is active.')).toBeVisible();
});

test('runs Bisection on x^3 - x - 1', async ({ page }) => {
  await selectMethod(page, 'Bisection');
  await setField(page, 'root-bis-expression', 'x^3 - x - 1');
  await setField(page, 'root-bis-a', '1');
  await setField(page, 'root-bis-b', '2');
  await setIterations(page, 'root-bis-stop-value', '30');
  await openClassroomTools(page);

  await expect(page.getByText('IVT bracket')).toBeVisible();
  await expect(page.getByText('Satisfied')).toBeVisible();
  await expect(page.getByText('N = ceil(log₂((b - a) / ε)):')).toBeVisible();
  await runCurrentMethod(page, 'Run bisection');
  await expectMethodResult(page, 'Bisection', 1.324717957);
  await page.getByRole('tab', { name: 'Table' }).click();
  await expect(page.getByRole('columnheader', { name: 'aₙ', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'pₙ', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'f(pₙ)', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Approx. Error', exact: true })).toBeVisible();
});

test('shows Modern Bisection exact, machine, and both sign evidence', async ({ page }) => {
  await selectMethod(page, 'Bisection');
  await setField(page, 'root-bis-expression', 'x^3 - x - 1');
  await setField(page, 'root-bis-a', '1');
  await setField(page, 'root-bis-b', '2');
  await page.getByLabel('Signs shown').selectOption('exact');

  await runCurrentMethod(page, 'Run bisection');
  const solutionPanel = page.locator('.solution-panel');
  await expect(solutionPanel).toContainText('sgn_exact(f(aₙ))');
  await expect(solutionPanel).not.toContainText('sgn_machine(f(aₙ))');

  await page.getByLabel('Signs shown').selectOption('machine');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(solutionPanel).toContainText('sgn_machine(f(aₙ))');
  await expect(solutionPanel).not.toContainText('sgn_exact(f(aₙ))');

  await page.getByLabel('Signs shown').selectOption('both');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(solutionPanel).toContainText('sgn_exact(f(aₙ))');
  await expect(solutionPanel).toContainText('sgn_machine(f(aₙ))');
});

test('runs False Position on x^2 - 4', async ({ page }) => {
  await selectMethod(page, 'False Position');
  await setField(page, 'root-fp-expression', 'x^2 - 4');
  await setField(page, 'root-fp-a', '0');
  await setField(page, 'root-fp-b', '3');
  await setIterations(page, 'root-fp-stop-value', '30');

  await runCurrentMethod(page, 'Run false position');
  await expectMethodResult(page, 'False Position', 2);
});

test('shows Modern False Position exact, machine, and both sign evidence', async ({ page }) => {
  await selectMethod(page, 'False Position');
  await setField(page, 'root-fp-expression', 'x^2 - 4');
  await setField(page, 'root-fp-a', '0');
  await setField(page, 'root-fp-b', '3');
  await page.getByLabel('Signs shown').selectOption('exact');

  await runCurrentMethod(page, 'Run false position');
  const solutionPanel = page.locator('.solution-panel');
  await expect(solutionPanel).toContainText('sgn_exact(f(aₙ))');
  await expect(solutionPanel).not.toContainText('sgn_machine(f(aₙ))');

  await page.getByLabel('Signs shown').selectOption('machine');
  await page.getByRole('button', { name: 'Run false position' }).click();
  await expect(solutionPanel).toContainText('sgn_machine(f(aₙ))');
  await expect(solutionPanel).not.toContainText('sgn_exact(f(aₙ))');

  await page.getByLabel('Signs shown').selectOption('both');
  await page.getByRole('button', { name: 'Run false position' }).click();
  await expect(solutionPanel).toContainText('sgn_exact(f(aₙ))');
  await expect(solutionPanel).toContainText('sgn_machine(f(aₙ))');
});

test('runs Secant on x^3 - x - 1', async ({ page }) => {
  await selectMethod(page, 'Secant');
  await setField(page, 'root-secant-expression', 'x^3 - x - 1');
  await setField(page, 'root-secant-x0', '1');
  await setField(page, 'root-secant-x1', '2');

  await runCurrentMethod(page, 'Run secant');
  await expectMethodResult(page, 'Secant', 1.324717957);
});

test('runs Fixed Point on cos(x)', async ({ page }) => {
  await selectMethod(page, 'Fixed Point');
  await setField(page, 'root-fpi-expression', 'cos(x)');
  await setField(page, 'root-fpi-x0', '1');
  await setField(page, 'root-fpi-target-expression', 'x - cos(x)');
  await setIterations(page, 'root-fpi-stop-value', '60');

  await runCurrentMethod(page, 'Run fixed-point iteration');
  await expectMethodResult(page, 'Fixed Point', 0.739085133);
});

test('runs Newton-Raphson with the auto numeric derivative path', async ({ page }) => {
  await setField(page, 'root-newton-expression', 'x^3 - x - 1');
  await setField(page, 'root-newton-df', 'auto');
  await setField(page, 'root-newton-x0', '1.5');

  await runCurrentMethod(page, 'Run method');
  await expectMethodResult(page, 'Newton-Raphson', 1.324717957);
  await page.getByRole('tab', { name: 'Table' }).click();
  await expect(page.getByRole('columnheader', { name: 'f′(pₙ)', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'f(pₙ)/f′(pₙ)', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'pₙ₊₁', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Approx. Error', exact: true })).toBeVisible();
});

test('runs Newton-Raphson with a provided derivative', async ({ page }) => {
  await setField(page, 'root-newton-expression', 'x^2 - 4');
  await setField(page, 'root-newton-df', '2*x');
  await setField(page, 'root-newton-x0', '3');

  await runCurrentMethod(page, 'Run method');
  await expectMethodResult(page, 'Newton-Raphson', 2);
});

test('displays the Modern engine final root with selected rounded precision', async ({ page }) => {
  await setField(page, 'root-newton-expression', 'x^2 - 2');
  await setField(page, 'root-newton-df', '2*x');
  await setField(page, 'root-newton-x0', '1');
  await setIterations(page, 'root-newton-stop-value', '8');

  await runCurrentMethod(page, 'Run method');
  await expect(page.locator('.answer-hero-major .answer-root')).toHaveText('1.4142136');
});

test('uses Computation settings as the only Modern engine precision display control', async ({ page }) => {
  await expect(page.getByText('Precision / Machine Arithmetic')).not.toBeVisible();
  await openClassroomTools(page);
  await expect(page.getByLabel('Classroom project helpers').getByText(MODERN_PRECISION_NOTE)).toBeVisible();

  await page.getByText('Computation settings').click();
  await expect(page.locator('.precision-stack').getByText(MODERN_PRECISION_NOTE)).toBeVisible();
  await expect(page.getByLabel('Digit precision', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Round' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chop' })).toBeVisible();

  await page.getByRole('button', { name: 'Chop' }).click();
  await setField(page, 'root-newton-expression', 'x^2 - 2');
  await setField(page, 'root-newton-df', '2*x');
  await setField(page, 'root-newton-x0', '1');
  await setField(page, 'root-newton-stop-value', '8');

  await runCurrentMethod(page, 'Run method');
  await expect(page.locator('.answer-hero-major .answer-root')).toHaveText('1.4142135');
});

test('shows a clear failure for a bad bracket without crashing', async ({ page }) => {
  await selectMethod(page, 'Bisection');
  await setField(page, 'root-bis-expression', 'x^2 + 1');
  await setField(page, 'root-bis-a', '-1');
  await setField(page, 'root-bis-b', '1');

  await page.getByRole('button', { name: 'Run bisection' }).click();

  await expect(page.locator('.status-text[role="alert"]')).toContainText(/opposite signs|interval/i);
  await expect(page.getByRole('heading', { name: 'Answer workstation' })).toBeVisible();
});

test('can switch from Modern engine back to Legacy compatibility fallback and run after lazy loading legacy scripts', async ({ page }) => {
  await openAdvancedTesting(page);
  await expect(page.getByRole('button', { name: MODERN_LABEL })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: LEGACY_LABEL }).click();
  await expect(page.getByRole('button', { name: LEGACY_LABEL })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(LEGACY_NOTE)).toBeVisible();
  await expect(page.getByText('Modern engine is active.')).not.toBeVisible();

  await selectMethod(page, 'Bisection');
  await setField(page, 'root-bis-expression', 'x^2 - 4');
  await setField(page, 'root-bis-a', '0');
  await setField(page, 'root-bis-b', '3');
  await setIterations(page, 'root-bis-stop-value', '30');

  await runCurrentMethod(page, 'Run bisection');
  await expectMethodResult(page, 'Bisection', 2);
});
