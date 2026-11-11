import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test.each([
  ['an assignment', 'X = True', 'X = -1'],
  ['an operation on the result', 'X = True + 1', 'X = -1 + 1'],
  ['an operation on the result', 'X = 1 + Abs(True)', 'X = 1 + Math.abs(-1)'],
])('transpiles test case: %s', async (_name, input, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    input,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Runtime: the translated program gives the AMOS result.
// True is -1 (https://amospromanual.dev/05-04-control-structures.html)
test.each([
  ['X = True', 'X', -1],
  ['X = True + 1', 'X', 0],
  ['X = 1 + Abs(True)', 'X', 2],
])('true runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBe(expected);
});
