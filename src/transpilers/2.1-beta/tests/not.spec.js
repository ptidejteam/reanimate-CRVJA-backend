import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// NOT: inverts every bit of a value, so Not False is True (-1) and Not True is False (0).
// https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['Not False', 'X = Not False', 'X = ~0;'],
  ['Not True', 'X = Not True', 'X = ~-1;'],
  ['Not a variable', 'X = Not Y', 'X = ~Y;'],
  ['Not a number', 'X = Not 1', 'X = ~1;'],
  ['an operation after it', 'X = Not Y + 1', 'X = ~Y + 1;'],
  ['Not twice', 'X = Not Not Y', 'X = ~~Y;'],
  ['a negative number', 'X = Not -1', 'X = ~-1;'],
  ['a negative variable', 'X = Not -Y', 'X = ~-Y;'],
  ['a negative variable and an operation after it', 'X = Not -Y + 1', 'X = ~-Y + 1;'],
  ['Not of minus True', 'X = Not -True', 'X = ~-(-1);'],
])('Not translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Not False', -1],
  ['Not True', 0],
  ['Not 1', -2],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
