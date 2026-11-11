import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// FALSE: the value 0. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['an assignment', 'X = False', 'X = 0'],
  ['an operation on the result', 'X = False + 1', 'X = 0 + 1'],
  ['a function argument', 'X = 1 + Abs(False)', 'X = 1 + Math.abs(0)'],
])('False translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['False', 0],
  ['False + 1', 1],
  ['1 + Abs(False)', 1],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
