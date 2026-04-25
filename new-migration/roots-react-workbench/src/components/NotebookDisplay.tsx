import type { AngleMode, MethodConfig, MethodFieldConfig, MethodFormState } from '../types/roots';

interface NotebookDisplayProps {
  angleMode: AngleMode;
  config: MethodConfig;
  formState: MethodFormState;
}

function isVisible(field: MethodFieldConfig, formState: MethodFormState) {
  return field.when ? field.when(formState) : true;
}

function displayValue(field: MethodFieldConfig | undefined, formState: MethodFormState) {
  if (!field) return '-';
  const value = formState[field.id]?.trim();
  return value || '-';
}

function isPrecisionField(field: MethodFieldConfig) {
  return (
    field.id.endsWith('-k') ||
    field.id.endsWith('-mode') ||
    field.id.endsWith('-stop-kind') ||
    field.id.endsWith('-stop-value') ||
    field.id.endsWith('-tolerance-type') ||
    field.id.endsWith('-sign-display') ||
    field.id.endsWith('-decision-basis')
  );
}

function equationLine(config: MethodConfig, expression: string) {
  if (config.method === 'fixedPoint') return `x next = ${expression}`;
  return `${config.expressionLabel} = ${expression}`;
}

function stopLine(kind: string, value: string) {
  if (kind === 'epsilon') return `epsilon = ${value}`;
  return `n = ${value}`;
}

export function NotebookDisplay({ angleMode, config, formState }: NotebookDisplayProps) {
  const visibleFields = config.fields.filter((field) => isVisible(field, formState));
  const expressionField = visibleFields.find((field) => field.id === config.expressionFieldId);
  const expression = displayValue(expressionField, formState);
  const setupFields = visibleFields.filter(
    (field) =>
      field.id !== config.expressionFieldId &&
      !field.advanced &&
      !isPrecisionField(field),
  );
  const digitsField = visibleFields.find((field) => field.id.endsWith('-k'));
  const modeField = visibleFields.find((field) => field.id.endsWith('-mode'));
  const stopKindField = visibleFields.find((field) => field.id.endsWith('-stop-kind'));
  const stopValueField = visibleFields.find((field) => field.id.endsWith('-stop-value'));
  const stopKind = displayValue(stopKindField, formState);
  const stopValue = displayValue(stopValueField, formState);
  const mode = displayValue(modeField, formState);

  return (
    <aside className="calculator-notebook" aria-label="Calculator display">
      <div className="notebook-topline">
        <span>{config.shortLabel}</span>
        <span>{angleMode.toUpperCase()}</span>
      </div>

      <div className="notebook-screen">
        <span className="result-label">Input</span>
        <p className="notebook-equation">{equationLine(config, expression)}</p>
      </div>

      {setupFields.length ? (
        <dl className="notebook-setup">
          {setupFields.map((field) => (
            <div key={field.id}>
              <dt>{field.label}</dt>
              <dd>{displayValue(field, formState)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="notebook-tape" aria-label="Machine settings">
        <span>k = {displayValue(digitsField, formState)}</span>
        <span>{mode === 'chop' ? 'chopping' : 'rounding'}</span>
        <span>{stopLine(stopKind, stopValue)}</span>
      </div>
    </aside>
  );
}
