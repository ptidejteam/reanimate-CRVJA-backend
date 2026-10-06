import transpile from '../transpiler.js';

test.each([
  ['a number', 'X = Cos(1)', 'X = Math.cos(1);'],
  ['a variable', 'X = Cos(Y)', 'X = Math.cos(Y);'],
  ['an expression', 'X = Cos(Y + 1)', 'X = Math.cos(Y + 1);'],
])('cos translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(source);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});
