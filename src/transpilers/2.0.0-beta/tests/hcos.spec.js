import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Hcos(0)', 'X = Math.cosh(0);'],
  ['a positive number', 'X = Hcos(1)', 'X = Math.cosh(1);'],
  ['a negative number', 'X = Hcos(-1)', 'X = Math.cosh(-1);'],
  ['a decimal number', 'X# = Hcos(0.5)', 'X_f = Math.cosh(0.5);'],
  ['a variable', 'X = Hcos(Y)', 'X = Math.cosh(Y);'],
  ['a float variable', 'X# = Hcos(Y#)', 'X_f = Math.cosh(Y_f);'],
  ['an expression', 'X = Hcos(Y + 1)', 'X = Math.cosh(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Hcos(VALUES#(1 + 1))',
    'X_f = Math.cosh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Hcos((Y + 1) * 2)', 'X = Math.cosh((Y + 1) * 2);'],
  ['a nested function', 'X = Hcos(Abs(-1))', 'X = Math.cosh(Math.abs(-1));'],
  ['an operation on the result', 'X = Hcos(1) + 2', 'X = Math.cosh(1) + 2;'],
])('hcos translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Hcos()', 'X = Hcos(1, 2)'])(
  '%s is a syntax error: Hcos takes one value',
  async (source) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      source,
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
