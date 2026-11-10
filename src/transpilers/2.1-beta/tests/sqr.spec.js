import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Sqr(0)', 'X = Math.sqrt(0);'],
  ['a positive number', 'X = Sqr(1)', 'X = Math.sqrt(1);'],
  ['a negative number', 'X = Sqr(-1)', 'X = Math.sqrt(-1);'],
  ['a decimal number', 'X# = Sqr(0.5)', 'X_f = Math.sqrt(0.5);'],
  ['a variable', 'X = Sqr(Y)', 'X = Math.sqrt(Y);'],
  ['a float variable', 'X# = Sqr(Y#)', 'X_f = Math.sqrt(Y_f);'],
  ['an expression', 'X = Sqr(Y + 1)', 'X = Math.sqrt(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Sqr(VALUES#(1 + 1))',
    'X_f = Math.sqrt(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Sqr((Y + 1) * 2)', 'X = Math.sqrt((Y + 1) * 2);'],
  ['a nested function', 'X = Sqr(Abs(-1))', 'X = Math.sqrt(Math.abs(-1));'],
  ['an operation on the result', 'X = Sqr(1) + 2', 'X = Math.sqrt(1) + 2;'],
])('sqr translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Sqr()', 'X = Sqr(1, 2)'])(
  '%s is a syntax error: Sqr takes one value',
  async (source) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      source,
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
