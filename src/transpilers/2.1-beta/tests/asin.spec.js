import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// ASIN: the angle whose sine is a value, in radians unless Degree is set.
// https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['a number', 'X# = Asin(0.5)', 'X_f = Math.asin(0.5);'],
  ['a variable', 'X# = Asin(Y#)', 'X_f = Math.asin(Y_f);'],
  ['an integer variable', 'X = Asin(0.5)', 'X = Math.trunc(Math.asin(0.5));'],
])('Asin translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Asin(0)', 0],
  ['Asin(0.5)', 0.5235987755982989],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Asin()', 'X = Asin(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
