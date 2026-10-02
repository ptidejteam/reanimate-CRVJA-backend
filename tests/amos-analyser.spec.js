import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import antlr4 from 'antlr4';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';
import AMOSParser from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSParser.js';
import CollectingErrorListener from '#root/src/transpilers/2.0.0-beta/error-listener.js';
import AMOSAnalyser from '#root/amos-code-analysis/amos-analyser.js';

function analyse(code, summaryTable, entryRule = 'program') {
  const lexer = new AMOSLexer(new antlr4.InputStream(code));
  const lexicalErrors = new CollectingErrorListener();
  lexer.removeErrorListeners();
  lexer.addErrorListener(lexicalErrors);

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new AMOSParser(tokens);
  const syntaxErrors = new CollectingErrorListener();
  parser.removeErrorListeners();
  parser.addErrorListener(syntaxErrors);

  const tree = parser[entryRule]();
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(tokens.LA(1)).toBe(antlr4.Token.EOF);

  const analyser = new AMOSAnalyser(summaryTable);
  new antlr4.tree.ParseTreeWalker().walk(analyser, tree);
  return analyser;
}

describe('AMOS instruction counting', () => {
  let consoleLog;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('keeps only instruction rows with their original order, objects, and counts', () => {
    const rows = [
      { COMMAND: 'INK', CATEGORY: 'Instruction', COUNT: 3 },
      { COMMAND: 'SIN', CATEGORY: 'Function', COUNT: 2 },
      { COMMAND: 'FOR', CATEGORY: 'Structure', COUNT: 1 },
      { COMMAND: 'TEXT', CATEGORY: 'Instruction', COUNT: 4 },
    ];

    const analyser = new AMOSAnalyser(rows);

    expect(analyser.summaryTable).toEqual([rows[0], rows[3]]);
    expect(analyser.summaryTable[0]).toBe(rows[0]);
    expect(analyser.summaryTable[1]).toBe(rows[3]);
    expect(rows).toHaveLength(4);
    expect(rows.map(row => row.COUNT)).toEqual([3, 2, 1, 4]);
  });

  test('matches SCREEN OPEN without matching a longer catalog command', () => {
    const rows = [
      { COMMAND: 'RESOURCE SCREEN OPEN', CATEGORY: 'Instruction', COUNT: 0 },
      { COMMAND: 'SCREEN OPEN', CATEGORY: 'Instruction', COUNT: 0 },
    ];

    const analyser = analyse('Screen Open 1,320,200,16,Lowres', rows);

    expect(analyser.summaryTable.map(row => row.COUNT)).toEqual([0, 1]);
  });

  test('matches LOAD IFF without incrementing LOAD', () => {
    const rows = [
      { COMMAND: 'LOAD', CATEGORY: 'Instruction', COUNT: 0 },
      { COMMAND: 'LOAD IFF', CATEGORY: 'Instruction', COUNT: 0 },
    ];

    // The current program rule does not include loadIff.
    const analyser = analyse('Load Iff FileName 1', rows, 'loadIff');

    expect(analyser.summaryTable.map(row => row.COUNT)).toEqual([0, 1]);
  });

  test('increments every matching instruction row once per occurrence', () => {
    const rows = [
      { COMMAND: 'SCREEN OPEN', CATEGORY: 'Instruction', COUNT: 3 },
      { COMMAND: ' screen open ', CATEGORY: 'Instruction', COUNT: 7 },
      { COMMAND: 'SCREEN OPEN', CATEGORY: 'Function', COUNT: 9 },
    ];

    const analyser = analyse(
      'Screen Open 1,320,200,16,Lowres\nScreen Open 2,640,400,16,Hires',
      rows,
    );

    expect(analyser.summaryTable.map(row => row.COUNT)).toEqual([5, 9]);
    expect(rows[1].COMMAND).toBe(' screen open ');
    expect(rows[2].COUNT).toBe(9);
  });

  test('ignores commands without a matching instruction row', () => {
    const rows = [
      { COMMAND: 'INK', CATEGORY: 'Instruction', COUNT: 5 },
    ];

    const analyser = analyse('Curs Off', rows);

    expect(analyser.summaryTable).toEqual(rows);
    expect(analyser.summaryTable).toHaveLength(1);
    expect(rows[0].COUNT).toBe(5);
  });

  test('counts TEXT while ignoring command names inside its string', () => {
    const rows = [
      { COMMAND: 'TEXT', CATEGORY: 'Instruction', COUNT: 0 },
      { COMMAND: 'SCREEN OPEN', CATEGORY: 'Instruction', COUNT: 0 },
    ];

    const analyser = analyse('Text 1,2,"Screen Open"', rows);

    expect(analyser.summaryTable.map(row => row.COUNT)).toEqual([1, 0]);
  });

  test('leaves commands made from unnamed parser literals for a later step', () => {
    const rows = [
      { COMMAND: 'SCREEN', CATEGORY: 'Instruction', COUNT: 0 },
      { COMMAND: 'SCREEN SWAP', CATEGORY: 'Instruction', COUNT: 0 },
      { COMMAND: 'SWAP', CATEGORY: 'Instruction', COUNT: 0 },
    ];

    const analyser = analyse('Screen Swap', rows);

    expect(analyser.summaryTable.map(row => row.COUNT)).toEqual([0, 0, 0]);
  });
});
