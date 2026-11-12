import { translate } from './helpers/translate.js';

// DATA: a list of values for Read. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['numbers', 'Data 1,2,3', 'dataMatrix.push(1, 2, 3);'],
  ['a string and an expression', 'Data "A",X+1', "dataMatrix.push('A', X + 1);"],
  ['the list of values', 'Data 1', 'const dataMatrix = [];'],
])('Data translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
