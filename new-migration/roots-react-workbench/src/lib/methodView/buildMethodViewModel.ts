import { evaluateExpression, type AngleMode } from '../math/evaluator';
import type { IterationRow, RootRunResult } from '../../types/roots';

export type MethodViewPointKind = 'endpoint' | 'midpoint' | 'root-estimate';
export type MethodViewSegmentKind = 'vertical' | 'horizontal' | 'construction' | 'axis';
export type MethodViewIntervalBandKind = 'current-interval' | 'kept-interval';

export interface MethodViewPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: MethodViewPointKind;
}

export interface MethodViewSegment {
  id: string;
  label: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  kind: MethodViewSegmentKind;
}

export interface MethodViewIntervalBand {
  id: string;
  label: string;
  fromX: number;
  toX: number;
  kind: MethodViewIntervalBandKind;
}

export interface MethodViewModel {
  method: string;
  selectedIteration: number;
  curveExpression: string;
  sampleDomain: { min: number; max: number };
  functionSamples: Array<{ x: number; y: number }>;
  xAxis: { y: 0 };
  points: MethodViewPoint[];
  segments: MethodViewSegment[];
  intervalBands: MethodViewIntervalBand[];
  annotations: string[];
  emptyReason?: string;
}

interface BisectionGeometry {
  a: number;
  b: number;
  p: number;
  fa: number;
  fb: number;
  fp: number;
  decision?: 'left' | 'right';
}

const ZERO_TOLERANCE = 1e-14;
const SAMPLE_COUNT = 80;

function emptyModel(
  run: RootRunResult | null | undefined,
  selectedIteration: number,
  emptyReason: string,
): MethodViewModel {
  return {
    method: run?.method ?? '',
    selectedIteration,
    curveExpression: run?.expression ?? run?.canonical ?? '',
    sampleDomain: { min: 0, max: 1 },
    functionSamples: [],
    xAxis: { y: 0 },
    points: [],
    segments: [],
    intervalBands: [],
    annotations: [],
    emptyReason,
  };
}

function parseNumericString(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericFromValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'bigint') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'string') {
    return parseNumericString(value);
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of ['value', 'machine', 'reference', 'approx']) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const parsed = numericFromValue(record[key]);
      if (parsed != null) return parsed;
    }
  }

  return null;
}

function pickFirstFinite(row: IterationRow, keys: string[]): number | null {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const parsed = numericFromValue(row[key]);
      if (parsed != null) return parsed;
    }
  }

  return null;
}

function normalizeBisectionRow(row: IterationRow): BisectionGeometry | null {
  const a = pickFirstFinite(row, ['a', 'lower']);
  const b = pickFirstFinite(row, ['b', 'upper']);
  const p = pickFirstFinite(row, ['p', 'c', 'midpoint']);
  const fa = pickFirstFinite(row, ['f(a)', 'fa', 'fLower']);
  const fb = pickFirstFinite(row, ['f(b)', 'fb', 'fUpper']);
  const fp = pickFirstFinite(row, ['f(p)', 'fp', 'fc', 'fMidpoint']);

  if (a == null || b == null || p == null || fa == null || fb == null || fp == null) {
    return null;
  }

  const decision = row.decision === 'left' || row.decision === 'right' ? row.decision : undefined;
  return { a, b, p, fa, fb, fp, decision };
}

function isZero(value: number): boolean {
  return Math.abs(value) <= ZERO_TOLERANCE;
}

function hasOppositeSigns(left: number, right: number): boolean {
  return !isZero(left) && !isZero(right) && left * right < 0;
}

function sampleDomainFor(a: number, b: number): { min: number; max: number } {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const width = max - min;
  const padding = width > 0 ? width * 0.1 : Math.max(1, Math.abs(min) * 0.1);

  return {
    min: min - padding,
    max: max + padding,
  };
}

function finiteNumberFromEvaluation(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

function sampleExpression(
  expression: string,
  domain: { min: number; max: number },
  angleMode: AngleMode,
): Array<{ x: number; y: number }> {
  if (!expression.trim()) return [];

  return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const x = domain.min + ((domain.max - domain.min) * index) / (SAMPLE_COUNT - 1);
    const evaluated = evaluateExpression(
      expression,
      { x },
      { mode: 'legacy-compatible', angleMode },
    );
    if (!evaluated.ok) return null;

    const y = finiteNumberFromEvaluation(evaluated.value);
    return y == null ? null : { x, y };
  }).filter((sample): sample is { x: number; y: number } => sample != null);
}

function angleModeFor(run: RootRunResult): AngleMode {
  return run.angleMode === 'deg' ? 'deg' : 'rad';
}

function selectedRowFor(rows: IterationRow[], selectedIteration: number): IterationRow | null {
  return rows.find((row) => row.iteration === selectedIteration) ?? null;
}

function keptIntervalFor(geometry: BisectionGeometry): MethodViewIntervalBand | null {
  if (isZero(geometry.fp)) return null;

  if (hasOppositeSigns(geometry.fa, geometry.fp)) {
    return {
      id: 'kept-interval',
      label: 'Kept interval [a_n, p_n]',
      fromX: Math.min(geometry.a, geometry.p),
      toX: Math.max(geometry.a, geometry.p),
      kind: 'kept-interval',
    };
  }

  if (hasOppositeSigns(geometry.fp, geometry.fb)) {
    return {
      id: 'kept-interval',
      label: 'Kept interval [p_n, b_n]',
      fromX: Math.min(geometry.p, geometry.b),
      toX: Math.max(geometry.p, geometry.b),
      kind: 'kept-interval',
    };
  }

  if (geometry.decision === 'left') {
    return {
      id: 'kept-interval',
      label: 'Kept interval [a_n, p_n]',
      fromX: Math.min(geometry.a, geometry.p),
      toX: Math.max(geometry.a, geometry.p),
      kind: 'kept-interval',
    };
  }

  if (geometry.decision === 'right') {
    return {
      id: 'kept-interval',
      label: 'Kept interval [p_n, b_n]',
      fromX: Math.min(geometry.p, geometry.b),
      toX: Math.max(geometry.p, geometry.b),
      kind: 'kept-interval',
    };
  }

  return null;
}

function annotationsFor(geometry: BisectionGeometry, keptInterval: MethodViewIntervalBand | null): string[] {
  const annotations = ['Initial bracket satisfies the Intermediate Value Theorem when f(a_n) and f(b_n) have opposite signs.'];

  if (isZero(geometry.fp)) {
    annotations.push('f(p_n) = 0, so p_n is an exact root for this iteration.');
    return annotations;
  }

  if (keptInterval?.label === 'Kept interval [a_n, p_n]') {
    annotations.push('sgn(f(a_n))sgn(f(p_n)) < 0, keep [a_n, p_n].');
  } else if (keptInterval?.label === 'Kept interval [p_n, b_n]') {
    annotations.push('sgn(f(p_n))sgn(f(b_n)) < 0, keep [p_n, b_n].');
  }

  if (keptInterval) {
    annotations.push(`${keptInterval.label}.`);
  }

  return annotations;
}

export function buildMethodViewModel(
  run: RootRunResult | null | undefined,
  selectedIteration: number,
): MethodViewModel {
  if (!run) {
    return emptyModel(run, selectedIteration, 'No run is available for Method View.');
  }

  if (run.method !== 'bisection') {
    return emptyModel(run, selectedIteration, 'Method View currently supports Bisection only.');
  }

  const rows = run.rows ?? [];
  if (rows.length === 0) {
    return emptyModel(run, selectedIteration, 'No iteration rows are available for Method View.');
  }

  const row = selectedRowFor(rows, selectedIteration);
  if (!row) {
    return emptyModel(run, selectedIteration, 'Selected iteration is not available for Method View.');
  }

  const geometry = normalizeBisectionRow(row);
  if (!geometry) {
    return emptyModel(run, selectedIteration, 'Bisection geometry fields are missing for Method View.');
  }

  const curveExpression = run.expression ?? run.canonical ?? '';
  const sampleDomain = sampleDomainFor(geometry.a, geometry.b);
  const functionSamples = sampleExpression(curveExpression, sampleDomain, angleModeFor(run));
  if (functionSamples.length < 2) {
    return {
      ...emptyModel(run, selectedIteration, 'Not enough finite samples are available for Method View.'),
      curveExpression,
      sampleDomain,
    };
  }

  const currentInterval: MethodViewIntervalBand = {
    id: 'current-interval',
    label: 'Current interval [a_n, b_n]',
    fromX: Math.min(geometry.a, geometry.b),
    toX: Math.max(geometry.a, geometry.b),
    kind: 'current-interval',
  };
  const keptInterval = keptIntervalFor(geometry);
  const intervalBands = keptInterval ? [currentInterval, keptInterval] : [currentInterval];

  return {
    method: run.method,
    selectedIteration,
    curveExpression,
    sampleDomain,
    functionSamples,
    xAxis: { y: 0 },
    points: [
      { id: 'a', label: 'a_n', x: geometry.a, y: geometry.fa, kind: 'endpoint' },
      { id: 'b', label: 'b_n', x: geometry.b, y: geometry.fb, kind: 'endpoint' },
      { id: 'p', label: 'p_n', x: geometry.p, y: geometry.fp, kind: 'midpoint' },
    ],
    segments: [
      {
        id: 'x-axis',
        label: 'x-axis',
        from: { x: sampleDomain.min, y: 0 },
        to: { x: sampleDomain.max, y: 0 },
        kind: 'axis',
      },
      {
        id: 'a-to-axis',
        label: 'a_n to x-axis',
        from: { x: geometry.a, y: geometry.fa },
        to: { x: geometry.a, y: 0 },
        kind: 'vertical',
      },
      {
        id: 'b-to-axis',
        label: 'b_n to x-axis',
        from: { x: geometry.b, y: geometry.fb },
        to: { x: geometry.b, y: 0 },
        kind: 'vertical',
      },
      {
        id: 'p-to-axis',
        label: 'p_n to x-axis',
        from: { x: geometry.p, y: geometry.fp },
        to: { x: geometry.p, y: 0 },
        kind: 'vertical',
      },
    ],
    intervalBands,
    annotations: annotationsFor(geometry, keptInterval),
  };
}
