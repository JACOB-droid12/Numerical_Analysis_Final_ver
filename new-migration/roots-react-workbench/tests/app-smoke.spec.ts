import { expect, test } from '@playwright/test';

test('loads, calculates, opens utilities, and keeps non-Newton formula scoped', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Answer workstation' })).toBeVisible();
  await expect(page.getByText('Engine ready')).toBeVisible();
  await expect(page.getByLabel('Root engine selector')).toContainText('Engine:');
  await expect(page.getByRole('button', { name: 'Legacy' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Legacy is the default engine used by the current app.')).toBeVisible();
  await expect(page.getByText('Modern beta is active.')).not.toBeVisible();
  await expect(page.getByLabel('Classroom project helpers')).toBeVisible();
  await expect(page.getByText('Precision / Machine Arithmetic')).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Classroom tools' }).click();
  await expect(page.getByText('Digits and Rule are applied during Legacy method calculations.')).toBeVisible();

  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('heading', { name: 'Newton-Raphson' })).toBeVisible();
  await page.getByRole('button', { name: 'Close help' }).click();

  await page.getByRole('button', { name: 'Quick Command' }).click();
  await expect(page.getByRole('heading', { name: 'Load a preset' })).toBeVisible();
  await page.getByRole('button', { name: 'Close presets' }).click();

  await page.getByRole('button', { name: 'Run method' }).click();
  await expect(page.getByLabel('Calculator display')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
  await expect(page.getByText('Method: Newton-Raphson')).toBeVisible();

  await page.getByRole('button', { name: 'Bisection', exact: true }).click();
  await expect(page.getByText('Bracket signs')).toBeVisible();
  await expect(page.getByText('Bisection helper')).toBeVisible();
  await page.getByRole('button', { name: 'Run bisection' }).click();

  await expect(page.getByText('Method: Bisection')).toBeVisible();
  const solutionPanel = page.locator('.solution-panel');
  await expect(solutionPanel).toContainText('Bisection midpoint formula:');
  await expect(solutionPanel).toContainText('c_n = (a_n + b_n) / 2');
  await expect(solutionPanel).not.toContainText('Newton-Raphson iteration formula:');
});

test('switches from default legacy to modern beta and back without losing form values', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Legacy' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Modern beta' }).click();
  await expect(page.getByRole('button', { name: 'Modern beta' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Modern beta uses the new TypeScript + math.js engine.')).toBeVisible();
  await expect(page.getByText(/Modern beta is active/)).toBeVisible();

  await page.getByRole('button', { name: 'Bisection', exact: true }).click();
  await page.locator('[name="root-bis-expression"]').fill('x^3 - x - 1');
  await page.locator('[name="root-bis-a"]').fill('1');
  await page.locator('[name="root-bis-b"]').fill('2');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(page.getByText('Method: Bisection')).toBeVisible();
  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Legacy' }).click();
  await expect(page.getByRole('button', { name: 'Legacy' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Legacy is the default engine used by the current app.')).toBeVisible();
  await expect(page.getByText(/Modern beta is active/)).not.toBeVisible();
  await expect(page.locator('[name="root-bis-expression"]')).toHaveValue('x^3 - x - 1');
  await page.getByRole('button', { name: 'Run bisection' }).click();
  await expect(page.getByText('Method: Bisection')).toBeVisible();
});
