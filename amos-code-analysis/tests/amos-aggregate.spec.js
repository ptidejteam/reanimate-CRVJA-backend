import { describe, expect, test } from '@jest/globals';
import { aggregateRows } from '../amos-aggregate.js';

function row(command, count, project, filePath, category = 'Instruction') {
  return { COMMAND: command, CATEGORY: category, COUNT: count, PROJECT: project, FILE_PATH: filePath };
}

describe('AMOS command aggregation', () => {
  test('returns no aggregate rows for empty input or nonpositive counts', () => {
    expect(aggregateRows([])).toEqual([]);
    expect(aggregateRows([
      row('CURS OFF', 0, 'project', 'empty.asc'),
      row('CURS ON', -1, 'project', 'empty.asc'),
    ])).toEqual([]);
  });

  test('sums occurrences while counting each project and file once', () => {
    const rows = [
      row('CURS OFF', 2, 'one', 'main.asc'),
      row('CURS OFF', 3, 'one', 'nested/helper.txt'),
      row('CURS OFF', 4, 'two', 'main.asc'),
      row('CURS OFF', 1, 'one', 'main.asc'),
    ];
    const originalRows = structuredClone(rows);

    expect(aggregateRows(rows)).toEqual([
      { COMMAND: 'CURS OFF', CATEGORY: 'Instruction', TOTAL_COUNT: 10, PROJECT_COUNT: 2, FILE_COUNT: 3 },
    ]);
    expect(rows).toEqual(originalRows);
  });

  test('counts the same relative path in different projects as distinct files', () => {
    expect(aggregateRows([
      row('TEXT', 1, 'one', 'main.asc'),
      row('TEXT', 1, 'two', 'main.asc'),
    ])).toEqual([
      { COMMAND: 'TEXT', CATEGORY: 'Instruction', TOTAL_COUNT: 2, PROJECT_COUNT: 2, FILE_COUNT: 2 },
    ]);
  });

  test('groups by both command and category and sorts independently of input order', () => {
    const rows = [
      row('TEXT', 1, 'one', 'main.asc'),
      row('ADD', 2, 'one', 'main.asc'),
      row('ADD', 3, 'one', 'main.asc', 'Function'),
    ];
    const expected = [
      { COMMAND: 'ADD', CATEGORY: 'Function', TOTAL_COUNT: 3, PROJECT_COUNT: 1, FILE_COUNT: 1 },
      { COMMAND: 'ADD', CATEGORY: 'Instruction', TOTAL_COUNT: 2, PROJECT_COUNT: 1, FILE_COUNT: 1 },
      { COMMAND: 'TEXT', CATEGORY: 'Instruction', TOTAL_COUNT: 1, PROJECT_COUNT: 1, FILE_COUNT: 1 },
    ];

    expect(aggregateRows(rows)).toEqual(expected);
    expect(aggregateRows([...rows].reverse())).toEqual(expected);
  });

  test('keeps file identities distinct when names contain separators or special characters', () => {
    const result = aggregateRows([
      row('TEXT', 1, 'a|b', 'c.asc'),
      row('TEXT', 1, 'a', 'b|c.asc'),
      row('TEXT', 1, 'quoted,"project', 'nested/line\nfile.asc'),
    ]);

    expect(result[0].PROJECT_COUNT).toBe(3);
    expect(result[0].FILE_COUNT).toBe(3);
  });
});
