import AMOSTranspiler from '../AMOSTranspiler.js';

test.each([
  ['a number', 'X = Sin(1)', 'X = Math.sin(1);'],
  ['a variable', 'X = Sin(Y)', 'X = Math.sin(Y);'],
  ['an expression', 'X = Sin(Y + 1)', 'X = Math.sin(Y + 1);'],
])('sin translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});
