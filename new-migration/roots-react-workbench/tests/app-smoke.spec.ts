import { expect, test } from '@playwright/test';

test('loads, calculates, opens utilities, and keeps non-Newton formula scoped', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Answer workstation' })).toBeVisible();
  await expect(page.getByText('Engine ready')).toBeVisible();
  const toolbar = page.getByRole('navigation', { name: 'Application controls' });
  await expect(toolbar.getByText('Quick Setup')).toHaveCount(0);
  await expect(toolbar.getByRole('button', { name: /Load preset/ })).toBeVisible();
  await expect(toolbar.getByText('Stable')).toHaveCount(0);
  await expect(toolbar.getByText('Modern beta/testing')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Stable' })).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Advanced/testing' }).click();
  await expect(page.getByLabel('Root engine selector')).toContainText('Engine:');
  await expect(page.getByRole('button', { name: 'Stable' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Stable is recommended for class use. Modern beta/testing is experimental and used for comparison.')).toBeVisible();
  await expect(page.getByText('Modern beta/testing is active.')).not.toBeVisible();
  await expect(page.getByLabel('Classroom project helpers')).toBeVisible();
  await expect(page.getByText('Precision / Machine Arithmetic')).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Classroom tools' }).click();
  await expect(page.getByLabel('Classroom project helpers')).toContainText(
    'Stable engine: Digits and Rule affect method calculations.',
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

test('switches from default stable to modern beta/testing and back without losing form values', async ({ page }) => {
  await page.goto('/');

  await page.locator('summary').filter({ hasText: 'Advanced/testing' }).click();
  await expect(page.getByRole('button', { name: 'Stable' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Modern beta/testing' }).click();
  await expect(page.getByRole('button', { name: 'Modern beta/testing' })).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByText('Modern beta/testing uses the new TypeScript + math.js engine for experimental comparison.'),
  ).toBeVisible();
  await expect(page.getByText(/Modern beta\/testing is active/)).toBeVisible();

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

  await page.getByRole('button', { name: 'Stable' }).click();
  await expect(page.getByRole('button', { name: 'Stable' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Stable is recommended for class use. Modern beta/testing is experimental and used for comparison.')).toBeVisible();
  await expect(page.getByText(/Modern beta\/testing is active/)).not.toBeVisible();
  await expect(page.locator('[name="root-bis-expression"]')).toHaveValue('x^3 - x - 1');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(page.getByText('Method: Bisection')).toBeVisible();
});
