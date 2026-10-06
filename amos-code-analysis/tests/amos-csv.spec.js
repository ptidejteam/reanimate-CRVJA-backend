import { describe, expect, test } from '@jest/globals';
import { serializeCsv } from '../amos-csv.js';

describe('AMOS CSV serialization', () => {
  test('writes the exact header and a trailing newline for empty reports', () => {
    expect(serializeCsv([])).toBe('COMMAND,CATEGORY,COUNT,PROJECT,FILE_PATH\n');
  });

  test('supports aggregate columns without changing the default per-file schema', () => {
    const columns = ['COMMAND', 'CATEGORY', 'TOTAL_COUNT', 'PROJECT_COUNT', 'FILE_COUNT'];
    const header = 'COMMAND,CATEGORY,TOTAL_COUNT,PROJECT_COUNT,FILE_COUNT\n';

    expect(serializeCsv([], columns)).toBe(header);
    expect(serializeCsv([
      { COMMAND: 'TEXT', CATEGORY: 'Instruction', TOTAL_COUNT: 3, PROJECT_COUNT: 1, FILE_COUNT: 2 },
    ], columns)).toBe(`${header}TEXT,Instruction,3,1,2\n`);
    expect(serializeCsv([])).toBe('COMMAND,CATEGORY,COUNT,PROJECT,FILE_PATH\n');
  });

  test('escapes CSV fields and retains the supplied row order', () => {
    expect(serializeCsv([
      { COMMAND: 'CURS OFF', CATEGORY: 'Instruction', COUNT: 2, PROJECT: 'my,project', FILE_PATH: 'file"name.asc' },
      { COMMAND: 'TEXT', CATEGORY: 'Instruction', COUNT: 1, PROJECT: 'é\nproject', FILE_PATH: 'line\r\nfile.txt' },
    ])).toBe(
      'COMMAND,CATEGORY,COUNT,PROJECT,FILE_PATH\n' +
      'CURS OFF,Instruction,2,"my,project","file""name.asc"\n' +
      'TEXT,Instruction,1,"é\nproject","line\r\nfile.txt"\n',
    );
  });
});
