import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// MIN: the smallest of two values. https://amospromanual.dev/05-03-maths.html

test.each([
  ['two numbers', 'X = Min(99, 1)', 'X = Math.min(99, 1);'],
  ['two variables', 'X = Min(A, B)', 'X = Math.min(A, B);'],
  ['two expressions', 'X = Min(A + 1, B * 2)', 'X = Math.min(A + 1, B * 2);'],
  ['a negative number', 'X = Min(-5, A)', 'X = Math.min(-5, A);'],
  ['Max inside', 'X = Min(Max(A, 0), 10)', 'X = Math.min(Math.max(A, 0), 10);'],
  ['an operation on the result', 'X = Min(A, B) + 1', 'X = Math.min(A, B) + 1;'],
])('Min translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: A=Min(99,1) : Print A
test.each([
  ['Min(99, 1)', 1],
  ['Min(-5, -10)', -10],
  ['Min(1.5, 2.5)', 1.5],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Min(1)', 'X = Min(1, 2, 3)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});

// The manual also accepts two strings: Min("AMOS Professional","AMOS") is "AMOS".
// Math.min() only compares numbers (it returns NaN for strings), so this is not supported yet.
