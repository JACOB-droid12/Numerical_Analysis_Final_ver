import { useId } from 'react';

import { graphCaption } from '../lib/resultFormatters';
import type { RootMethod, RootRunResult, IterationRow } from '../types/roots';

interface ConvergenceGraphProps {
  run: RootRunResult;
  compact?: boolean;
  hero?: boolean;
}

export interface ConvergenceGraphPoint {
  x: number;
  y: number;
}

function parseNumericString(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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
  const directKeys = ['approx', 'machine', 'reference', 'value', 'xNext', 'xn', 'c', 'x', 'root'];
  for (const key of directKeys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const parsed = numericFromValue(record[key]);
      if (parsed != null) {
        return parsed;
      }
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(record, 're') &&
    Object.prototype.hasOwnProperty.call(record, 'im')
  ) {
    const re = numericFromValue(record.re);
    const im = numericFromValue(record.im);
    if (re != null && (im == null || Math.abs(im) < 1e-12)) {
      return re;
    }
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(record, 'sign') &&
    Object.prototype.hasOwnProperty.call(record, 'num') &&
    Object.prototype.hasOwnProperty.call(record, 'den')
  ) {
    const sign = numericFromValue(record.sign);
    const num = numericFromValue(record.num);
    const den = numericFromValue(record.den);
    if (sign != null && num != null && den != null && den !== 0) {
      return (sign < 0 ? -1 : 1) * (num / den);
    }
  }

  return null;
}

function pickRowValue(method: RootMethod, row: IterationRow): number | null {
  const preferredKeys: Array<string> =
    method === 'bisection' || method === 'falsePosition'
      ? ['c', 'xNext', 'xn', 'approx', 'machine', 'reference', 'value', 'root']
      : method === 'newton'
        ? ['xNext', 'xn', 'approx', 'machine', 'reference', 'value', 'root']
        : method === 'secant'
          ? ['xNext', 'xn', 'approx', 'machine', 'reference', 'value', 'root']
          : ['xNext', 'gxn', 'gXn', 'next', 'approximation', 'xn', 'approx', 'machine', 'reference', 'value', 'root'];

  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const parsed = numericFromValue(row[key]);
      if (parsed != null) {
        return parsed;
      }
    }
  }

  return null;
}

export function buildConvergenceGraphPoints(run: RootRunResult): ConvergenceGraphPoint[] {
  const rows = run.rows ?? [];
  return rows
    .map((row, index) => ({
      x: typeof row.iteration === 'number' ? row.iteration : index + 1,
      y: pickRowValue(run.method, row),
    }))
    .filter(
      (point): point is ConvergenceGraphPoint =>
        Number.isFinite(point.x) && point.y != null && Number.isFinite(point.y),
    );
}

export function ConvergenceGraph({ run, compact = false, hero = false }: ConvergenceGraphProps) {
  const titleId = useId();
  const svgTitleId = useId();
  const descId = useId();
  const lineGradientId = `${svgTitleId.replace(/[^a-zA-Z0-9_-]/g, '')}-line`;
  const wrapperClassName = hero || compact ? 'graph-panel' : 'graph-panel';
  const caption = graphCaption(run.method);
  const points = buildConvergenceGraphPoints(run);

  const graphSummary =
    points.length > 0
      ? `Plotted ${points.length} iteration${points.length === 1 ? '' : 's'} with iteration values from ${Math.min(...points.map((point) => point.x))} to ${Math.max(...points.map((point) => point.x))} and y-values from ${Math.min(...points.map((point) => point.y))} to ${Math.max(...points.map((point) => point.y))}.`
      : 'No finite iteration data available for the graph.';

  if (points.length < 2) {
    return (
      <section className={wrapperClassName}>
        <h2 id={titleId} className="section-kicker">
          Approximation graph
        </h2>
        <p className="mt-2 text-sm muted-copy">{graphSummary}</p>
        <p className="mt-3 text-sm text-[var(--text)]">No iteration data for graph.</p>
      </section>
    );
  }

  const width = 560;
  const height = 220;
  const padX = 36;
  const padY = 24;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;
  const toSvgX = (value: number) => padX + ((value - minX) / xSpan) * (width - padX * 2);
  const toSvgY = (value: number) => height - padY - ((value - minY) / ySpan) * (height - padY * 2);
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toSvgX(point.x)} ${toSvgY(point.y)}`).join(' ');

  return (
    <section className={wrapperClassName}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="section-kicker">
          Approximation graph
        </h2>
        <p className="numeric-value text-xs text-[var(--quiet)]">{points.length} points</p>
      </div>
      <p className="sr-only">{graphSummary}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={hero ? 'mt-3 h-[27rem] w-full max-h-[58vh]' : 'mt-3 h-56 w-full'}
        role="img"
        aria-labelledby={svgTitleId}
        aria-describedby={descId}
      >
        <title id={svgTitleId}>Approximation graph</title>
        <desc id={descId}>{graphSummary}</desc>
        <defs>
          <linearGradient id={lineGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--action-blue)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="12" fill="var(--surface)" />
        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={`grid-y-${index}`}
            x1={padX}
            y1={padY + (index * (height - padY * 2)) / 7}
            x2={width - padX}
            y2={padY + (index * (height - padY * 2)) / 7}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <line
            key={`grid-x-${index}`}
            x1={padX + (index * (width - padX * 2)) / 8}
            y1={padY}
            x2={padX + (index * (width - padX * 2)) / 8}
            y2={height - padY}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        <line
          x1={padX}
          y1={padY}
          x2={padX}
          y2={height - padY}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted)"
        >
          Iteration
        </text>
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted)"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Root estimate
        </text>
        <path d={path} fill="none" stroke={`url(#${lineGradientId})`} strokeWidth={hero ? '3' : '2.5'} />
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={toSvgX(point.x)}
            cy={toSvgY(point.y)}
            r={index === points.length - 1 ? '5' : '3.5'}
            fill={index === points.length - 1 ? 'var(--green)' : 'var(--action-blue)'}
          />
        ))}
      </svg>
      <p className="graph-caption">Root estimate by iteration. {caption}</p>
    </section>
  );
}
