import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// SIN: the sine of an angle, in radians unless Degree is set.
// https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['a number', 'X = Sin(1)', 'X = Math.trunc(Math.sin(1));'],
  ['a variable', 'X = Sin(Y)', 'X = Math.trunc(Math.sin(Y));'],
  ['an expression', 'X = Sin(Y + 1)', 'X = Math.trunc(Math.sin(Y + 1));'],
  ['a float variable', 'X# = Sin(1)', 'X_f = Math.sin(1);'],
])('Sin translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Sin(0)', 0],
  ['Sin(1)', 0.8414709848078965],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Sin()', 'X = Sin(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
