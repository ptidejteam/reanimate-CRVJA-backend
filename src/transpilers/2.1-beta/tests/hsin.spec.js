import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// HSIN: the hyperbolic sine of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Hsin(0)', 'X = Math.trunc(Math.sinh(0));'],
  ['a positive number', 'X = Hsin(1)', 'X = Math.trunc(Math.sinh(1));'],
  ['a negative number', 'X = Hsin(-1)', 'X = Math.trunc(Math.sinh(-1));'],
  ['a decimal number', 'X# = Hsin(0.5)', 'X_f = Math.sinh(0.5);'],
  ['a variable', 'X = Hsin(Y)', 'X = Math.trunc(Math.sinh(Y));'],
  ['a float variable', 'X# = Hsin(Y#)', 'X_f = Math.sinh(Y_f);'],
  ['an expression', 'X = Hsin(Y + 1)', 'X = Math.trunc(Math.sinh(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Hsin(VALUES#(1 + 1))',
    'X_f = Math.sinh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Hsin((Y + 1) * 2)', 'X = Math.trunc(Math.sinh((Y + 1) * 2));'],
  ['a nested function', 'X = Hsin(Abs(-1))', 'X = Math.trunc(Math.sinh(Math.abs(-1)));'],
  ['an operation on the result', 'X = Hsin(1) + 2', 'X = Math.trunc(Math.sinh(1) + 2);'],
])('Hsin translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Hsin(0)', 0],
  ['Hsin(1)', 1.1752011936438014],
  ['Hsin(1000)', Infinity],
  ['Hsin(-1000)', -Infinity],
  ['Hsin(Ln(-1))', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Hsin()', 'X = Hsin(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
