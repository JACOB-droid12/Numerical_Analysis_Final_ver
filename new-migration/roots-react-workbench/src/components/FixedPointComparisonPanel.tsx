import { useState } from 'react';

import {
  compareFixedPointFormulas,
  type FixedPointComparisonResult,
} from '../lib/methods/fixedPointComparison';
import { chopToSignificantDigits, roundToSignificantDigits } from '../lib/machineArithmetic/decimalMachine';
import { formatValue } from '../lib/resultFormatters';
import type { AngleMode, PrecisionDisplayConfig } from '../types/roots';

interface FixedPointComparisonPanelProps {
  angleMode: AngleMode;
  precisionDisplay: PrecisionDisplayConfig;
}

const FORMULA_LABELS = ['a', 'b', 'c', 'd'] as const;

function displayValue(value: number | null | undefined, precisionDisplay: PrecisionDisplayConfig) {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  if (precisionDisplay.mode === 'standard') return formatValue(value, 12);
  if (!Number.isInteger(precisionDisplay.digits) || precisionDisplay.digits < 1) return 'N/A';
  return precisionDisplay.mode === 'chop'
    ? chopToSignificantDigits(value, precisionDisplay.digits)
    : roundToSignificantDigits(value, precisionDisplay.digits);
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FixedPointComparisonPanel({
  angleMode,
  precisionDisplay,
}: FixedPointComparisonPanelProps) {
  const [p0, setP0] = useState('1');
  const [tolerance, setTolerance] = useState('1e-8');
  const [maxIterations, setMaxIterations] = useState('120');
  const [targetValue, setTargetValue] = useState('');
  const [formulas, setFormulas] = useState<Record<(typeof FORMULA_LABELS)[number], string>>({
    a: '',
    b: '',
    c: '',
    d: '',
  });
  const [result, setResult] = useState<FixedPointComparisonResult | null>(null);
  const [message, setMessage] = useState('');

  const updateFormula = (label: (typeof FORMULA_LABELS)[number], value: string) => {
    setFormulas((current) => ({ ...current, [label]: value }));
  };

  const runComparison = () => {
    const activeFormulas = FORMULA_LABELS
      .map((label) => ({ label, expression: formulas[label].trim() }))
      .filter((formula) => formula.expression.length > 0);
    const x0 = Number(p0);
    const toleranceValue = Number(tolerance);
    const maxIterationValue = Number(maxIterations);

    if (!Number.isFinite(x0)) {
      setResult(null);
      setMessage('Enter a finite p0 value.');
      return;
    }
    if (!Number.isFinite(toleranceValue) || toleranceValue <= 0) {
      setResult(null);
      setMessage('Enter a positive tolerance.');
      return;
    }
    if (!Number.isInteger(maxIterationValue) || maxIterationValue < 1) {
      setResult(null);
      setMessage('Enter a positive integer max iteration count.');
      return;
    }
    if (activeFormulas.length === 0) {
      setResult(null);
      setMessage('Enter at least one g(x) formula.');
      return;
    }

    const comparison = compareFixedPointFormulas({
      formulas: activeFormulas,
      x0,
      tolerance: toleranceValue,
      maxIterations: maxIterationValue,
      angleMode,
      targetValue: parseOptionalNumber(targetValue),
    });
    setResult(comparison);
    setMessage('');
  };

  return (
    <article className="classroom-card fixed-point-comparison" aria-label="Fixed Point Comparison tool">
      <h4>Fixed Point Comparison</h4>
      <p className="classroom-result">
        This tool compares manually entered fixed-point formulas. It does not parse full problem statements.
      </p>

      <div className="comparison-controls">
        <label className="field-row">
          <span>p0</span>
          <input
            aria-label="Fixed Point Comparison p0"
            className="field-control numeric-value"
            value={p0}
            onChange={(event) => setP0(event.target.value)}
          />
        </label>
        <label className="field-row">
          <span>Tolerance</span>
          <input
            aria-label="Fixed Point Comparison tolerance"
            className="field-control numeric-value"
            value={tolerance}
            onChange={(event) => setTolerance(event.target.value)}
          />
        </label>
        <label className="field-row">
          <span>Max iterations</span>
          <input
            aria-label="Fixed Point Comparison max iterations"
            className="field-control numeric-value"
            type="number"
            min="1"
            value={maxIterations}
            onChange={(event) => setMaxIterations(event.target.value)}
          />
        </label>
        <label className="field-row">
          <span>Target value</span>
          <input
            aria-label="Fixed Point Comparison target value"
            className="field-control numeric-value"
            value={targetValue}
            placeholder="optional"
            onChange={(event) => setTargetValue(event.target.value)}
          />
        </label>
      </div>

      <div className="comparison-formulas" aria-label="Fixed Point formula rows">
        {FORMULA_LABELS.map((label) => (
          <label className="field-row" key={label}>
            <span>({label}) g(x)</span>
            <input
              aria-label={`Formula (${label}) g(x)`}
              className="field-control"
              value={formulas[label]}
              onChange={(event) => updateFormula(label, event.target.value)}
            />
          </label>
        ))}
      </div>

      <button type="button" className="button-secondary comparison-run" onClick={runComparison}>
        Compare formulas
      </button>

      {message ? (
        <p className="status-text" role="alert">{message}</p>
      ) : null}

      {result ? (
        <div className="comparison-output">
          <p className="classroom-result">
            Ranking: <span>{result.ranking.map((entry) => `(${entry.label})`).join(', ')}</span>
          </p>

          <div className="table-shell comparison-table-shell">
            <table className="iteration-table comparison-table">
              <thead>
                <tr>
                  {result.tableHeaders.map((header) => (
                    <th key={header} scope="col">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.tableRows.map((row) => (
                  <tr key={row.n}>
                    <td>{row.n}</td>
                    {result.entries.map((entry) => (
                      <td key={entry.label}>{displayValue(row[entry.label], precisionDisplay)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="classroom-facts comparison-status-list">
            {result.entries.map((entry) => (
              <div key={entry.label}>
                <dt>({entry.label}): {entry.status}</dt>
                <dd>
                  p = {displayValue(entry.approximation, precisionDisplay)}
                  {entry.targetError == null
                    ? ''
                    : `; target error = ${displayValue(entry.targetError, precisionDisplay)}`}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </article>
  );
}
