import { translate } from './helpers/translate.js';

// PEN: the colour of text. https://amospromanual.dev/05-06-text.html
// This transpiler keeps one colour for drawing and text, so Pen sets Ink.

test.each([
  ['a number', 'Pen 3', 'Ink = 3;'],
  ['a variable', 'Pen C', 'Ink = C;'],
])('Pen translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
