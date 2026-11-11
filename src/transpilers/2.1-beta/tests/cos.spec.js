import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// COS: the cosine of an angle, in radians unless Degree is set.
// https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['a number', 'X = Cos(1)', 'X = Math.trunc(Math.cos(1));'],
  ['a variable', 'X = Cos(Y)', 'X = Math.trunc(Math.cos(Y));'],
  ['an expression', 'X = Cos(Y + 1)', 'X = Math.trunc(Math.cos(Y + 1));'],
  ['a float variable', 'X# = Cos(1)', 'X_f = Math.cos(1);'],
])('Cos translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Cos(0)', 1],
  ['Cos(1)', 0.5403023058681398],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Cos()', 'X = Cos(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
