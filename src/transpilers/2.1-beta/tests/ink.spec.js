import { translate } from './helpers/translate.js';

// INK: the colour used for drawing. https://amospromanual.dev/06-04-graphics.html

test.each([
  ['a number', 'Ink 2', 'Ink = 2;'],
  ['a variable', 'Ink C', 'Ink = C;'],
])('Ink translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
