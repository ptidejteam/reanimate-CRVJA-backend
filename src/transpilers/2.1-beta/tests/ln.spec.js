import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// LN: the natural logarithm of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Ln(0)', 'X = Math.trunc(Math.log(0));'],
  ['a positive number', 'X = Ln(1)', 'X = Math.trunc(Math.log(1));'],
  ['a negative number', 'X = Ln(-1)', 'X = Math.trunc(Math.log(-1));'],
  ['a decimal number', 'X# = Ln(0.5)', 'X_f = Math.log(0.5);'],
  ['a variable', 'X = Ln(Y)', 'X = Math.trunc(Math.log(Y));'],
  ['a float variable', 'X# = Ln(Y#)', 'X_f = Math.log(Y_f);'],
  ['an expression', 'X = Ln(Y + 1)', 'X = Math.trunc(Math.log(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Ln(VALUES#(1 + 1))',
    'X_f = Math.log(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Ln((Y + 1) * 2)', 'X = Math.trunc(Math.log((Y + 1) * 2));'],
  ['a nested function', 'X = Ln(Abs(-1))', 'X = Math.trunc(Math.log(Math.abs(-1)));'],
  ['an operation on the result', 'X = Ln(1) + 2', 'X = Math.trunc(Math.log(1) + 2);'],
])('Ln translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Ln(10) and A#=Ln(100)
test.each([
  ['Ln(1)', 0],
  ['Ln(10)', 2.302585092994046],
  ['Ln(100)', 4.605170185988092],
  ['Ln(0)', -Infinity],
  ['Ln(-1)', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Ln()', 'X = Ln(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
