import { tableValuesForRow } from '../lib/resultFormatters';
import type { MethodConfig, RootRunResult } from '../types/roots';

interface IterationTableProps {
  config: MethodConfig;
  run: RootRunResult;
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function IterationTable({ config, run }: IterationTableProps) {
  const rows = run.rows ?? [];
  const tableCaption = `${config.shortLabel} iteration table showing ${rows.length} row${rows.length === 1 ? '' : 's'} with ${config.tableHeaders.length} columns.`;
  const downloadCsv = () => {
    if (!rows.length) return;

    const body = rows.map((row) => {
      const values = tableValuesForRow(run.method, row, run);
      const alignedValues = Array.from({ length: config.tableHeaders.length }, (_, cellIndex) =>
        values[cellIndex] ?? '',
      );
      return alignedValues.map(csvCell).join(',');
    });
    const csv = [config.tableHeaders.map(csvCell).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${config.shortLabel.toLowerCase().replace(/\s+/g, '-')}-iterations.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="iteration-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-kicker">
          Iteration table
        </h2>
        <button
          type="button"
          className="copy-icon-button h-8 w-auto px-3 text-xs"
          disabled={!rows.length}
          onClick={downloadCsv}
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
                {config.tableHeaders.map((header) => (
                  <th key={header} scope="col">
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
