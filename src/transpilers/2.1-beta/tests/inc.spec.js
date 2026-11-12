import { translate } from './helpers/translate.js';

// INC: adds 1 to a whole number variable. https://amospromanual.dev/05-03-maths.html

test.each([
  ['a variable', 'Inc X', 'X = X + 1;'],
  ['followed by another instruction', 'Inc X : Y=1', 'X = X + 1; Y = 1;'],
  ['a new variable', 'Inc X', 'let X = 0;'],
])('Inc translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
