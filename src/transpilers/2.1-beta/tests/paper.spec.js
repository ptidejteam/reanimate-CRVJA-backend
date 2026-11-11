import { translate } from './helpers/translate.js';

// PAPER: the background colour of text. https://amospromanual.dev/05-06-text.html

test.each([
  ['a number', 'Paper 2', 'Paper = 0;'],
  ['a variable', 'TEMP = 2\nPaper TEMP', 'Paper = TEMP;'],
  ['an expression', 'Paper 1 + 1', 'Paper = 1 + 1'],
  ['a variable and an expression', 'TEMP = 2\nPaper TEMP + 1', 'Paper = TEMP + 1'],
])('Paper translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
