import AMOSTranspiler from '../AMOSTranspiler.js';

test.each([
  ['two numbers', 'X = Min(99, 1)', 'X = Math.min(99, 1);'],
  ['two variables', 'X = Min(A, B)', 'X = Math.min(A, B);'],
  ['two expressions', 'X = Min(A + 1, B * 2)', 'X = Math.min(A + 1, B * 2);'],
  ['a negative number', 'X = Min(-5, A)', 'X = Math.min(-5, A);'],
  ['Max inside', 'X = Min(Max(A, 0), 10)', 'X = Math.min(Math.max(A, 0), 10);'],
  ['an operation on the result', 'X = Min(A, B) + 1', 'X = Math.min(A, B) + 1;'],
])('min translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Min(1)', 'X = Min(1, 2, 3)'])(
  '%s is a syntax error: Min takes two values',
  async (source) => {
    const { syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(source);

    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);

// The manual also accepts two strings: Min("AMOS Professional","AMOS") is "AMOS".
// Math.min() only compares numbers (it returns NaN for strings), so this is not supported yet.
// test.todo('min of two strings');
