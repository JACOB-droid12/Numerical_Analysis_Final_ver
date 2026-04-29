import { useId, useMemo, useState } from 'react';

import {
  buildMethodViewModel,
  type MethodViewIntervalBand,
  type MethodViewModel,
  type MethodViewPoint,
  type MethodViewSegment,
} from '../lib/methodView/buildMethodViewModel';
import type { RootRunResult } from '../types/roots';

interface MethodViewGraphProps {
  run: RootRunResult;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const WIDTH = 640;
const HEIGHT = 320;
const PAD_LEFT = 58;
const PAD_RIGHT = 24;
const PAD_TOP = 24;
const PAD_BOTTOM = 44;

function formatMethodViewValue(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  if (Object.is(value, -0) || value === 0) return '0';

  const absolute = Math.abs(value);
  if (absolute < 0.0001 || absolute >= 1_000_000) {
    return value.toExponential(2).replace('e+', 'e');
  }

  return value.toFixed(4).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
}

function availableIterations(run: RootRunResult): number[] {
  return (run.rows ?? [])
    .map((row) => row.iteration)
    .filter((iteration): iteration is number => Number.isFinite(iteration));
}

function defaultIterationFor(run: RootRunResult): number {
  const iterations = availableIterations(run);
  return iterations[iterations.length - 1] ?? 1;
}

function boundsFor(model: MethodViewModel): Bounds {
  const xs = [
    model.sampleDomain.min,
    model.sampleDomain.max,
    ...model.functionSamples.map((sample) => sample.x),
    ...model.points.map((point) => point.x),
  ];
  const ys = [
    0,
    ...model.functionSamples.map((sample) => sample.y),
    ...model.points.map((point) => point.y),
  ];

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ySpan = maxY - minY || Math.max(1, Math.abs(maxY));

  return {
    minX,
    maxX,
    minY: minY - ySpan * 0.08,
    maxY: maxY + ySpan * 0.08,
  };
}

function pathFor(
  samples: Array<{ x: number; y: number }>,
  toSvgX: (value: number) => number,
  toSvgY: (value: number) => number,
): string {
  return samples
    .map((sample, index) => `${index === 0 ? 'M' : 'L'} ${toSvgX(sample.x)} ${toSvgY(sample.y)}`)
    .join(' ');
}

function bandFill(kind: MethodViewIntervalBand['kind']): string {
  return kind === 'kept-interval' ? 'rgba(30, 126, 85, 0.18)' : 'rgba(31, 111, 235, 0.1)';
}

function segmentStroke(kind: MethodViewSegment['kind']): string {
  if (kind === 'axis') return 'var(--line-strong)';
  if (kind === 'construction') return 'var(--green)';
  return 'var(--muted)';
}

function pointFill(kind: MethodViewPoint['kind']): string {
  return kind === 'midpoint' || kind === 'root-estimate' ? 'var(--green)' : 'var(--action-blue)';
}

function methodViewTitle(run: RootRunResult): string {
  return run.method === 'falsePosition' ? 'False Position Method View' : 'Bisection Method View';
}

function methodViewSummary(run: RootRunResult, selectedIteration: number): string {
  return run.method === 'falsePosition'
    ? `Geometry for iteration ${selectedIteration}: f(x), bracket, interpolation line, x-intercept, and kept interval.`
    : `Geometry for iteration ${selectedIteration}: f(x), bracket, midpoint, and kept interval.`;
}

function methodViewDescription(run: RootRunResult): string {
  return run.method === 'falsePosition'
    ? 'False Position geometry showing y equals f of x, the current interval, interpolation line, x-intercept, and kept interval.'
    : 'Bisection geometry showing y equals f of x, the current interval, midpoint, and kept interval.';
}

export function MethodViewGraph({ run }: MethodViewGraphProps) {
  const titleId = useId();
  const descId = useId();
  const curveGradientId = `${titleId.replace(/[^a-zA-Z0-9_-]/g, '')}-curve`;
  const [requestedIteration, setRequestedIteration] = useState<number | null>(null);
  const iterations = availableIterations(run);
  const selectedIteration = iterations.includes(requestedIteration ?? Number.NaN)
    ? requestedIteration as number
    : defaultIterationFor(run);
  const model = useMemo(
    () => buildMethodViewModel(run, selectedIteration),
    [run, selectedIteration],
  );
  const title = methodViewTitle(run);

  if (model.emptyReason) {
    return (
      <section className="method-view-panel" aria-label={title}>
        <div className="graph-panel-header">
          <h2 id={titleId} className="section-kicker">{title}</h2>
        </div>
        <p className="mt-3 text-sm text-[var(--text)]">{model.emptyReason}</p>
      </section>
    );
  }

  const bounds = boundsFor(model);
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const xSpan = bounds.maxX - bounds.minX || 1;
  const ySpan = bounds.maxY - bounds.minY || 1;
  const toSvgX = (value: number) => PAD_LEFT + ((value - bounds.minX) / xSpan) * plotWidth;
  const toSvgY = (value: number) => HEIGHT - PAD_BOTTOM - ((value - bounds.minY) / ySpan) * plotHeight;
  const curvePath = pathFor(model.functionSamples, toSvgX, toSvgY);
  const xTicks = [bounds.minX, (bounds.minX + bounds.maxX) / 2, bounds.maxX];
  const yTicks = [bounds.minY, 0, bounds.maxY]
    .filter((value, index, values) => values.findIndex((candidate) => Math.abs(candidate - value) < 1e-12) === index);

  return (
    <section className="method-view-panel" aria-label={title}>
      <div className="graph-panel-header">
        <div>
          <h2 id={titleId} className="section-kicker">{title}</h2>
          <p className="graph-summary-line">{methodViewSummary(run, selectedIteration)}</p>
        </div>
        {iterations.length > 1 ? (
          <label className="method-view-iteration">
            <span>Iteration</span>
            <select
              value={selectedIteration}
              onChange={(event) => setRequestedIteration(Number(event.target.value))}
            >
              {iterations.map((iteration) => (
                <option key={iteration} value={iteration}>{iteration}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="method-view-svg"
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <desc id={descId}>{methodViewDescription(run)}</desc>
        <defs>
          <linearGradient id={curveGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--action-blue)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="12" fill="var(--surface)" />

        {model.intervalBands.map((band) => (
          <rect
            key={band.id}
            x={toSvgX(band.fromX)}
            y={PAD_TOP}
            width={Math.max(1, toSvgX(band.toX) - toSvgX(band.fromX))}
            height={plotHeight}
            fill={bandFill(band.kind)}
          >
            <title>{band.label}</title>
          </rect>
        ))}

        {yTicks.map((tick) => (
          <line
            key={`y-${tick}`}
            x1={PAD_LEFT}
            y1={toSvgY(tick)}
            x2={WIDTH - PAD_RIGHT}
            y2={toSvgY(tick)}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        {xTicks.map((tick) => (
          <line
            key={`x-${tick}`}
            x1={toSvgX(tick)}
            y1={PAD_TOP}
            x2={toSvgX(tick)}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}

        {model.segments.map((segment) => (
          <line
            key={segment.id}
            x1={toSvgX(segment.from.x)}
            y1={toSvgY(segment.from.y)}
            x2={toSvgX(segment.to.x)}
            y2={toSvgY(segment.to.y)}
            stroke={segmentStroke(segment.kind)}
            strokeWidth={segment.kind === 'axis' ? '1.2' : '1.4'}
            strokeDasharray={segment.kind === 'axis' ? undefined : '4 4'}
          >
            <title>{segment.label}</title>
          </line>
        ))}

        <path d={curvePath} fill="none" stroke={`url(#${curveGradientId})`} strokeWidth="2.5" />

        {model.points.map((point) => (
          <g key={point.id}>
            <circle
              cx={toSvgX(point.x)}
              cy={toSvgY(point.y)}
              r={point.kind === 'midpoint' ? '5' : '4'}
              fill={pointFill(point.kind)}
            >
              <title>{`${point.label}: (${formatMethodViewValue(point.x)}, ${formatMethodViewValue(point.y)})`}</title>
            </circle>
            <text
              x={toSvgX(point.x)}
              y={toSvgY(point.y) - 10}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text)"
            >
              {point.label}
            </text>
          </g>
        ))}

        {xTicks.map((tick) => (
          <text
            key={`x-label-${tick}`}
            x={toSvgX(tick)}
            y={HEIGHT - PAD_BOTTOM + 18}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {formatMethodViewValue(tick)}
          </text>
        ))}
        {yTicks.map((tick) => (
          <text
            key={`y-label-${tick}`}
            x={PAD_LEFT - 8}
            y={toSvgY(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {formatMethodViewValue(tick)}
          </text>
        ))}
        <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">x</text>
        <text
          x={16}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted)"
          transform={`rotate(-90 16 ${HEIGHT / 2})`}
        >
          f(x)
        </text>
      </svg>

      <div className="method-view-legend" aria-label={`${title} details`}>
        {model.intervalBands.map((band) => (
          <span key={band.id}>{band.label}</span>
        ))}
      </div>
      <ul className="method-view-annotations">
        {model.annotations.map((annotation) => (
          <li key={annotation}>{annotation}</li>
        ))}
      </ul>
    </section>
  );
}
