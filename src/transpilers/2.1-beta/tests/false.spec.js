import AMOSTranspiler from '../amos-transpiler';
import { run } from './helpers/runtime.js';

test.each([
  ['an assignment', 'X = False', 'X = 0'],
  ['an operation on the result', 'X = False + 1', 'X = 0 + 1'],
  ['an operation on the result', 'X = 1 + Abs(False)', 'X = 1 + Math.abs(0)'],
])('transpiles test case: %s', async (_name, input, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    input,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Runtime: the translated program gives the AMOS result.
// False is 0 (https://amospromanual.dev/05-04-control-structures.html)
test.each([
  ['X = False', 'X', 0],
  ['X = False + 1', 'X', 1],
  ['X = 1 + Abs(False)', 'X', 1],
])('false runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBe(expected);
});
