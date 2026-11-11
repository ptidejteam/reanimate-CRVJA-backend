import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// HCOS: the hyperbolic cosine of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Hcos(0)', 'X = Math.trunc(Math.cosh(0));'],
  ['a positive number', 'X = Hcos(1)', 'X = Math.trunc(Math.cosh(1));'],
  ['a negative number', 'X = Hcos(-1)', 'X = Math.trunc(Math.cosh(-1));'],
  ['a decimal number', 'X# = Hcos(0.5)', 'X_f = Math.cosh(0.5);'],
  ['a variable', 'X = Hcos(Y)', 'X = Math.trunc(Math.cosh(Y));'],
  ['a float variable', 'X# = Hcos(Y#)', 'X_f = Math.cosh(Y_f);'],
  ['an expression', 'X = Hcos(Y + 1)', 'X = Math.trunc(Math.cosh(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Hcos(VALUES#(1 + 1))',
    'X_f = Math.cosh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Hcos((Y + 1) * 2)', 'X = Math.trunc(Math.cosh((Y + 1) * 2));'],
  ['a nested function', 'X = Hcos(Abs(-1))', 'X = Math.trunc(Math.cosh(Math.abs(-1)));'],
  ['an operation on the result', 'X = Hcos(1) + 2', 'X = Math.trunc(Math.cosh(1) + 2);'],
])('Hcos translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Hcos(0)', 1],
  ['Hcos(1)', 1.5430806348152437],
  ['Hcos(1000)', Infinity],
  ['Hcos(-1000)', Infinity],
  ['Hcos(Ln(-1))', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Hcos()', 'X = Hcos(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
