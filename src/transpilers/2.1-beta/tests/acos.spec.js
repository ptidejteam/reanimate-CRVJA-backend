import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// ACOS: the angle whose cosine is a value, in radians unless Degree is set.
// https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['a number', 'X# = Acos(0.5)', 'X_f = Math.acos(0.5);'],
  ['a variable', 'X# = Acos(Y#)', 'X_f = Math.acos(Y_f);'],
  ['an integer variable', 'X = Acos(0.5)', 'X = Math.trunc(Math.acos(0.5));'],
])('Acos translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Acos(1)', 0],
  ['Acos(0.5)', 1.0471975511965979],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Acos()', 'X = Acos(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
