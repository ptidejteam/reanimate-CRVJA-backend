import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test.each([
  ['a number', 'X = Cos(1)', 'X = Math.trunc(Math.cos(1));'],
  ['a variable', 'X = Cos(Y)', 'X = Math.trunc(Math.cos(Y));'],
  ['an expression', 'X = Cos(Y + 1)', 'X = Math.trunc(Math.cos(Y + 1));'],
])('cos translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Runtime: the translated program gives the AMOS result.
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Cos(0)', 'X_f', 1],
  ['X# = Cos(1)', 'X_f', 0.5403023058681398],
  ['X = Cos(1)', 'X', 0],
  ['Degree\nX# = Cos(60)', 'X_f', 0.5],
])('cos runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});
