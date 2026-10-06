import transpile from '../transpiler.js';

test.each([
  ['a number', 'Play 40,2', 'soundPlayer(40, 2 * 1000);'],
  ['a variable', 'Play X,2', 'soundPlayer(X, 2 * 1000);'],
  ['an expression', 'Play X + 1,2', 'soundPlayer(X + 1, 2 * 1000);'],
])('play translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(source);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Not AMOS syntax: it used to parse, then crash the transpile with invalid JavaScript
test('"Play $10 5,2" is a syntax error', async () => {
  const { syntaxErrors, translatedCode } = await transpile('Play $10 5,2');

  expect(syntaxErrors.errors.length).toBeGreaterThan(0);
  expect(translatedCode).toBe('');
});
