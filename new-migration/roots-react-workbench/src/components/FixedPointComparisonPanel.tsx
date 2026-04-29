import { useState } from 'react';

import {
  compareFixedPointFormulas,
  type FixedPointComparisonResult,
} from '../lib/methods/fixedPointComparison';
import { chopToSignificantDigits, roundToSignificantDigits } from '../lib/machineArithmetic/decimalMachine';
import { evaluateExpression } from '../lib/math/evaluator';
import { formatValue } from '../lib/resultFormatters';
import type { AngleMode, PrecisionDisplayConfig } from '../types/roots';

interface FixedPointComparisonPanelProps {
  angleMode: AngleMode;
  precisionDisplay: PrecisionDisplayConfig;
}

const FORMULA_LABELS = ['a', 'b', 'c', 'd'] as const;
const FIXED_POINT_COMPARISON_DEMO = {
  p0: '1',
  targetValue: '21^(1/3)',
  formulas: {
    a: '(20*x + 21 / x^2) / 21',
    b: 'x - (x^3 - 21) / (3*x^2)',
    c: 'x - (x^3 - 21*x) / (x^2 - 21)',
    d: 'sqrt(21 / x)',
  },
};

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
  if (Number.isFinite(parsed)) return parsed;

  const evaluated = evaluateExpression(trimmed, {}, {
    angleMode: 'rad',
    mode: 'legacy-compatible',
    allowComplex: false,
    allowNonFinite: false,
  });
  if (!evaluated.ok || typeof evaluated.value !== 'number' || !Number.isFinite(evaluated.value)) {
    return undefined;
  }

  return evaluated.value;
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

  const loadComparisonDemo = () => {
    setP0(FIXED_POINT_COMPARISON_DEMO.p0);
    setTolerance('1e-8');
    setMaxIterations('120');
    setTargetValue(FIXED_POINT_COMPARISON_DEMO.targetValue);
    setFormulas(FIXED_POINT_COMPARISON_DEMO.formulas);
    setResult(null);
    setMessage('');
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
      setMessage('Enter a real starting value for p0, such as 1.');
      return;
    }
    if (!Number.isFinite(toleranceValue) || toleranceValue <= 0) {
      setResult(null);
      setMessage('Enter a positive tolerance, such as 1e-8.');
      return;
    }
    if (!Number.isInteger(maxIterationValue) || maxIterationValue < 1) {
      setResult(null);
      setMessage('Enter a whole-number max iteration count of 1 or more.');
      return;
    }
    if (activeFormulas.length === 0) {
      setResult(null);
      setMessage('Enter at least one g(x) formula before comparing.');
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
    setMessage(
      comparison.entries.every((entry) => entry.status === 'undefined')
        ? 'None of the entered formulas produced a usable fixed-point iteration. Check each g(x) formula and try one valid formula at a time.'
        : '',
    );
  };

  return (
    <article className="classroom-card fixed-point-comparison" aria-label="Fixed Point Comparison tool">
      <h4>Fixed Point Comparison</h4>
      <p className="classroom-result">
        This tool compares manually entered fixed-point formulas. It does not parse full problem statements.
      </p>
      <div className="demo-loader-strip" aria-label="Fixed Point comparison demo loader">
        <button type="button" className="demo-loader-chip" onClick={loadComparisonDemo}>
          Load Fixed Point comparison demo
        </button>
      </div>
      <p className="demo-loader-note">
        Examples only fill inputs. You still choose when to run the calculation.
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
