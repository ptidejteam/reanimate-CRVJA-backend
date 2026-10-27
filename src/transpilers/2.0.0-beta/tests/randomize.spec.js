import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['a number', 'Randomize 42', 'Randomize(42);'],
  ['Timer', 'Randomize Timer', 'Randomize(Timer);'],
  ['a variable', 'Randomize A', 'Randomize(A);'],
  ['an expression', 'Randomize A + 1', 'Randomize(A + 1);'],
])('randomize translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});
