import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// COLOUR (function): the $RGB value of a colour index. https://amospromanual.dev/06-04-graphics.html

test.each([
  ['a number', 'C = Colour(1)', 'C = cssRgbToAmiga12Bit(getColour(1));'],
  ['a variable', 'C = Colour(Y)', 'C = cssRgbToAmiga12Bit(getColour(Y));'],
  ['an expression', 'C = Colour(Y + 1)', 'C = cssRgbToAmiga12Bit(getColour(Y + 1));'],
])('Colour translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// By default index 0 is black ($000) and index 1 is white ($FFF).
test.each([
  ['Colour(0)', 0x000],
  ['Colour(1)', 0xfff],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
