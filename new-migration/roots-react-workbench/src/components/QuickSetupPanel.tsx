import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';

import type { MethodFormState, RootMethod, StoppingKind } from '../types/roots';
import { Button } from './ui/Button';

type QuickSetupMethod = Extract<RootMethod, 'bisection' | 'newton' | 'fixedPoint'>;
type NewtonDerivativeMode = 'auto' | 'provided';

interface QuickSetupPanelProps {
  onRun: (method: RootMethod, values: MethodFormState) => void;
}

interface QuickSetupFields {
  bisectionExpression: string;
  bisectionA: string;
  bisectionB: string;
  bisectionStopValue: string;
  newtonExpression: string;
  newtonX0: string;
  newtonStopValue: string;
  newtonDerivative: string;
  fixedPointExpression: string;
  fixedPointP0: string;
  fixedPointStopValue: string;
}

const methodLabels: Record<QuickSetupMethod, string> = {
  bisection: 'Bisection',
  newton: 'Newton-Raphson',
  fixedPoint: 'Fixed Point',
};

const methodAriaLabels: Record<QuickSetupMethod, string> = {
  bisection: 'Bisection quick setup',
  newton: 'Newton-Raphson quick setup',
  fixedPoint: 'Fixed Point quick setup',
};

const initialFields: QuickSetupFields = {
  bisectionExpression: '',
  bisectionA: '',
  bisectionB: '',
  bisectionStopValue: '',
  newtonExpression: '',
  newtonX0: '',
  newtonStopValue: '',
  newtonDerivative: '',
  fixedPointExpression: '',
  fixedPointP0: '',
  fixedPointStopValue: '',
};

const initialStopKinds: Record<QuickSetupMethod, StoppingKind> = {
  bisection: 'iterations',
  newton: 'iterations',
  fixedPoint: 'iterations',
};

function hasValue(value: string) {
  return value.trim().length > 0;
}

export function QuickSetupPanel({ onRun }: QuickSetupPanelProps) {
  const [activeMethod, setActiveMethod] = useState<QuickSetupMethod>('bisection');
  const [fields, setFields] = useState<QuickSetupFields>(initialFields);
  const [stopKinds, setStopKinds] =
    useState<Record<QuickSetupMethod, StoppingKind>>(initialStopKinds);
  const [newtonDerivativeMode, setNewtonDerivativeMode] =
    useState<NewtonDerivativeMode>('auto');

  const updateField = (field: keyof QuickSetupFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
  };

  const updateStopKind = (method: QuickSetupMethod, value: StoppingKind) => {
    setStopKinds((current) => ({ ...current, [method]: value }));
  };

  const canRun = useMemo(() => {
    if (activeMethod === 'bisection') {
      return (
        hasValue(fields.bisectionExpression) &&
        hasValue(fields.bisectionA) &&
        hasValue(fields.bisectionB) &&
        hasValue(fields.bisectionStopValue)
      );
    }

    if (activeMethod === 'newton') {
      return (
        hasValue(fields.newtonExpression) &&
        hasValue(fields.newtonX0) &&
        hasValue(fields.newtonStopValue) &&
        (newtonDerivativeMode === 'auto' || hasValue(fields.newtonDerivative))
      );
    }

    return (
      hasValue(fields.fixedPointExpression) &&
      hasValue(fields.fixedPointP0) &&
      hasValue(fields.fixedPointStopValue)
    );
  }, [activeMethod, fields, newtonDerivativeMode]);

  const buildRunValues = (): MethodFormState | null => {
    if (!canRun) {
      return null;
    }

    if (activeMethod === 'bisection') {
      return {
        'root-bis-expression': fields.bisectionExpression.trim(),
        'root-bis-a': fields.bisectionA.trim(),
        'root-bis-b': fields.bisectionB.trim(),
        'root-bis-scan-enabled': 'no',
        'root-bis-scan-min': '',
        'root-bis-scan-max': '',
        'root-bis-scan-steps': '',
        'root-bis-k': '8',
        'root-bis-mode': 'round',
        'root-bis-stop-kind': stopKinds.bisection,
        'root-bis-stop-value': fields.bisectionStopValue.trim(),
        'root-bis-sign-display': 'both',
        'root-bis-decision-basis': 'machine',
      };
    }

    if (activeMethod === 'newton') {
      return {
        'root-newton-expression': fields.newtonExpression.trim(),
        'root-newton-df':
          newtonDerivativeMode === 'provided' ? fields.newtonDerivative.trim() : 'auto',
        'root-newton-x0': fields.newtonX0.trim(),
        'root-newton-a': '',
        'root-newton-b': '',
        'root-newton-initial-strategy': 'manual',
        'root-newton-k': '8',
        'root-newton-mode': 'round',
        'root-newton-stop-kind': stopKinds.newton,
        'root-newton-stop-value': fields.newtonStopValue.trim(),
      };
    }

    return {
      'root-fpi-expression': fields.fixedPointExpression.trim(),
      'root-fpi-x0': fields.fixedPointP0.trim(),
      'root-fpi-target-expression': '',
      'root-fpi-seeds': '',
      'root-fpi-batch-expressions': '',
      'root-fpi-scan-min': '',
      'root-fpi-scan-max': '',
      'root-fpi-scan-steps': '8',
      'root-fpi-k': '8',
      'root-fpi-mode': 'round',
      'root-fpi-stop-kind': stopKinds.fixedPoint,
      'root-fpi-stop-value': fields.fixedPointStopValue.trim(),
    };
  };

  const runQuickSetup = () => {
    const values = buildRunValues();

    if (!values) {
      return;
    }

    onRun(activeMethod, values);
  };

  return (
    <section className="calculator-notebook" aria-labelledby="quick-setup-heading">
      <div className="expression-label-row">
        <h2 id="quick-setup-heading" className="math-label">
          Quick Setup
        </h2>
        <span className="section-kicker">Manual inputs</span>
      </div>

      <p className="muted-copy">
        Quick Setup is calculator-style. It does not parse full problem statements.
      </p>

      <div className="method-list" aria-label="Quick Setup methods">
        {(['bisection', 'newton', 'fixedPoint'] as const).map((method) => (
          <button
            key={method}
            type="button"
            aria-label={methodAriaLabels[method]}
            aria-pressed={activeMethod === method}
            className="method-tab"
            onClick={() => setActiveMethod(method)}
          >
            <span className="method-name">{methodLabels[method]}</span>
          </button>
        ))}
      </div>

      {activeMethod === 'bisection' ? (
        <div className="field-stack">
          <label className="field-row">
            <span>f(x)</span>
            <input
              aria-label="Quick Setup Bisection f(x)"
              className="field-control numeric-value"
              type="text"
              value={fields.bisectionExpression}
              onChange={(event) => updateField('bisectionExpression', event.target.value)}
            />
          </label>
          <div className="parameter-grid">
            <label className="field-row">
              <span>a</span>
              <input
                aria-label="Quick Setup Bisection a"
                className="field-control numeric-value"
                type="text"
                value={fields.bisectionA}
                onChange={(event) => updateField('bisectionA', event.target.value)}
              />
            </label>
            <label className="field-row">
              <span>b</span>
              <input
                aria-label="Quick Setup Bisection b"
                className="field-control numeric-value"
                type="text"
                value={fields.bisectionB}
                onChange={(event) => updateField('bisectionB', event.target.value)}
              />
            </label>
          </div>
          <label className="field-row">
            <span>Stop by</span>
            <select
              aria-label="Quick Setup Bisection stop by"
              className="field-control numeric-value"
              value={stopKinds.bisection}
              onChange={(event) =>
                updateStopKind('bisection', event.target.value as StoppingKind)
              }
            >
              <option value="iterations">Iterations</option>
              <option value="epsilon">Tolerance</option>
            </select>
          </label>
          <label className="field-row">
            <span>Stop value</span>
            <input
              aria-label="Quick Setup Bisection stop value"
              className="field-control numeric-value"
              type="text"
              value={fields.bisectionStopValue}
              onChange={(event) => updateField('bisectionStopValue', event.target.value)}
            />
          </label>
        </div>
      ) : null}

      {activeMethod === 'newton' ? (
        <div className="field-stack">
          <label className="field-row">
            <span>f(x)</span>
            <input
              aria-label="Quick Setup Newton-Raphson f(x)"
              className="field-control numeric-value"
              type="text"
              value={fields.newtonExpression}
              onChange={(event) => updateField('newtonExpression', event.target.value)}
            />
          </label>
          <label className="field-row">
            <span>x0</span>
            <input
              aria-label="Quick Setup Newton-Raphson x0"
              className="field-control numeric-value"
              type="text"
              value={fields.newtonX0}
              onChange={(event) => updateField('newtonX0', event.target.value)}
            />
          </label>
          <label className="field-row">
            <span>Stop by</span>
            <select
              aria-label="Quick Setup Newton-Raphson stop by"
              className="field-control numeric-value"
              value={stopKinds.newton}
              onChange={(event) =>
                updateStopKind('newton', event.target.value as StoppingKind)
              }
            >
              <option value="iterations">Iterations</option>
              <option value="epsilon">Tolerance</option>
            </select>
          </label>
          <label className="field-row">
            <span>Stop value</span>
            <input
              aria-label="Quick Setup Newton-Raphson stop value"
              className="field-control numeric-value"
              type="text"
              value={fields.newtonStopValue}
              onChange={(event) => updateField('newtonStopValue', event.target.value)}
            />
          </label>
          <div className="segmented-row">
            <span>Derivative</span>
            <div className="segment">
              <button
                type="button"
                className={newtonDerivativeMode === 'auto' ? 'active' : ''}
                onClick={() => setNewtonDerivativeMode('auto')}
              >
                Auto
              </button>
              <button
                type="button"
                className={newtonDerivativeMode === 'provided' ? 'active' : ''}
                onClick={() => setNewtonDerivativeMode('provided')}
              >
                Provided
              </button>
            </div>
          </div>
          {newtonDerivativeMode === 'provided' ? (
            <label className="field-row">
              <span>f'(x)</span>
              <input
                aria-label="Quick Setup Newton-Raphson derivative"
                className="field-control numeric-value"
                type="text"
                value={fields.newtonDerivative}
                onChange={(event) => updateField('newtonDerivative', event.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {activeMethod === 'fixedPoint' ? (
        <div className="field-stack">
          <label className="field-row">
            <span>g(x)</span>
            <input
              aria-label="Quick Setup Fixed Point g(x)"
              className="field-control numeric-value"
              type="text"
              value={fields.fixedPointExpression}
              onChange={(event) => updateField('fixedPointExpression', event.target.value)}
            />
          </label>
          <label className="field-row">
            <span>p0</span>
            <input
              aria-label="Quick Setup Fixed Point p0"
              className="field-control numeric-value"
              type="text"
              value={fields.fixedPointP0}
              onChange={(event) => updateField('fixedPointP0', event.target.value)}
            />
          </label>
          <label className="field-row">
            <span>Stop by</span>
            <select
              aria-label="Quick Setup Fixed Point stop by"
              className="field-control numeric-value"
              value={stopKinds.fixedPoint}
              onChange={(event) =>
                updateStopKind('fixedPoint', event.target.value as StoppingKind)
              }
            >
              <option value="iterations">Iterations</option>
              <option value="epsilon">Tolerance</option>
            </select>
          </label>
          <label className="field-row">
            <span>Stop value</span>
            <input
              aria-label="Quick Setup Fixed Point stop value"
              className="field-control numeric-value"
              type="text"
              value={fields.fixedPointStopValue}
              onChange={(event) => updateField('fixedPointStopValue', event.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div className="run-row">
        <Button className="run-primary" disabled={!canRun} onClick={runQuickSetup}>
          <Play aria-hidden="true" className="size-4" />
          Run Table
        </Button>
      </div>
    </section>
  );
}
