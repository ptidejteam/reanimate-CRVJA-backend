import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Hsin(0)', 'X = Math.sinh(0);'],
  ['a positive number', 'X = Hsin(1)', 'X = Math.sinh(1);'],
  ['a negative number', 'X = Hsin(-1)', 'X = Math.sinh(-1);'],
  ['a decimal number', 'X# = Hsin(0.5)', 'X_f = Math.sinh(0.5);'],
  ['a variable', 'X = Hsin(Y)', 'X = Math.sinh(Y);'],
  ['a float variable', 'X# = Hsin(Y#)', 'X_f = Math.sinh(Y_f);'],
  ['an expression', 'X = Hsin(Y + 1)', 'X = Math.sinh(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Hsin(VALUES#(1 + 1))',
    'X_f = Math.sinh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Hsin((Y + 1) * 2)', 'X = Math.sinh((Y + 1) * 2);'],
  ['a nested function', 'X = Hsin(Abs(-1))', 'X = Math.sinh(Math.abs(-1));'],
  ['an operation on the result', 'X = Hsin(1) + 2', 'X = Math.sinh(1) + 2;'],
])('hsin translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Hsin()', 'X = Hsin(1, 2)'])(
  '%s is a syntax error: Hsin takes one value',
  async (source) => {
    const { syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(source);

    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
