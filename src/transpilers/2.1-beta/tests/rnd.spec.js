import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// RND: a random whole number from 0 up to and including a value.
// https://amospromanual.dev/05-03-maths.html

test.each([
  ['a number', 'X = Rnd(10)', 'X = Math.floor(Math.random() * (10 + 1));'],
  ['a variable', 'X = Rnd(MAX_VALUE)', 'X = Math.floor(Math.random() * (MAX_VALUE + 1));'],
  ['a new variable', 'X = Rnd(10)', 'let X = 0;'],
])('Rnd translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Math.random() is fixed so the result is known: 0 gives the lowest value, 0.999 the highest.
test.each([
  [0, 0],
  [0.5, 5],
  [0.999, 10],
])('Rnd(10) with Math.random() = %p returns %p', async (random, value) => {
  expect(await evaluate('Rnd(10)', { random: random })).toBe(value);
});
