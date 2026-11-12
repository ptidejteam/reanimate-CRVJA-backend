import { translate } from './helpers/translate.js';

// DEC: subtracts 1 from a whole number variable. https://amospromanual.dev/05-03-maths.html

test.each([
  ['a variable', 'Dec X', 'X = X - 1;'],
  ['followed by another instruction', 'Dec X : Dec Y', 'X = X - 1; Y = Y - 1;'],
  ['a new variable', 'Dec X', 'let X = 0;'],
])('Dec translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
