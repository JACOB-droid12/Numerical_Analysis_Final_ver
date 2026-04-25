import { describe, expect, it } from 'vitest';

import { csvEscapeCell, rowsToCsv } from './csv';

describe('csv helpers', () => {
  it('escapes commas, quotes, and line breaks deterministically', () => {
    expect(csvEscapeCell('plain')).toBe('plain');
    expect(csvEscapeCell('left,right')).toBe('"left,right"');
    expect(csvEscapeCell('He said "run"')).toBe('"He said ""run"""');
    expect(csvEscapeCell('line one\nline two')).toBe('"line one\nline two"');
  });

  it('serializes rows with CRLF separators', () => {
    expect(rowsToCsv([
      ['i', 'note'],
      [1, 'kept "left"'],
      [2, 'a,b'],
    ])).toBe('i,note\r\n1,"kept ""left"""\r\n2,"a,b"');
  });
});
