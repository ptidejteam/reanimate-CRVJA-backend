import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

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

// Runtime: the translated program gives the AMOS result.
// Colour returns the 12-bit $RGB value; index 0 is $000 by default
// (https://amospromanual.dev/06-04-graphics.html), index 1 is white ($FFF).
test.each([
  ['C = Colour(0)', 'C', 0],
  ['C = Colour(1)', 'C', 4095],
  ['Colour 1,$A74\nC = Colour(1)', 'C', 0xa74],
])('Colour function runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBe(expected);
});
