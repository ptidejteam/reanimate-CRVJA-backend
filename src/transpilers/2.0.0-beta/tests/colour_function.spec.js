import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['Function with a number', 'C = Colour(1)', 'C = getColour(1);'],
  ['Function with a variable', 'C = Colour(Y)', 'C = getColour(Y);'],
  ['Function with an expression', 'C = Colour(Y + 1)', 'C = getColour(Y + 1);']
])('Colour translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});
