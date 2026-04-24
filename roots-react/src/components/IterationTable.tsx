import { tableValuesForRow } from '../lib/resultFormatters';
import type { MethodConfig, RootRunResult } from '../types/roots';

interface IterationTableProps {
  config: MethodConfig;
  run: RootRunResult;
}

export function IterationTable({ config, run }: IterationTableProps) {
  const rows = run.rows ?? [];
  const tableCaption = `${config.shortLabel} iteration table showing ${rows.length} row${rows.length === 1 ? '' : 's'} with ${config.tableHeaders.length} columns.`;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Iteration table
        </h2>
        <p className="text-xs text-slate-500">{rows.length} rows</p>
      </div>

      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">{tableCaption}</caption>
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                {config.tableHeaders.map((header) => (
                  <th key={header} scope="col" className="px-3 py-2 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const values = tableValuesForRow(run.method, row, run);
                const alignedValues = Array.from({ length: config.tableHeaders.length }, (_, cellIndex) =>
                  values[cellIndex] ?? '',
                );

                return (
                  <tr key={`${row.iteration}-${index}`} className="border-b border-slate-900">
                    {alignedValues.map((value, cellIndex) => (
                      <td key={`${cellIndex}-${value}`} className="max-w-[16rem] px-3 py-2 align-top text-slate-200">
                        <span className="block break-words">{value}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-300">No iteration data available.</p>
      )}
    </section>
  );
}
