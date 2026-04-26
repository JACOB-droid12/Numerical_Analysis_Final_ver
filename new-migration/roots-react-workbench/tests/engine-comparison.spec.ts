import { expect, type Browser, type Page, test } from '@playwright/test';

const LEGACY_URL = 'http://127.0.0.1:4176';
const MODERN_URL = 'http://127.0.0.1:4177';

type EngineName = 'legacy' | 'modern';
type UiResult =
  | {
      status: 'success';
      root: number;
      stopReason: string;
      method: string;
    }
  | {
      status: 'failure';
      message: string;
    };

type Scenario = {
  name: string;
  expectedRoot?: number;
  rootPrecision?: number;
  rootTolerance?: number;
  allowSafeStop?: boolean;
  run: (page: Page) => Promise<void>;
};

async function setField(page: Page, name: string, value: string) {
  await page.locator(`[name="${name}"]`).fill(value);
}

async function selectMethod(page: Page, label: string | RegExp) {
  await page.getByRole('button', { name: label }).click();
}

async function setIterations(page: Page, stopValueField: string, iterations: string) {
  await page.getByText('Computation settings').click();
  await setField(page, stopValueField, iterations);
}

async function setDegreeMode(page: Page) {
  await page.getByRole('button', { name: /Toggle angle mode/ }).click();
}

async function rootValue(page: Page): Promise<number> {
  const rootText = await page.locator('.answer-hero-major .answer-root').innerText();
  const root = Number(rootText);
  return root;
}

async function captureUiResult(page: Page): Promise<UiResult> {
  const alert = page.getByRole('alert');
  if (await alert.isVisible().catch(() => false)) {
    return {
      status: 'failure',
      message: await alert.innerText(),
    };
  }

  await expect(page.getByText('Approximate root', { exact: true })).toBeVisible();
  const method = await page.locator('.meta-row').getByText(/^Method:/).innerText();
  const stopReason = await page
    .locator('article')
    .filter({ hasText: 'Stopping result' })
    .locator('.answer-value')
    .innerText();

  const root = await rootValue(page);
  if (!Number.isFinite(root)) {
    return {
      status: 'failure',
      message: stopReason,
    };
  }

  return {
    status: 'success',
    root,
    stopReason,
    method,
  };
}

async function runScenario(
  browser: Browser,
  engine: EngineName,
  scenario: Scenario,
): Promise<UiResult> {
  const page = await browser.newPage();
  try {
    await page.goto(engine === 'legacy' ? LEGACY_URL : MODERN_URL);
    await expect(page.getByRole('heading', { name: 'Answer workstation' })).toBeVisible();
    await expect(page.getByText('Engine ready')).toBeVisible();

    await scenario.run(page);
    return await captureUiResult(page);
  } finally {
    await page.close();
  }
}

function compareResults(scenario: Scenario, legacy: UiResult, modern: UiResult) {
  if (scenario.expectedRoot != null) {
    expect(modern.status).toBe(legacy.status);
    expect(legacy.status).toBe('success');
    expect(modern.status).toBe('success');
    if (legacy.status !== 'success' || modern.status !== 'success') {
      throw new Error(`${scenario.name} expected both engines to succeed.`);
    }

    const precision = scenario.rootPrecision ?? 4;
    if (scenario.rootTolerance != null) {
      expect(Math.abs(legacy.root - scenario.expectedRoot)).toBeLessThanOrEqual(scenario.rootTolerance);
      expect(Math.abs(modern.root - scenario.expectedRoot)).toBeLessThanOrEqual(scenario.rootTolerance);
      expect(Math.abs(modern.root - legacy.root)).toBeLessThanOrEqual(scenario.rootTolerance);
    } else {
      expect(legacy.root).toBeCloseTo(scenario.expectedRoot, precision);
      expect(modern.root).toBeCloseTo(scenario.expectedRoot, precision);
      expect(modern.root).toBeCloseTo(legacy.root, precision);
    }
    return;
  }

  if (scenario.allowSafeStop) {
    if (legacy.status === 'success') {
      expect(Number.isFinite(legacy.root)).toBe(true);
    } else {
      expect(legacy.message).toMatch(/interval|sign|bracket|input|diverge|cycle|error|cannot|failed/i);
    }
    if (modern.status === 'success') {
      expect(Number.isFinite(modern.root)).toBe(true);
    } else {
      expect(modern.message).toMatch(/interval|sign|bracket|input|diverge|cycle|error|cannot|failed/i);
    }
    return;
  }

  expect(modern.status).toBe(legacy.status);
  expect(legacy.status).toBe('failure');
  expect(modern.status).toBe('failure');
  if (legacy.status !== 'failure' || modern.status !== 'failure') {
    throw new Error(`${scenario.name} expected both engines to fail.`);
  }
  expect(legacy.message).toMatch(/interval|sign|bracket|input|division|zero|finite|complex|singular|cannot|failed/i);
  expect(modern.message).toMatch(/interval|sign|bracket|input|division|zero|finite|complex|singular|cannot|failed/i);
}

const scenarios: Scenario[] = [
  {
    name: 'Bisection normal case',
    expectedRoot: 1.324717957,
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'x^3 - x - 1');
      await setField(page, 'root-bis-a', '1');
      await setField(page, 'root-bis-b', '2');
      await setIterations(page, 'root-bis-stop-value', '30');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection log semantics use natural log',
    expectedRoot: Math.E,
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'log(x) - 1');
      await setField(page, 'root-bis-a', '2');
      await setField(page, 'root-bis-b', '4');
      await setIterations(page, 'root-bis-stop-value', '35');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection natural log domain-safe root',
    expectedRoot: Math.E,
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'ln(x) - 1');
      await setField(page, 'root-bis-a', '2');
      await setField(page, 'root-bis-b', '4');
      await setIterations(page, 'root-bis-stop-value', '35');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection non-finite rejection',
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', '1 / (x - 1)');
      await setField(page, 'root-bis-a', '0');
      await setField(page, 'root-bis-b', '2');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection complex rejection',
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'sqrt(x)');
      await setField(page, 'root-bis-a', '-1');
      await setField(page, 'root-bis-b', '1');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection degree-mode cosine root',
    expectedRoot: 90,
    run: async (page) => {
      await setDegreeMode(page);
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'cos(x)');
      await setField(page, 'root-bis-a', '0');
      await setField(page, 'root-bis-b', '180');
      await setIterations(page, 'root-bis-stop-value', '35');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection large-scale root',
    expectedRoot: 1000,
    rootPrecision: 3,
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'x^2 - 1000000');
      await setField(page, 'root-bis-a', '0');
      await setField(page, 'root-bis-b', '2000');
      await setIterations(page, 'root-bis-stop-value', '40');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Bisection small-scale root',
    expectedRoot: 0.000001,
    rootTolerance: 1e-8,
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'x - 0.000001');
      await setField(page, 'root-bis-a', '0');
      await setField(page, 'root-bis-b', '0.000002');
      await setIterations(page, 'root-bis-stop-value', '10');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
  {
    name: 'Fixed Point divergence safe stop',
    allowSafeStop: true,
    run: async (page) => {
      await selectMethod(page, /Fixed Point/);
      await setField(page, 'root-fpi-expression', '2*x');
      await setField(page, 'root-fpi-x0', '1');
      await setIterations(page, 'root-fpi-stop-value', '20');
      await page.getByRole('button', { name: 'Run fixed-point iteration' }).click();
    },
  },
  {
    name: 'Fixed Point cycle safe stop',
    allowSafeStop: true,
    run: async (page) => {
      await selectMethod(page, /Fixed Point/);
      await setField(page, 'root-fpi-expression', '-x');
      await setField(page, 'root-fpi-x0', '1');
      await setIterations(page, 'root-fpi-stop-value', '20');
      await page.getByRole('button', { name: 'Run fixed-point iteration' }).click();
    },
  },
  {
    name: 'Newton auto derivative cosine fixed root',
    expectedRoot: 0.739085133,
    run: async (page) => {
      await setField(page, 'root-newton-expression', 'cos(x) - x');
      await setField(page, 'root-newton-df', 'auto');
      await setField(page, 'root-newton-x0', '0.7');
      await page.getByRole('button', { name: 'Run method' }).click();
    },
  },
  {
    name: 'Newton provided derivative exp-minus-x root',
    expectedRoot: 0.56714329,
    run: async (page) => {
      await setField(page, 'root-newton-expression', 'exp(-x) - x');
      await setField(page, 'root-newton-df', '-exp(-x) - 1');
      await setField(page, 'root-newton-x0', '0.5');
      await page.getByRole('button', { name: 'Run method' }).click();
    },
  },
  {
    name: 'False Position normal case',
    expectedRoot: 2,
    run: async (page) => {
      await selectMethod(page, /False Position/);
      await setField(page, 'root-fp-expression', 'x^2 - 4');
      await setField(page, 'root-fp-a', '0');
      await setField(page, 'root-fp-b', '3');
      await setIterations(page, 'root-fp-stop-value', '30');
      await page.getByRole('button', { name: 'Run false position' }).click();
    },
  },
  {
    name: 'Secant normal case',
    expectedRoot: 1.324717957,
    run: async (page) => {
      await selectMethod(page, /Secant/);
      await setField(page, 'root-secant-expression', 'x^3 - x - 1');
      await setField(page, 'root-secant-x0', '1');
      await setField(page, 'root-secant-x1', '2');
      await page.getByRole('button', { name: 'Run secant' }).click();
    },
  },
  {
    name: 'Fixed Point normal case',
    expectedRoot: 0.739085133,
    run: async (page) => {
      await selectMethod(page, /Fixed Point/);
      await setField(page, 'root-fpi-expression', 'cos(x)');
      await setField(page, 'root-fpi-x0', '1');
      await setField(page, 'root-fpi-target-expression', 'x - cos(x)');
      await setIterations(page, 'root-fpi-stop-value', '60');
      await page.getByRole('button', { name: 'Run fixed-point iteration' }).click();
    },
  },
  {
    name: 'Newton auto derivative normal case',
    expectedRoot: 1.324717957,
    run: async (page) => {
      await setField(page, 'root-newton-expression', 'x^3 - x - 1');
      await setField(page, 'root-newton-df', 'auto');
      await setField(page, 'root-newton-x0', '1.5');
      await page.getByRole('button', { name: 'Run method' }).click();
    },
  },
  {
    name: 'Newton provided derivative normal case',
    expectedRoot: 2,
    run: async (page) => {
      await setField(page, 'root-newton-expression', 'x^2 - 4');
      await setField(page, 'root-newton-df', '2*x');
      await setField(page, 'root-newton-x0', '3');
      await page.getByRole('button', { name: 'Run method' }).click();
    },
  },
  {
    name: 'Bisection bad bracket failure',
    run: async (page) => {
      await selectMethod(page, /Bisection/);
      await setField(page, 'root-bis-expression', 'x^2 + 1');
      await setField(page, 'root-bis-a', '-1');
      await setField(page, 'root-bis-b', '1');
      await page.getByRole('button', { name: 'Run bisection' }).click();
    },
  },
];

test.describe('legacy vs modern engine UI comparison', () => {
  for (const scenario of scenarios) {
    test(scenario.name, async ({ browser }) => {
      const legacy = await runScenario(browser, 'legacy', scenario);
      const modern = await runScenario(browser, 'modern', scenario);

      compareResults(scenario, legacy, modern);
    });
  }
});
