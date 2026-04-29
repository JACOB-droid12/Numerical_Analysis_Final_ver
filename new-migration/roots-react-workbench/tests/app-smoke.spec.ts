import { expect, test } from '@playwright/test';

const DEFAULT_ENGINE = process.env.VITE_ROOT_ENGINE === 'legacy' ? 'legacy' : 'modern';
const MODERN_LABEL = 'Modern engine';
const LEGACY_LABEL = 'Legacy compatibility fallback';
const MODERN_NOTE =
  'Modern engine is the default. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.';
const LEGACY_NOTE =
  'Legacy compatibility fallback is retained for strict stepwise machine-arithmetic behavior and compatibility checks.';
const MODERN_PRECISION_NOTE =
  'Modern engine: Digits and Rule format displayed final root, table, and CSV values. Some Modern methods support method-level precision behavior, but strict stepwise Legacy arithmetic remains available through Legacy compatibility fallback.';
const LEGACY_PRECISION_NOTE =
  'Legacy compatibility fallback: Digits and Rule affect legacy calculation behavior. This fallback is retained for strict stepwise machine-arithmetic compatibility.';

test('loads, calculates, opens utilities, and keeps non-Newton formula scoped', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Answer workstation' })).toBeVisible();
  await expect(page.getByText('Engine ready')).toBeVisible();
  const toolbar = page.getByRole('navigation', { name: 'Application controls' });
  await expect(toolbar.getByText('Quick Setup')).toHaveCount(0);
  await expect(toolbar.getByRole('button', { name: /Load preset/ })).toBeVisible();
  await expect(toolbar.getByText(LEGACY_LABEL)).toHaveCount(0);
  await expect(toolbar.getByText(MODERN_LABEL)).toHaveCount(0);
  await expect(page.getByRole('button', { name: LEGACY_LABEL })).not.toBeVisible();
  await expect(page.getByRole('button', { name: MODERN_LABEL })).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Advanced/testing' }).click();
  await expect(page.getByLabel('Root engine selector')).toContainText('Engine mode:');
  await expect(page.getByRole('button', { name: DEFAULT_ENGINE === 'modern' ? MODERN_LABEL : LEGACY_LABEL })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(DEFAULT_ENGINE === 'modern' ? MODERN_NOTE : LEGACY_NOTE)).toBeVisible();
  await expect(page.getByText('Modern engine is active.')).toHaveCount(DEFAULT_ENGINE === 'modern' ? 1 : 0);
  await expect(page.getByLabel('Classroom project helpers')).toBeVisible();
  await expect(page.getByText('Precision / Machine Arithmetic')).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Classroom tools' }).click();
  await expect(page.getByLabel('Classroom project helpers')).toContainText(
    DEFAULT_ENGINE === 'modern' ? MODERN_PRECISION_NOTE : LEGACY_PRECISION_NOTE,
  );

  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('heading', { name: 'Newton-Raphson' })).toBeVisible();
  await page.getByRole('button', { name: 'Close help' }).click();

  await toolbar.getByRole('button', { name: /Load preset/ }).click();
  await expect(page.getByLabel('Method presets')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Load preset' })).toBeVisible();
  await page.getByRole('button', { name: 'Close presets' }).click();

  await expect(page.locator('summary').filter({ hasText: 'Quick Setup' })).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Quick Setup' }).click();
  await expect(page.getByRole('heading', { name: 'Quick Setup' })).toBeVisible();
  await expect(
    page.getByText('Quick Setup is calculator-style. It does not parse full problem statements.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: /paste/i })).toHaveCount(0);
  await expect(page.getByText(/paste.*question/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'Bisection quick setup' }).click();
  await page.getByLabel('Quick Setup Bisection f(x)').fill('x^3 - x - 1');
  await page.getByLabel('Quick Setup Bisection a').fill('1');
  await page.getByLabel('Quick Setup Bisection b').fill('2');
  await page.getByLabel('Quick Setup Bisection stop value').fill('6');
  await page.getByRole('button', { name: 'Run Table' }).click();

  const methodPicker = page.getByLabel('Root method picker');
  await expect(methodPicker.getByRole('button', { name: 'Bisection', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Method: Bisection')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Graph' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Method View' })).toBeVisible();
  await page.getByRole('tab', { name: 'Graph' }).click();
  const graphPanel = page.locator('.graph-panel').first();
  const graphMode = page.getByRole('group', { name: 'Graph mode' });
  await expect(graphMode).toBeVisible();
  await expect(graphMode.getByRole('button', { name: 'Approximation' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Root estimate by iteration.')).toBeVisible();
  await expect(graphPanel.locator('svg text').filter({ hasText: 'Iteration' })).toBeVisible();
  await expect(graphPanel.locator('svg text').filter({ hasText: 'Root estimate' })).toBeVisible();
  await expect(graphPanel.locator('circle title').first()).toContainText('Iteration 1 - Approximation:');
  await expect(graphPanel.getByText(/plotted points\. First:/)).toBeVisible();
  await graphMode.getByRole('button', { name: 'Approx. Error' }).click();
  await expect(page.getByText('Approximation error by iteration.')).toBeVisible();
  await expect(graphPanel.locator('svg text').filter({ hasText: 'Approximation error' })).toBeVisible();
  await expect(graphPanel.locator('circle title').first()).toContainText(/Iteration \d+ - Approx\. Error:/);
  await graphMode.getByRole('button', { name: 'Residual' }).click();
  await expect(page.getByText('Residual / |f(pₙ)| by iteration.')).toBeVisible();
  await expect(graphPanel.locator('svg text').filter({ hasText: 'Residual / |f(pₙ)|' })).toBeVisible();
  await page.getByRole('tab', { name: 'Method View' }).click();
  const methodView = page.getByLabel('Bisection Method View');
  await expect(methodView.getByRole('heading', { name: 'Bisection Method View' })).toBeVisible();
  const methodViewDetails = page.getByLabel('Bisection Method View details');
  await expect(methodViewDetails.getByText('Current interval [a_n, b_n]')).toBeVisible();
  await expect(methodViewDetails.getByText(/Kept interval/)).toBeVisible();
  await expect(methodView.locator('svg text').filter({ hasText: 'a_n' })).toBeVisible();
  await expect(methodView.locator('svg text').filter({ hasText: 'p_n' })).toBeVisible();

  await page.getByRole('button', { name: 'Newton-Raphson quick setup' }).click();
  await page.getByLabel('Quick Setup Newton-Raphson f(x)').fill('x^3 - x - 1');
  await page.getByLabel('Quick Setup Newton-Raphson x0').fill('1.5');
  await page.getByLabel('Quick Setup Newton-Raphson stop value').fill('6');
  await page.getByRole('button', { name: 'Run Table' }).click();

  await expect(methodPicker.getByRole('button', { name: 'Newton-Raphson', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Method: Newton-Raphson')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Table' })).toBeVisible();

  await page.getByRole('button', { name: 'Run method' }).click();
  await expect(page.getByLabel('Calculator display')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
  await expect(page.getByText('Method: Newton-Raphson')).toBeVisible();

  await methodPicker.getByRole('button', { name: 'Bisection', exact: true }).click();
  await expect(page.getByText('Bracket signs')).toBeVisible();
  await expect(page.getByText('Bisection helper')).toBeVisible();
  await expect(page.getByText('Fixed Point Comparison')).not.toBeVisible();
  await page.getByRole('button', { name: 'Run bisection' }).click();

  await expect(page.getByText('Method: Bisection')).toBeVisible();
  await page.getByRole('tab', { name: 'Steps' }).click();
  const solutionPanel = page.locator('.solution-panel');
  await expect(solutionPanel).toContainText('Bisection midpoint formula:');
  await expect(solutionPanel).toContainText('pₙ = aₙ + (bₙ − aₙ)/2');
  await expect(solutionPanel).toContainText('f(a) = -1');
  await expect(solutionPanel).toContainText('sgn(f(a)) = -');
  await expect(solutionPanel).toContainText('f(b) = 5');
  await expect(solutionPanel).toContainText('sgn(f(b)) = +');
  await expect(solutionPanel).toContainText('sgn(f(a))sgn(f(b)) < 0');
  await expect(solutionPanel).toContainText('Intermediate Value Theorem guarantees a root in [1, 2]');
  await expect(solutionPanel).toContainText('sgn(f(aₙ))sgn(f(pₙ)) < 0');
  await expect(solutionPanel).not.toContainText('Newton-Raphson iteration formula:');
});

test('demo loaders fill fields without running calculations or adding parser UI', async ({ page }) => {
  await page.goto('/');

  await page.locator('summary').filter({ hasText: 'Quick Setup' }).click();
  await expect(
    page.getByText('Examples only fill inputs. You still choose when to run the calculation.').first(),
  ).toBeVisible();
  await expect(page.getByText(/OCR|PDF import|paste-question|problem parser|Professor Problem Solver/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'Load Bisection demo' }).click();
  await expect(page.getByRole('button', { name: 'Bisection quick setup' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Quick Setup Bisection f(x)')).toHaveValue('x^3 + 4*x^2 - 10');
  await expect(page.getByLabel('Quick Setup Bisection a')).toHaveValue('1');
  await expect(page.getByLabel('Quick Setup Bisection b')).toHaveValue('2');
  await expect(page.getByLabel('Quick Setup Bisection stop value')).toHaveValue('12');
  await expect(page.getByText('Approximate root', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Load Newton demo' }).click();
  await expect(page.getByRole('button', { name: 'Newton-Raphson quick setup' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Quick Setup Newton-Raphson f(x)')).toHaveValue('x^2 - 2');
  await expect(page.getByLabel('Quick Setup Newton-Raphson x0')).toHaveValue('1');
  await expect(page.getByLabel('Quick Setup Newton-Raphson derivative')).toHaveValue('2*x');
  await expect(page.getByLabel('Quick Setup Newton-Raphson stop value')).toHaveValue('8');
  await expect(page.getByText('Approximate root', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Load False Position demo' }).click();
  await expect(page.getByRole('button', { name: 'False Position quick setup' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('False Position requires f(a) and f(b) to have opposite signs.')).toBeVisible();
  await expect(page.getByLabel('Quick Setup False Position f(x)')).toHaveValue('x^2 - 4');
  await expect(page.getByLabel('Quick Setup False Position a')).toHaveValue('0');
  await expect(page.getByLabel('Quick Setup False Position b')).toHaveValue('3');
  await expect(page.getByText('Approximate root', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Load Secant demo' }).click();
  await expect(page.getByRole('button', { name: 'Secant quick setup' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Secant uses two starting guesses.')).toBeVisible();
  await expect(page.getByLabel('Quick Setup Secant f(x)')).toHaveValue('x^3 - x - 1');
  await expect(page.getByLabel('Quick Setup Secant x0')).toHaveValue('1');
  await expect(page.getByLabel('Quick Setup Secant x1')).toHaveValue('2');
  await expect(page.getByText('Approximate root', { exact: true })).toHaveCount(0);

  const methodPicker = page.getByLabel('Root method picker');
  await methodPicker.getByRole('button', { name: 'Fixed Point', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Classroom tools' }).click();
  const panel = page.getByLabel('Fixed Point Comparison tool');
  await page.getByRole('button', { name: 'Load Fixed Point comparison demo' }).click();
  await expect(panel.getByLabel('Fixed Point Comparison p0')).toHaveValue('1');
  await expect(panel.getByLabel('Fixed Point Comparison target value')).toHaveValue('21^(1/3)');
  await expect(panel.getByLabel('Formula (a) g(x)')).toHaveValue('(20*x + 21 / x^2) / 21');
  await expect(panel.getByLabel('Formula (b) g(x)')).toHaveValue('x - (x^3 - 21) / (3*x^2)');
  await expect(panel.getByLabel('Formula (c) g(x)')).toHaveValue('x - (x^3 - 21*x) / (x^2 - 21)');
  await expect(panel.getByLabel('Formula (d) g(x)')).toHaveValue('sqrt(21 / x)');
  await expect(panel.getByText(/Ranking:/)).toHaveCount(0);
});

test('quick setup runs false position and secant through Run Table', async ({ page }) => {
  await page.goto('/');

  await page.locator('summary').filter({ hasText: 'Quick Setup' }).click();
  await expect(page.getByText(/OCR|PDF import|paste-question|problem parser|Professor Problem Solver/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'False Position quick setup' }).click();
  await expect(page.getByText('False Position requires f(a) and f(b) to have opposite signs.')).toBeVisible();
  await page.getByLabel('Quick Setup False Position f(x)').fill('x^2 - 4');
  await page.getByLabel('Quick Setup False Position a').fill('0');
  await page.getByLabel('Quick Setup False Position b').fill('3');
  await page.getByLabel('Quick Setup False Position stop value').fill('8');
  await page.getByRole('button', { name: 'Run Table' }).click();

  const methodPicker = page.getByLabel('Root method picker');
  await expect(methodPicker.getByRole('button', { name: 'False Position', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Method: False Position')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Secant quick setup' }).click();
  await expect(page.getByText('Secant uses two starting guesses.')).toBeVisible();
  await page.getByLabel('Quick Setup Secant f(x)').fill('x^3 - x - 1');
  await page.getByLabel('Quick Setup Secant x0').fill('1');
  await page.getByLabel('Quick Setup Secant x1').fill('2');
  await page.getByLabel('Quick Setup Secant stop value').fill('6');
  await page.getByRole('button', { name: 'Run Table' }).click();

  await expect(methodPicker.getByRole('button', { name: 'Secant', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Method: Secant')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
});

test('compares manually entered fixed-point formulas in classroom tools', async ({ page }) => {
  await page.goto('/');

  const methodPicker = page.getByLabel('Root method picker');
  await methodPicker.getByRole('button', { name: 'Fixed Point', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Classroom tools' }).click();

  const panel = page.getByLabel('Fixed Point Comparison tool');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('This tool compares manually entered fixed-point formulas. It does not parse full problem statements.');
  await expect(page.getByRole('textbox', { name: /paste/i })).toHaveCount(0);
  await expect(page.getByText(/problem parser|Professor Problem Solver|OCR|PDF import/i)).toHaveCount(0);

  await page.getByLabel('Fixed Point Comparison p0').fill('1');
  await page.getByLabel('Fixed Point Comparison tolerance').fill('1e-8');
  await page.getByLabel('Fixed Point Comparison max iterations').fill('120');
  await page.getByLabel('Fixed Point Comparison target value').fill('2.7589241763811208');
  await page.getByLabel('Formula (a) g(x)').fill('(20*x + 21 / x^2) / 21');
  await page.getByLabel('Formula (b) g(x)').fill('x - (x^3 - 21) / (3*x^2)');
  await page.getByLabel('Formula (c) g(x)').fill('x - (x^3 - 21*x) / (x^2 - 21)');
  await page.getByLabel('Formula (d) g(x)').fill('sqrt(21 / x)');
  await page.getByRole('button', { name: 'Compare formulas' }).click();

  await expect(panel.getByRole('columnheader', { name: 'n', exact: true })).toBeVisible();
  await expect(panel.getByRole('columnheader', { name: '(a)', exact: true })).toBeVisible();
  await expect(panel.getByRole('columnheader', { name: '(b)', exact: true })).toBeVisible();
  await expect(panel.getByText('Ranking: (b), (d), (a), (c)')).toBeVisible();
  await expect(panel.getByText('(b): converged')).toBeVisible();
  await expect(panel.getByText('(c): slow')).toBeVisible();

  await page.getByLabel('Formula (c) g(x)').fill('');
  await page.getByRole('button', { name: 'Compare formulas' }).click();
  await expect(panel.getByRole('columnheader', { name: '(c)', exact: true })).toHaveCount(0);
  await expect(panel.getByText('Ranking: (b), (d), (a)')).toBeVisible();

  await page.locator('[name="root-fpi-expression"]').fill('cos(x)');
  await page.locator('[name="root-fpi-x0"]').fill('1');
  await page.getByRole('button', { name: 'Run fixed-point iteration' }).click();
  await expect(page.getByText('Method: Fixed Point')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
});

test('switches between Modern engine and Legacy compatibility fallback without losing form values', async ({ page }) => {
  await page.goto('/');

  await page.locator('summary').filter({ hasText: 'Advanced/testing' }).click();
  await page.getByRole('button', { name: MODERN_LABEL }).click();
  await expect(page.getByRole('button', { name: MODERN_LABEL })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(MODERN_NOTE)).toBeVisible();
  await expect(page.getByText('Modern engine is active.')).toBeVisible();

  await page
    .getByLabel('Root method picker')
    .getByRole('button', { name: 'Bisection', exact: true })
    .click();
  await page.locator('[name="root-bis-expression"]').fill('x^3 - x - 1');
  await page.locator('[name="root-bis-a"]').fill('1');
  await page.locator('[name="root-bis-b"]').fill('2');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(page.getByText('Method: Bisection')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: LEGACY_LABEL }).click();
  await expect(page.getByRole('button', { name: LEGACY_LABEL })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(LEGACY_NOTE)).toBeVisible();
  await expect(page.getByText('Modern engine is active.')).not.toBeVisible();
  await expect(page.locator('[name="root-bis-expression"]')).toHaveValue('x^3 - x - 1');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(page.getByText('Method: Bisection')).toBeVisible();

  await page.getByRole('button', { name: MODERN_LABEL }).click();
  await expect(page.getByRole('button', { name: MODERN_LABEL })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[name="root-bis-expression"]')).toHaveValue('x^3 - x - 1');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(page.getByText('Method: Bisection')).toBeVisible();
});
