import { useMemo, useState } from 'react';

import {
  bisectionToleranceFromIterations,
  evaluateBracket,
  requiredBisectionIterations,
} from '../lib/classroom/bisectionHelpers';
import { chopToSignificantDigits, roundToSignificantDigits } from '../lib/machineArithmetic/decimalMachine';
import { formatValue } from '../lib/resultFormatters';
import type { RootEngineMode } from '../lib/rootEngineSelector';
import type { AngleMode, MethodFormState, PrecisionDisplayConfig, PrecisionDisplayMode, RootMethod } from '../types/roots';

interface ClassroomToolsPanelProps {
  angleMode: AngleMode;
  engineMode: RootEngineMode;
  formState: MethodFormState;
  method: RootMethod;
  precisionDisplay: PrecisionDisplayConfig;
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
  engineMode,
  formState,
  method,
  precisionDisplay,
}: ClassroomToolsPanelProps) {
  const [epsilonInput, setEpsilonInput] = useState('0.01');
  const [iterationInput, setIterationInput] = useState('7');

  const bracketFields = bracketFieldIds(method);
  const expression = bracketFields ? formState[bracketFields.expression] ?? '' : '';
  const lower = bracketFields ? Number(formState[bracketFields.lower]) : Number.NaN;
  const upper = bracketFields ? Number(formState[bracketFields.upper]) : Number.NaN;
  const epsilon = Number(epsilonInput);
  const iterations = Number(iterationInput);
  const precisionMode = precisionDisplay.mode;
  const digits = precisionDisplay.digits;
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

  return (
    <details className="classroom-tools" aria-label="Classroom project helpers">
      <summary>
        <span className="section-kicker">Classroom tools</span>
        <span className="muted-copy">Precision preview and method checks</span>
      </summary>

      <div className="classroom-tools-body">
        <p className="muted-copy text-sm">
          {engineMode === 'legacy'
            ? 'Stable engine: Digits and Rule affect method calculations.'
            : 'Modern beta/testing: Digits and Rule format displayed final root, table, and CSV values only. Internal calculations use standard precision.'}
          {' '}Approx. Error is based on successive approximations, not true error unless the exact root is known.
        </p>

        <div className="classroom-grid">
        <article className="classroom-card">
          <h4>Precision preview</h4>
          <p className="classroom-result">π preview: <span>{piPreview}</span></p>
          <p className="classroom-result">
            Current display: <span>{digits} digits · {precisionModeLabel(precisionMode)}</span>
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
                    <dt>sgn(f(a))sgn(f(b)) &lt; 0</dt>
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
                  id="bisection-helper-epsilon"
                  name="bisection-helper-epsilon"
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
                  id="bisection-helper-iterations"
                  name="bisection-helper-iterations"
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
      </div>
    </details>
  );
}
