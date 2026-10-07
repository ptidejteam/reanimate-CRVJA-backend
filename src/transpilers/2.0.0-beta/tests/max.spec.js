import AMOSTranspiler from '../AMOSTranspiler.js';

test.each([
  ['two numbers', 'X = Max(99, 1)', 'X = Math.max(99, 1);'],
  ['two variables', 'X = Max(A, B)', 'X = Math.max(A, B);'],
  ['two expressions', 'X = Max(A + 1, B * 2)', 'X = Math.max(A + 1, B * 2);'],
  ['a negative number', 'X = Max(-5, A)', 'X = Math.max(-5, A);'],
  ['Min inside', 'X = Max(Min(A, 10), 0)', 'X = Math.max(Math.min(A, 10), 0);'],
  ['an operation on the result', 'X = Max(A, B) + 1', 'X = Math.max(A, B) + 1;'],
])('max translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Max(1)', 'X = Max(1, 2, 3)'])(
  '%s is a syntax error: Max takes two values',
  async (source) => {
    const { syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(source);

    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);

// The manual also accepts two strings: Max("AMOS Professional","AMOS") is "AMOS Professional".
// Math.max() only compares numbers (it returns NaN for strings), so this is not supported yet.
// test.todo('max of two strings');
