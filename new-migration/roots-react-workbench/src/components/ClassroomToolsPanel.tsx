import { useMemo, useState } from 'react';

import {
  bisectionToleranceFromIterations,
  evaluateBracket,
  requiredBisectionIterations,
} from '../lib/classroom/bisectionHelpers';
import { chopToSignificantDigits, roundToSignificantDigits } from '../lib/machineArithmetic/decimalMachine';
import { formatValue } from '../lib/resultFormatters';
import type { AngleMode, MethodFormState, PrecisionDisplayConfig, PrecisionDisplayMode, RootMethod } from '../types/roots';

interface ClassroomToolsPanelProps {
  angleMode: AngleMode;
  formState: MethodFormState;
  method: RootMethod;
  precisionDisplay: PrecisionDisplayConfig;
  onPrecisionDisplayChange: (config: PrecisionDisplayConfig) => void;
}

function bracketFieldIds(method: RootMethod) {
  if (method === 'bisection') {
    return {
      expression: 'root-bis-expression',
      lower: 'root-bis-a',
      upper: 'root-bis-b',
    };
  }
  if (method === 'falsePosition') {
    return {
      expression: 'root-fp-expression',
      lower: 'root-fp-a',
      upper: 'root-fp-b',
    };
  }
  return null;
}

function signText(sign: string) {
  if (sign === 'negative') return '-';
  if (sign === 'positive') return '+';
  if (sign === 'zero') return '0';
  return 'N/A';
}

function formatPrecisionValue(value: number, mode: PrecisionDisplayMode, digits: number) {
  if (!Number.isFinite(value)) return 'N/A';
  if (mode === 'standard') return formatValue(value, 12);
  if (!Number.isInteger(digits) || digits < 1) return 'N/A';
  return mode === 'chop'
    ? chopToSignificantDigits(value, digits)
    : roundToSignificantDigits(value, digits);
}

function precisionModeLabel(mode: PrecisionDisplayMode) {
  if (mode === 'chop') return 'Chopping';
  if (mode === 'round') return 'Rounding';
  return 'Standard';
}

export function ClassroomToolsPanel({
  angleMode,
  formState,
  method,
  precisionDisplay,
  onPrecisionDisplayChange,
}: ClassroomToolsPanelProps) {
  const [epsilonInput, setEpsilonInput] = useState('0.01');
  const [iterationInput, setIterationInput] = useState('7');
  const [digitsInput, setDigitsInput] = useState(String(precisionDisplay.digits));

  const bracketFields = bracketFieldIds(method);
  const expression = bracketFields ? formState[bracketFields.expression] ?? '' : '';
  const lower = bracketFields ? Number(formState[bracketFields.lower]) : Number.NaN;
  const upper = bracketFields ? Number(formState[bracketFields.upper]) : Number.NaN;
  const epsilon = Number(epsilonInput);
  const iterations = Number(iterationInput);
  const precisionMode = precisionDisplay.mode;
  const digits = Number(digitsInput);
  const showBisectionHelper = method === 'bisection';

  const bracketEvaluation = useMemo(
    () => bracketFields ? evaluateBracket(expression, lower, upper, angleMode) : null,
    [angleMode, bracketFields, expression, lower, upper],
  );

  const requiredIterations = useMemo(() => {
    try {
      return requiredBisectionIterations(lower, upper, epsilon);
    } catch {
      return null;
    }
  }, [epsilon, lower, upper]);

  const guaranteedTolerance = useMemo(() => {
    try {
      return bisectionToleranceFromIterations(lower, upper, iterations);
    } catch {
      return null;
    }
  }, [iterations, lower, upper]);

  const piPreview = useMemo(() => {
    if (!Number.isInteger(digits) || digits < 1) {
      return 'Enter a positive digit count.';
    }
    if (precisionMode === 'chop') {
      return chopToSignificantDigits('3.141592653589793238462643383279', digits);
    }
    if (precisionMode === 'round') {
      return roundToSignificantDigits('3.141592653589793238462643383279', digits);
    }
    return '3.141592653589793238462643383279';
  }, [digits, precisionMode]);

  const updatePrecisionMode = (mode: PrecisionDisplayMode) => {
    onPrecisionDisplayChange({
      mode,
      digits: Number.isInteger(digits) && digits > 0 ? digits : precisionDisplay.digits,
    });
  };

  const updateDigits = (value: string) => {
    setDigitsInput(value);
    const nextDigits = Number(value);
    if (Number.isInteger(nextDigits) && nextDigits > 0) {
      onPrecisionDisplayChange({ mode: precisionMode, digits: nextDigits });
    }
  };

  return (
    <section className="classroom-tools" aria-label="Classroom project helpers">
      <div>
        <h3 className="section-kicker">Classroom tools</h3>
        <p className="muted-copy mt-1 text-sm">
          Standard mode uses normal JavaScript/math.js arithmetic. Chopping and rounding simulate decimal
          machine arithmetic for classroom display only. Root-method calculations still use their normal
          arithmetic. Approx. Error is based on successive approximations, not true error unless the exact
          root is known.
        </p>
      </div>

      <div className="classroom-grid">
        <article className="classroom-card">
          <h4>Precision / Machine Arithmetic</h4>
          <div className="segment classroom-segment" aria-label="Machine arithmetic mode">
            {(['standard', 'chop', 'round'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={precisionMode === mode ? 'active' : ''}
                onClick={() => updatePrecisionMode(mode)}
              >
                {mode === 'standard' ? 'Standard' : mode === 'chop' ? 'Chopping' : 'Rounding'}
              </button>
            ))}
          </div>
          <label className="field-row mt-3">
            <span>Significant digits</span>
            <input
              className="field-control numeric-value"
              type="number"
              min="1"
              value={digitsInput}
              onChange={(event) => updateDigits(event.target.value)}
            />
          </label>
          <p className="classroom-result">π preview: <span>{piPreview}</span></p>
          <p className="classroom-result">
            Helper values shown in: <span>{precisionModeLabel(precisionMode)}</span>
          </p>
        </article>

        {bracketFields ? (
          <>
            <article className="classroom-card">
              <h4>Bracket signs</h4>
              {bracketEvaluation?.ok ? (
                <dl className="classroom-facts">
                  <div>
                    <dt>f(a)</dt>
                    <dd>{formatPrecisionValue(bracketEvaluation.fLower, precisionMode, digits)} ({signText(bracketEvaluation.lowerSign)})</dd>
                  </div>
                  <div>
                    <dt>f(b)</dt>
                    <dd>{formatPrecisionValue(bracketEvaluation.fUpper, precisionMode, digits)} ({signText(bracketEvaluation.upperSign)})</dd>
                  </div>
                  <div>
                    <dt>f(a) · f(b) &lt; 0</dt>
                    <dd>{bracketEvaluation.hasSignChange ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>IVT bracket</dt>
                    <dd>{bracketEvaluation.bracketSatisfied ? 'Satisfied' : 'Not satisfied'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="classroom-result">{bracketEvaluation?.message ?? 'Select a bracket method.'}</p>
              )}
            </article>

            {showBisectionHelper ? (
            <article className="classroom-card">
              <h4>Bisection helper</h4>
              <label className="field-row">
                <span>Desired ε</span>
                <input
                  className="field-control numeric-value"
                  value={epsilonInput}
                  onChange={(event) => setEpsilonInput(event.target.value)}
                />
              </label>
              <p className="classroom-result">
                N = ceil(log₂((b - a) / ε)): <span>{requiredIterations ?? 'N/A'}</span>
              </p>
              <label className="field-row">
                <span>Iterations N</span>
                <input
                  className="field-control numeric-value"
                  type="number"
                  min="0"
                  value={iterationInput}
                  onChange={(event) => setIterationInput(event.target.value)}
                />
              </label>
              <p className="classroom-result">
                ε = (b - a) / 2^N: <span>{guaranteedTolerance == null ? 'N/A' : formatPrecisionValue(guaranteedTolerance, precisionMode, digits)}</span>
              </p>
            </article>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
