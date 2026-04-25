import { useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, Maximize2 } from 'lucide-react';

import type {
  MethodConfig,
  MethodFieldConfig,
  MethodFormState,
  RootMethod,
} from '../types/roots';
import { SymbolInsertBar } from './SymbolInsertBar';

interface MethodFormProps {
  config: MethodConfig;
  formState: MethodFormState;
  onChange: (method: RootMethod, fieldId: string, value: string) => void;
}

function isVisible(field: MethodFieldConfig, formState: MethodFormState) {
  return field.when ? field.when(formState) : true;
}

export function MethodForm({ config, formState, onChange }: MethodFormProps) {
  const expressionRef = useRef<HTMLInputElement | null>(null);

  const visibleFields = useMemo(
    () => config.fields.filter((field) => isVisible(field, formState)),
    [config.fields, formState],
  );

  const primaryField = visibleFields.find((field) => field.id === config.expressionFieldId);
  const detailFields = visibleFields.filter(
    (field) =>
      field.id !== config.expressionFieldId &&
      !field.advanced &&
      !field.id.endsWith('-k') &&
      !field.id.endsWith('-mode') &&
      !field.id.endsWith('-stop-kind') &&
      !field.id.endsWith('-stop-value'),
  );
  const precisionFields = visibleFields.filter(
    (field) =>
      field.id.endsWith('-k') ||
      field.id.endsWith('-mode') ||
      field.id.endsWith('-stop-kind') ||
      field.id.endsWith('-stop-value'),
  );
  const advancedFields = visibleFields.filter(
    (field) => field.advanced && field.id !== config.expressionFieldId,
  );

  const insertSymbol = useCallback(
    (symbol: string) => {
      const input = expressionRef.current;
      const currentValue = input?.value ?? formState[config.expressionFieldId] ?? '';
      const selectionStart = input?.selectionStart ?? currentValue.length;
      const selectionEnd = input?.selectionEnd ?? currentValue.length;
      const nextValue =
        currentValue.slice(0, selectionStart) + symbol + currentValue.slice(selectionEnd);
      const nextCursor = selectionStart + symbol.length;

      if (!input) {
        onChange(config.method, config.expressionFieldId, nextValue);
        return;
      }

      onChange(config.method, config.expressionFieldId, nextValue);

      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [config.expressionFieldId, config.method, formState, onChange],
  );

  const backspaceExpression = useCallback(() => {
    const input = expressionRef.current;
    const currentValue = input?.value ?? formState[config.expressionFieldId] ?? '';
    const selectionStart = input?.selectionStart ?? currentValue.length;
    const selectionEnd = input?.selectionEnd ?? currentValue.length;
    const deleteStart = selectionStart === selectionEnd ? Math.max(0, selectionStart - 1) : selectionStart;
    const nextValue = currentValue.slice(0, deleteStart) + currentValue.slice(selectionEnd);

    onChange(config.method, config.expressionFieldId, nextValue);

    if (!input) return;

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(deleteStart, deleteStart);
    });
  }, [config.expressionFieldId, config.method, formState, onChange]);

  const renderField = useCallback(
    (field: MethodFieldConfig) => {
      const value = formState[field.id] ?? field.defaultValue ?? '';
      const fieldDomId = `roots-${config.method}-${field.id}`;
      const commonClassName = `field-control numeric-value${field.id === config.expressionFieldId ? ' expression-input' : ''}`;
      const expressionAriaLabel =
        field.id === config.expressionFieldId ? `${config.shortLabel} ${config.expressionLabel}` : undefined;

      return (
        <label key={field.id} className={field.id === config.expressionFieldId ? 'expression-field' : 'field-row'}>
          {field.id === config.expressionFieldId ? null : <span>{field.label}</span>}
          {field.kind === 'select' ? (
            <select
              id={fieldDomId}
              name={field.id}
              value={value}
              onChange={(event) => onChange(config.method, field.id, event.target.value)}
              className={commonClassName}
            >
              {(field.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={field.id === config.expressionFieldId ? expressionRef : undefined}
              id={fieldDomId}
              name={field.id}
              type={field.kind === 'number' ? 'number' : 'text'}
              inputMode={field.kind === 'number' ? 'decimal' : undefined}
              aria-label={expressionAriaLabel}
              value={value}
              placeholder={field.placeholder}
              onChange={(event) => onChange(config.method, field.id, event.target.value)}
              className={commonClassName}
            />
          )}
          {field.id === config.expressionFieldId ? (
            <span className="input-status-icons" aria-hidden="true">
              <CheckCircle2 size={23} strokeWidth={1.7} />
              <Maximize2 size={22} strokeWidth={1.5} />
            </span>
          ) : null}
        </label>
      );
    },
    [config.method, config.expressionFieldId, config.expressionLabel, config.shortLabel, formState, onChange],
  );

  const digitsField = precisionFields.find((field) => field.id.endsWith('-k'));
  const modeField = precisionFields.find((field) => field.id.endsWith('-mode'));
  const stopKindField = precisionFields.find((field) => field.id.endsWith('-stop-kind'));
  const stopValueField = precisionFields.find((field) => field.id.endsWith('-stop-value'));

  return (
    <section className="studio-form">
      {primaryField ? (
        <div className="expression-block">
          <div className="expression-label-row">
            <span className="math-label">{config.expressionLabel}</span>
            <span className="section-kicker">{config.shortLabel} method</span>
          </div>
          {renderField(primaryField)}
          <SymbolInsertBar onInsert={insertSymbol} onBackspace={backspaceExpression} />
        </div>
      ) : null}

      <div className="parameter-grid">
        <div className="field-stack">
          {detailFields.map(renderField)}
        </div>
        <div className="precision-stack">
          <p className="section-kicker">Precision</p>
          {digitsField ? (
            <div className="segmented-row">
              <span>Digits</span>
              <div className="stepper" aria-label="Digit precision">
                <button
                  type="button"
                  onClick={() => onChange(config.method, digitsField.id, String(Math.max(1, Number(formState[digitsField.id] ?? digitsField.defaultValue ?? 6) - 1)))}
                >
                  −
                </button>
                <span className="stepper-value active" aria-live="polite" aria-label="Current digit precision">
                  {formState[digitsField.id] ?? digitsField.defaultValue}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(config.method, digitsField.id, String(Number(formState[digitsField.id] ?? digitsField.defaultValue ?? 6) + 1))}
                >
                  +
                </button>
              </div>
            </div>
          ) : null}
          {modeField ? (
            <div className="segmented-row">
              <span>Rounding</span>
              <div className="segment">
                <button
                  type="button"
                  className={(formState[modeField.id] ?? modeField.defaultValue) === 'round' ? 'active' : ''}
                  onClick={() => onChange(config.method, modeField.id, 'round')}
                >
                  Round
                </button>
                <button
                  type="button"
                  className={(formState[modeField.id] ?? modeField.defaultValue) === 'chop' ? 'active' : ''}
                  onClick={() => onChange(config.method, modeField.id, 'chop')}
                >
                  Chop
                </button>
              </div>
            </div>
          ) : null}
          {stopKindField ? renderField(stopKindField) : null}
          {stopValueField ? renderField(stopValueField) : null}
        </div>
      </div>

      {advancedFields.length ? (
        <div className="field-stack border-t hairline pt-4">
          <div>
            <h3 className="section-kicker">
              Advanced
            </h3>
            <p className="mt-1 text-sm muted-copy">Optional controls for this method.</p>
          </div>
          <div className="field-stack">{advancedFields.map(renderField)}</div>
        </div>
      ) : null}
    </section>
  );
}
