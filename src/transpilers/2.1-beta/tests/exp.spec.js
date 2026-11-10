import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Exp(0)', 'X = Math.exp(0);'],
  ['a positive number', 'X = Exp(1)', 'X = Math.exp(1);'],
  ['a negative number', 'X = Exp(-1)', 'X = Math.exp(-1);'],
  ['a decimal number', 'X# = Exp(0.5)', 'X_f = Math.exp(0.5);'],
  ['a variable', 'X = Exp(Y)', 'X = Math.exp(Y);'],
  ['a float variable', 'X# = Exp(Y#)', 'X_f = Math.exp(Y_f);'],
  ['an expression', 'X = Exp(Y + 1)', 'X = Math.exp(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Exp(VALUES#(1 + 1))',
    'X_f = Math.exp(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Exp((Y + 1) * 2)', 'X = Math.exp((Y + 1) * 2);'],
  ['a nested function', 'X = Exp(Abs(-1))', 'X = Math.exp(Math.abs(-1));'],
  ['an operation on the result', 'X = Exp(1) + 2', 'X = Math.exp(1) + 2;'],
])('exp translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Exp()', 'X = Exp(1, 2)'])(
  '%s is a syntax error: Exp takes one value',
  async (source) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      source,
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
