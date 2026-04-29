import { useId, useState } from 'react';

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

export type GraphMode = 'approximation' | 'error' | 'residual';

interface GraphModeConfig {
  label: string;
  title: string;
  yAxisLabel: string;
  captionLead: string;
  summaryValueLabel: string;
}

const GRAPH_MODE_CONFIG: Record<GraphMode, GraphModeConfig> = {
  approximation: {
    label: 'Approximation',
    title: 'Approximation graph',
    yAxisLabel: 'Root estimate',
    captionLead: 'Root estimate by iteration.',
    summaryValueLabel: '',
  },
  error: {
    label: 'Approx. Error',
    title: 'Approx. Error graph',
    yAxisLabel: 'Approximation error',
    captionLead: 'Approximation error by iteration.',
    summaryValueLabel: ' error',
  },
  residual: {
    label: 'Residual',
    title: 'Residual graph',
    yAxisLabel: 'Residual / |f(pₙ)|',
    captionLead: 'Residual / |f(pₙ)| by iteration.',
    summaryValueLabel: ' residual',
  },
};

interface GraphTick {
  value: number;
  label: string;
}

function trimFormattedNumber(value: string): string {
  return value.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
}

export function formatGraphValue(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  if (Object.is(value, -0) || value === 0) return '0';

  const absolute = Math.abs(value);
  if (absolute < 0.0001 || absolute >= 1_000_000) {
    return value.toExponential(2).replace('e+', 'e');
  }

  if (absolute >= 1000) return trimFormattedNumber(value.toFixed(1));
  if (absolute >= 100) return trimFormattedNumber(value.toFixed(2));
  if (absolute >= 1) return trimFormattedNumber(value.toFixed(4));
  return trimFormattedNumber(value.toFixed(6));
}

function formatIterationValue(value: number): string {
  return Number.isInteger(value) ? String(value) : formatGraphValue(value);
}

export function buildXAxisTicks(points: ConvergenceGraphPoint[], maxTicks = 6): GraphTick[] {
  const uniqueValues = Array.from(new Set(points.map((point) => point.x)))
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (uniqueValues.length <= maxTicks) {
    return uniqueValues.map((value) => ({ value, label: formatIterationValue(value) }));
  }

  const ticks: number[] = [];
  const lastIndex = uniqueValues.length - 1;
  for (let tickIndex = 0; tickIndex < maxTicks; tickIndex += 1) {
    const sourceIndex = Math.round((tickIndex * lastIndex) / (maxTicks - 1));
    const value = uniqueValues[sourceIndex];
    if (!ticks.includes(value)) {
      ticks.push(value);
    }
  }

  return ticks.map((value) => ({ value, label: formatIterationValue(value) }));
}

export function buildYAxisTicks(points: ConvergenceGraphPoint[], tickCount = 5): GraphTick[] {
  const values = points.map((point) => point.y).filter(Number.isFinite);
  if (values.length === 0) return [];

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || Math.max(Math.abs(maxValue), 1);
  const start = maxValue === minValue ? minValue - span / 2 : minValue;
  const end = maxValue === minValue ? maxValue + span / 2 : maxValue;
  const steps = Math.max(2, Math.min(6, tickCount));

  return Array.from({ length: steps }, (_, index) => {
    const value = start + ((end - start) * index) / (steps - 1);
    return { value, label: formatGraphValue(value) };
  });
}

export function graphPointTitle(point: ConvergenceGraphPoint, mode: GraphMode): string {
  const config = GRAPH_MODE_CONFIG[mode];
  return `Iteration ${formatIterationValue(point.x)} - ${config.label}: ${formatGraphValue(point.y)}`;
}

export function graphSummaryLine(points: ConvergenceGraphPoint[], mode: GraphMode): string {
  const config = GRAPH_MODE_CONFIG[mode];
  if (points.length === 0) {
    return 'No finite points plotted.';
  }

  const first = points[0];
  const last = points[points.length - 1];
  return `${points.length} plotted point${points.length === 1 ? '' : 's'}. First${config.summaryValueLabel}: ${formatGraphValue(first.y)} -> Last${config.summaryValueLabel}: ${formatGraphValue(last.y)}`;
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

function pickFirstFinite(row: IterationRow, keys: string[], absolute = false): number | null {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const parsed = numericFromValue(row[key]);
      if (parsed != null) {
        return absolute ? Math.abs(parsed) : parsed;
      }
    }
  }

  return null;
}

function pickGraphValue(method: RootMethod, row: IterationRow, mode: GraphMode): number | null {
  if (mode === 'approximation') {
    return pickRowValue(method, row);
  }

  if (mode === 'error') {
    return pickFirstFinite(row, ['error', 'approxError', 'approximateError', 'ea', 'relativeError', 'absError']);
  }

  const residual = pickFirstFinite(row, ['residual']);
  return residual ?? pickFirstFinite(
    row,
    ['fpn', 'fPn', 'fp', 'fC', 'fMidpoint', 'fPoint', 'fNext', 'fxNext', 'fxn', 'fc'],
    true,
  );
}

export function buildConvergenceGraphPoints(
  run: RootRunResult,
  mode: GraphMode = 'approximation',
): ConvergenceGraphPoint[] {
  const rows = run.rows ?? [];
  return rows
    .map((row, index) => ({
      x: typeof row.iteration === 'number' ? row.iteration : index + 1,
      y: pickGraphValue(run.method, row, mode),
    }))
    .filter(
      (point): point is ConvergenceGraphPoint =>
        Number.isFinite(point.x) && point.y != null && Number.isFinite(point.y),
    );
}

export function ConvergenceGraph({ run, compact = false, hero = false }: ConvergenceGraphProps) {
  const [mode, setMode] = useState<GraphMode>('approximation');
  const titleId = useId();
  const svgTitleId = useId();
  const descId = useId();
  const lineGradientId = `${svgTitleId.replace(/[^a-zA-Z0-9_-]/g, '')}-line`;
  const wrapperClassName = hero || compact ? 'graph-panel' : 'graph-panel';
  const caption = graphCaption(run.method);
  const modeConfig = GRAPH_MODE_CONFIG[mode];
  const points = buildConvergenceGraphPoints(run, mode);
  const visibleSummary = graphSummaryLine(points, mode);

  const graphSummary =
    points.length > 0
      ? `Plotted ${points.length} iteration${points.length === 1 ? '' : 's'} with iteration values from ${Math.min(...points.map((point) => point.x))} to ${Math.max(...points.map((point) => point.x))} and y-values from ${Math.min(...points.map((point) => point.y))} to ${Math.max(...points.map((point) => point.y))}.`
      : 'No finite iteration data available for the graph.';
  const emptyMessage = mode === 'approximation'
    ? 'No iteration data for graph.'
    : 'Not enough finite data for this graph mode.';
  const selector = (
    <div className="graph-mode-selector" role="group" aria-label="Graph mode">
      <span>Graph:</span>
      {(Object.keys(GRAPH_MODE_CONFIG) as GraphMode[]).map((graphMode) => (
        <button
          key={graphMode}
          type="button"
          aria-pressed={mode === graphMode}
          onClick={() => setMode(graphMode)}
        >
          {GRAPH_MODE_CONFIG[graphMode].label}
        </button>
      ))}
    </div>
  );

  if (points.length < 2) {
    return (
      <section className={wrapperClassName}>
        <div className="graph-panel-header">
          <h2 id={titleId} className="section-kicker">
            {modeConfig.title}
          </h2>
          {selector}
        </div>
        <p className="mt-2 text-sm muted-copy">{graphSummary}</p>
        <p className="mt-3 text-sm text-[var(--text)]">{emptyMessage}</p>
      </section>
    );
  }

  const width = 560;
  const height = 220;
  const padLeft = 72;
  const padRight = 18;
  const padTop = 22;
  const padBottom = 40;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xSpan = maxX - minX || 1;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const yTicks = buildYAxisTicks(points);
  const graphMinY = yTicks.length > 0 ? Math.min(...yTicks.map((tick) => tick.value)) : minY;
  const graphMaxY = yTicks.length > 0 ? Math.max(...yTicks.map((tick) => tick.value)) : maxY;
  const ySpan = graphMaxY - graphMinY || 1;
  const toSvgX = (value: number) => padLeft + ((value - minX) / xSpan) * plotWidth;
  const toSvgY = (value: number) => height - padBottom - ((value - graphMinY) / ySpan) * plotHeight;
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toSvgX(point.x)} ${toSvgY(point.y)}`).join(' ');
  const xTicks = buildXAxisTicks(points);

  return (
    <section className={wrapperClassName}>
      <div className="graph-panel-header">
        <h2 id={titleId} className="section-kicker">
          {modeConfig.title}
        </h2>
        {selector}
        <p className="numeric-value text-xs text-[var(--quiet)]">{points.length} points</p>
      </div>
      <p className="sr-only">{graphSummary}</p>
      <p className="graph-summary-line">{visibleSummary}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={hero ? 'mt-3 h-[27rem] w-full max-h-[58vh]' : 'mt-3 h-56 w-full'}
        role="img"
        aria-labelledby={svgTitleId}
        aria-describedby={descId}
      >
        <title id={svgTitleId}>{modeConfig.title}</title>
        <desc id={descId}>{graphSummary}</desc>
        <defs>
          <linearGradient id={lineGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--action-blue)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="12" fill="var(--surface)" />
        {yTicks.map((tick) => (
          <line
            key={`grid-y-${tick.value}`}
            x1={padLeft}
            y1={toSvgY(tick.value)}
            x2={width - padRight}
            y2={toSvgY(tick.value)}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        {xTicks.map((tick) => (
          <line
            key={`grid-x-${tick.value}`}
            x1={toSvgX(tick.value)}
            y1={padTop}
            x2={toSvgX(tick.value)}
            y2={height - padBottom}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={height - padBottom}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        {yTicks.map((tick) => (
          <text
            key={`y-tick-${tick.value}`}
            x={padLeft - 8}
            y={toSvgY(tick.value)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {tick.label}
          </text>
        ))}
        {xTicks.map((tick) => (
          <text
            key={`x-tick-${tick.value}`}
            x={toSvgX(tick.value)}
            y={height - padBottom + 15}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {tick.label}
          </text>
        ))}
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
          x={14}
          y={height / 2}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted)"
          transform={`rotate(-90 14 ${height / 2})`}
        >
          {modeConfig.yAxisLabel}
        </text>
        <path d={path} fill="none" stroke={`url(#${lineGradientId})`} strokeWidth={hero ? '3' : '2.5'} />
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={toSvgX(point.x)}
            cy={toSvgY(point.y)}
            r={index === points.length - 1 ? '5' : '3.5'}
            fill={index === points.length - 1 ? 'var(--green)' : 'var(--action-blue)'}
          >
            <title>{graphPointTitle(point, mode)}</title>
          </circle>
        ))}
      </svg>
      <p className="graph-caption">{modeConfig.captionLead} {caption}</p>
    </section>
  );
}
