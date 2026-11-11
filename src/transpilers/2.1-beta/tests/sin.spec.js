import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test.each([
  ['a number', 'X = Sin(1)', 'X = Math.trunc(Math.sin(1));'],
  ['a variable', 'X = Sin(Y)', 'X = Math.trunc(Math.sin(Y));'],
  ['an expression', 'X = Sin(Y + 1)', 'X = Math.trunc(Math.sin(Y + 1));'],
])('sin translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Runtime: the translated program gives the AMOS result.
// Manual example: Degree / Print Sin(45) (https://amospromanual.dev/05-03-maths.html)
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Sin(0)', 'X_f', 0],
  ['X# = Sin(1)', 'X_f', 0.8414709848078965],
  ['X = Sin(1)', 'X', 0],
  ['Degree\nX# = Sin(45)', 'X_f', 0.7071067811865475],
])('sin runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});
