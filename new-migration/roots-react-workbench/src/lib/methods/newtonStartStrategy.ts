export type NewtonInitialStrategy =
  | 'manual'
  | 'midpoint'
  | 'left'
  | 'right'
  | 'best-endpoint'
  | 'best-of-three';

export type NewtonStartCandidate = {
  label: string;
  x: number;
  fx?: number | null;
  absFx?: number | null;
  note: string;
};

export type NewtonStartHelper = {
  strategy: NewtonInitialStrategy;
  x0: number;
  interval?: { lower: number; upper: number };
  candidates: NewtonStartCandidate[];
  note: string;
};

export type NewtonStartInput = {
  x0?: number;
  interval?: { lower?: number; upper?: number } | null;
  strategy?: NewtonInitialStrategy;
  evaluateCandidate?: (x: number) => number;
};

export type NewtonStartResult =
  | {
      ok: true;
      value: number;
      helper: NewtonStartHelper;
    }
  | {
      ok: false;
      reason: 'invalid-starting-value';
      message: string;
    };

function intervalFromInput(interval: NewtonStartInput['interval']) {
  if (!interval) return null;
  const lower = interval.lower;
  const upper = interval.upper;
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return null;
  }

  return { lower: lower as number, upper: upper as number };
}

function candidate(
  label: string,
  x: number,
  evaluateCandidate?: (x: number) => number,
): NewtonStartCandidate {
  if (!evaluateCandidate) {
    return { label, x, fx: null, absFx: null, note: '' };
  }

  try {
    const fx = evaluateCandidate(x);
    return Number.isFinite(fx)
      ? { label, x, fx, absFx: Math.abs(fx), note: '' }
      : { label, x, fx: null, absFx: Number.POSITIVE_INFINITY, note: 'Candidate did not evaluate to a finite real number.' };
  } catch (error) {
    return {
      label,
      x,
      fx: null,
      absFx: Number.POSITIVE_INFINITY,
      note: error instanceof Error ? error.message : 'Candidate evaluation failed.',
    };
  }
}

function bestCandidate(candidates: NewtonStartCandidate[]): NewtonStartCandidate {
  return candidates.slice().sort((left, right) => {
    const leftResidual = left.absFx ?? Number.POSITIVE_INFINITY;
    const rightResidual = right.absFx ?? Number.POSITIVE_INFINITY;
    return leftResidual - rightResidual;
  })[0];
}

export function resolveNewtonStart(input: NewtonStartInput): NewtonStartResult {
  if (Number.isFinite(input.x0)) {
    const x0 = input.x0 as number;
    return {
      ok: true,
      value: x0,
      helper: {
        strategy: 'manual',
        x0,
        candidates: [],
        note: 'Using the entered x0.',
      },
    };
  }

  const interval = intervalFromInput(input.interval);
  if (!interval) {
    return {
      ok: false,
      reason: 'invalid-starting-value',
      message: 'Newton-Raphson requires either a finite x0 or interval endpoints for an interval-derived start.',
    };
  }

  if (interval.lower >= interval.upper) {
    return {
      ok: false,
      reason: 'invalid-starting-value',
      message: 'Newton-Raphson interval start requires lower < upper.',
    };
  }

  const midpoint = interval.lower + (interval.upper - interval.lower) / 2;
  const candidates = [
    candidate('left', interval.lower, input.evaluateCandidate),
    candidate('midpoint', midpoint, input.evaluateCandidate),
    candidate('right', interval.upper, input.evaluateCandidate),
  ];
  const strategy = input.strategy ?? 'midpoint';
  const selected = (() => {
    switch (strategy) {
      case 'left':
        return candidates[0];
      case 'right':
        return candidates[2];
      case 'best-endpoint':
        return bestCandidate([candidates[0], candidates[2]]);
      case 'best-of-three':
        return bestCandidate(candidates);
      case 'midpoint':
      case 'manual':
      default:
        return candidates[1];
    }
  })();
  const effectiveStrategy = strategy === 'manual' ? 'midpoint' : strategy;

  return {
    ok: true,
    value: selected.x,
    helper: {
      strategy: effectiveStrategy,
      x0: selected.x,
      interval,
      candidates,
      note: effectiveStrategy === 'midpoint'
        ? 'Using the interval midpoint as x0.'
        : `Using ${selected.label} as x0 from the interval strategy.`,
    },
  };
}
