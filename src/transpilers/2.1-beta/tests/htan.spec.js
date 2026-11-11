import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// HTAN: the hyperbolic tangent of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Htan(0)', 'X = Math.trunc(Math.tanh(0));'],
  ['a positive number', 'X = Htan(1)', 'X = Math.trunc(Math.tanh(1));'],
  ['a negative number', 'X = Htan(-1)', 'X = Math.trunc(Math.tanh(-1));'],
  ['a decimal number', 'X# = Htan(0.5)', 'X_f = Math.tanh(0.5);'],
  ['a variable', 'X = Htan(Y)', 'X = Math.trunc(Math.tanh(Y));'],
  ['a float variable', 'X# = Htan(Y#)', 'X_f = Math.tanh(Y_f);'],
  ['an expression', 'X = Htan(Y + 1)', 'X = Math.trunc(Math.tanh(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Htan(VALUES#(1 + 1))',
    'X_f = Math.tanh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Htan((Y + 1) * 2)', 'X = Math.trunc(Math.tanh((Y + 1) * 2));'],
  ['a nested function', 'X = Htan(Abs(-1))', 'X = Math.trunc(Math.tanh(Math.abs(-1)));'],
  ['an operation on the result', 'X = Htan(1) + 2', 'X = Math.trunc(Math.tanh(1) + 2);'],
])('Htan translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Htan(0)', 0],
  ['Htan(1)', 0.7615941559557649],
  ['Htan(1000)', 1],
  ['Htan(-1000)', -1],
  ['Htan(Ln(-1))', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Htan()', 'X = Htan(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
