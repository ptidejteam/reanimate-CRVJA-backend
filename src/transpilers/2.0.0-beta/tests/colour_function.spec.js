import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['a number', 'C = Colour(1)', 'C = cssRgbToAmiga12Bit(getColour(1));'],
  ['a variable', 'C = Colour(Y)', 'C = cssRgbToAmiga12Bit(getColour(Y));'],
  ['an expression', 'C = Colour(Y + 1)', 'C = cssRgbToAmiga12Bit(getColour(Y + 1));'],
])('Colour function with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});
