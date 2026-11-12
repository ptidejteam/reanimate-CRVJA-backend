import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// ATAN: the angle whose tangent is a value, in radians unless Degree is set.
// https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['a number', 'X# = Atan(1)', 'X_f = Math.atan(1);'],
  ['a variable', 'X# = Atan(Y#)', 'X_f = Math.atan(Y_f);'],
  ['an integer variable', 'X = Atan(1)', 'X = Math.trunc(Math.atan(1));'],
])('Atan translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Atan(0)', 0],
  ['Atan(1)', 0.7853981633974483],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Atan()', 'X = Atan(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
