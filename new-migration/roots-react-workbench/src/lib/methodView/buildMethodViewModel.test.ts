import { describe, expect, it } from 'vitest';

import { buildMethodViewModel } from './buildMethodViewModel';
import type { RootRunResult } from '../../types/roots';

function bisectionRun(overrides: Partial<RootRunResult> = {}): RootRunResult {
  return {
    method: 'bisection',
    expression: 'x^2 - 2',
    rows: [
      {
        iteration: 1,
        lower: 1,
        upper: 2,
        midpoint: 1.5,
        fLower: -1,
        fUpper: 2,
        fMidpoint: 0.25,
        decision: 'left',
      },
    ],
    ...overrides,
  };
}

describe('buildMethodViewModel', () => {
  it('builds a Bisection method view model from Modern row fields', () => {
    const model = buildMethodViewModel(bisectionRun(), 1);

    expect(model.method).toBe('bisection');
    expect(model.selectedIteration).toBe(1);
    expect(model.curveExpression).toBe('x^2 - 2');
    expect(model.sampleDomain.min).toBeLessThan(1);
    expect(model.sampleDomain.max).toBeGreaterThan(2);
    expect(model.functionSamples.length).toBeGreaterThan(2);
    expect(model.xAxis).toEqual({ y: 0 });
    expect(model.emptyReason).toBeUndefined();
  });

  it('builds a Bisection method view model from Legacy alias row fields', () => {
    const model = buildMethodViewModel(bisectionRun({
      rows: [
        {
          iteration: 3,
          a: '1.25',
          b: '1.5',
          c: '1.375',
          fa: '-0.046875',
          fb: '0.25',
          fc: '-0.109375',
          decision: 'right',
        },
      ],
    }), 3);

    expect(model.points).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'a', label: 'a_n', x: 1.25, y: -0.046875, kind: 'endpoint' }),
      expect.objectContaining({ id: 'b', label: 'b_n', x: 1.5, y: 0.25, kind: 'endpoint' }),
      expect.objectContaining({ id: 'p', label: 'p_n', x: 1.375, y: -0.109375, kind: 'midpoint' }),
    ]));
  });

  it('adds Bisection points for a_n, b_n, and p_n', () => {
    const model = buildMethodViewModel(bisectionRun(), 1);

    expect(model.points).toEqual([
      { id: 'a', label: 'a_n', x: 1, y: -1, kind: 'endpoint' },
      { id: 'b', label: 'b_n', x: 2, y: 2, kind: 'endpoint' },
      { id: 'p', label: 'p_n', x: 1.5, y: 0.25, kind: 'midpoint' },
    ]);
  });

  it('adds the current interval band from a_n to b_n', () => {
    const model = buildMethodViewModel(bisectionRun(), 1);

    expect(model.intervalBands).toEqual(expect.arrayContaining([
      { id: 'current-interval', label: 'Current interval [a_n, b_n]', fromX: 1, toX: 2, kind: 'current-interval' },
    ]));
  });

  it('derives the kept interval for the left half', () => {
    const model = buildMethodViewModel(bisectionRun(), 1);

    expect(model.intervalBands).toEqual(expect.arrayContaining([
      { id: 'kept-interval', label: 'Kept interval [a_n, p_n]', fromX: 1, toX: 1.5, kind: 'kept-interval' },
    ]));
    expect(model.annotations).toContain('sgn(f(a_n))sgn(f(p_n)) < 0, keep [a_n, p_n].');
  });

  it('derives the kept interval for the right half', () => {
    const model = buildMethodViewModel(bisectionRun({
      rows: [
        {
          iteration: 2,
          lower: 1,
          upper: 1.5,
          midpoint: 1.25,
          fLower: -1,
          fUpper: 0.25,
          fMidpoint: -0.4375,
          decision: 'right',
        },
      ],
    }), 2);

    expect(model.intervalBands).toEqual(expect.arrayContaining([
      { id: 'kept-interval', label: 'Kept interval [p_n, b_n]', fromX: 1.25, toX: 1.5, kind: 'kept-interval' },
    ]));
    expect(model.annotations).toContain('sgn(f(p_n))sgn(f(b_n)) < 0, keep [p_n, b_n].');
  });

  it('annotates exact root behavior at the midpoint', () => {
    const model = buildMethodViewModel(bisectionRun({
      rows: [
        {
          iteration: 1,
          lower: 1,
          upper: 2,
          midpoint: 1.5,
          fLower: -1,
          fUpper: 1,
          fMidpoint: 0,
        },
      ],
    }), 1);

    expect(model.annotations).toContain('f(p_n) = 0, so p_n is an exact root for this iteration.');
    expect(model.intervalBands.some((band) => band.kind === 'kept-interval')).toBe(false);
  });

  it('returns a friendly empty reason when rows are missing', () => {
    const model = buildMethodViewModel(bisectionRun({ rows: [] }), 1);

    expect(model.emptyReason).toBe('No iteration rows are available for Method View.');
    expect(model.functionSamples).toEqual([]);
  });

  it('returns a friendly empty reason for unsupported methods', () => {
    const model = buildMethodViewModel({ method: 'newton', expression: 'x^2 - 2', rows: [] }, 1);

    expect(model.emptyReason).toBe('Method View currently supports Bisection only.');
  });

  it('filters non-finite samples and still returns finite display samples', () => {
    const model = buildMethodViewModel(bisectionRun({
      expression: '1 / (x - 1.5)',
      rows: [
        {
          iteration: 1,
          lower: 1,
          upper: 2,
          midpoint: 1.5,
          fLower: -2,
          fUpper: 2,
          fMidpoint: 0,
        },
      ],
    }), 1);

    expect(model.functionSamples.length).toBeGreaterThan(2);
    expect(model.functionSamples.every((sample) => Number.isFinite(sample.x) && Number.isFinite(sample.y))).toBe(true);
  });

  it('does not mutate run data while building display-only samples', () => {
    const run = bisectionRun();
    const before = JSON.stringify(run);

    buildMethodViewModel(run, 1);

    expect(JSON.stringify(run)).toBe(before);
  });
});
