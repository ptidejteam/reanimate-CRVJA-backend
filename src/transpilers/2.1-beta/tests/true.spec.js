import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// TRUE: the value -1. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['an assignment', 'X = True', 'X = -1'],
  ['an operation on the result', 'X = True + 1', 'X = -1 + 1'],
  ['a function argument', 'X = 1 + Abs(True)', 'X = 1 + Math.abs(-1)'],
])('True translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['True', -1],
  ['True + 1', 0],
  ['1 + Abs(True)', 2],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
