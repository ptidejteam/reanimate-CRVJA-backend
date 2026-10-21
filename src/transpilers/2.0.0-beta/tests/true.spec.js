import AMOSTranspiler from '../amos-transpiler.js';

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
