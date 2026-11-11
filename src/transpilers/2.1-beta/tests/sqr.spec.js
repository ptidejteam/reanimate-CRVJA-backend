import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// SQR: the square root of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Sqr(0)', 'X = Math.trunc(Math.sqrt(0));'],
  ['a positive number', 'X = Sqr(1)', 'X = Math.trunc(Math.sqrt(1));'],
  ['a negative number', 'X = Sqr(-1)', 'X = Math.trunc(Math.sqrt(-1));'],
  ['a decimal number', 'X# = Sqr(0.5)', 'X_f = Math.sqrt(0.5);'],
  ['a variable', 'X = Sqr(Y)', 'X = Math.trunc(Math.sqrt(Y));'],
  ['a float variable', 'X# = Sqr(Y#)', 'X_f = Math.sqrt(Y_f);'],
  ['an expression', 'X = Sqr(Y + 1)', 'X = Math.trunc(Math.sqrt(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Sqr(VALUES#(1 + 1))',
    'X_f = Math.sqrt(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Sqr((Y + 1) * 2)', 'X = Math.trunc(Math.sqrt((Y + 1) * 2));'],
  ['a nested function', 'X = Sqr(Abs(-1))', 'X = Math.trunc(Math.sqrt(Math.abs(-1)));'],
  ['an operation on the result', 'X = Sqr(1) + 2', 'X = Math.trunc(Math.sqrt(1) + 2);'],
])('Sqr translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Sqr(25) and Print Sqr(11.1111)
test.each([
  ['Sqr(0)', 0],
  ['Sqr(25)', 5],
  ['Sqr(11.1111)', 3.33333166666625],
  ['Sqr(2)', 1.4142135623730951],
  ['Sqr(-1)', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Sqr()', 'X = Sqr(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
