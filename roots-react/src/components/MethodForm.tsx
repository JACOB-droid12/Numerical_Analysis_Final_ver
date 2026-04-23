import { useCallback, useMemo, useRef } from 'react';

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
    (field) => field.id !== config.expressionFieldId && !field.advanced,
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

  const renderField = useCallback(
    (field: MethodFieldConfig) => {
      const value = formState[field.id] ?? field.defaultValue ?? '';
      const fieldDomId = `roots-${config.method}-${field.id}`;
      const commonClassName =
        'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400';

      return (
        <label key={field.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-200">{field.label}</span>
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
              value={value}
              placeholder={field.placeholder}
              onChange={(event) => onChange(config.method, field.id, event.target.value)}
              className={commonClassName}
            />
          )}
        </label>
      );
    },
    [config.method, config.expressionFieldId, formState, onChange],
  );

  return (
    <section className="space-y-6">
      {primaryField ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Expression
            </h3>
            <p className="text-sm text-slate-500">{config.expressionLabel}</p>
          </div>
          {renderField(primaryField)}
          <SymbolInsertBar onInsert={insertSymbol} />
        </div>
      ) : null}

      {detailFields.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {detailFields.map(renderField)}
        </div>
      ) : null}

      {advancedFields.length ? (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Advanced
            </h3>
            <p className="text-sm text-slate-500">Optional controls for this method.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">{advancedFields.map(renderField)}</div>
        </div>
      ) : null}
    </section>
  );
}
