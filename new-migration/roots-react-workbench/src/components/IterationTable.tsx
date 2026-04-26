import { useCallback } from 'react';

import { rowsToCsv } from '../lib/csv';
import { tableHeadersForRun, tableValuesForRow } from '../lib/resultFormatters';
import type { MethodConfig, RootRunResult } from '../types/roots';

interface IterationTableProps {
  config: MethodConfig;
  run: RootRunResult;
}

export function IterationTable({ config, run }: IterationTableProps) {
  const rows = run.rows ?? [];
  const tableHeaders = tableHeadersForRun(run, config.tableHeaders);
  const tableCaption = `${config.shortLabel} iteration table showing ${rows.length} row${rows.length === 1 ? '' : 's'} with ${tableHeaders.length} columns.`;
  const downloadCsv = useCallback(() => {
    if (!rows.length) {
      return;
    }

    const csvRows = [
      tableHeaders,
      ...rows.map((row) => {
        const values = tableValuesForRow(run.method, row, run);
        return Array.from({ length: tableHeaders.length }, (_, cellIndex) => values[cellIndex] ?? '');
      }),
    ];
    const csv = rowsToCsv(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    link.href = url;
    link.download = `${run.method}-iterations-${timestamp}.csv`;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [rows, run, tableHeaders]);

  return (
    <section className="iteration-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-kicker">
          Iteration table
        </h2>
        <button
          type="button"
          className="copy-icon-button h-8 w-auto px-3 text-xs"
          onClick={downloadCsv}
          disabled={!rows.length}
          aria-label={`Download ${config.shortLabel} iteration table as CSV`}
        >
          Download CSV
        </button>
      </div>

      {rows.length ? (
        <>
        <div className="table-shell premium-scrollbar mt-4">
          <table className="iteration-table numeric-value">
            <caption className="sr-only">{tableCaption}</caption>
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const values = tableValuesForRow(run.method, row, run);
                const alignedValues = Array.from({ length: tableHeaders.length }, (_, cellIndex) =>
                  values[cellIndex] ?? '',
                );

                return (
                  <tr key={`${row.iteration}-${index}`}>
                    {alignedValues.map((value, cellIndex) => (
                      <td key={`${cellIndex}-${value}`}>
                        <span className="block break-words">{value}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="table-footnote">Showing {rows.length} of {rows.length} iterations • Scroll horizontally to view more columns</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--text)]">No iteration data available.</p>
      )}
    </section>
  );
}
