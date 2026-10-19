import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Htan(0)', 'X = Math.tanh(0);'],
  ['a positive number', 'X = Htan(1)', 'X = Math.tanh(1);'],
  ['a negative number', 'X = Htan(-1)', 'X = Math.tanh(-1);'],
  ['a decimal number', 'X# = Htan(0.5)', 'X_f = Math.tanh(0.5);'],
  ['a variable', 'X = Htan(Y)', 'X = Math.tanh(Y);'],
  ['a float variable', 'X# = Htan(Y#)', 'X_f = Math.tanh(Y_f);'],
  ['an expression', 'X = Htan(Y + 1)', 'X = Math.tanh(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Htan(VALUES#(1 + 1))',
    'X_f = Math.tanh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Htan((Y + 1) * 2)', 'X = Math.tanh((Y + 1) * 2);'],
  ['a nested function', 'X = Htan(Abs(-1))', 'X = Math.tanh(Math.abs(-1));'],
  ['an operation on the result', 'X = Htan(1) + 2', 'X = Math.tanh(1) + 2;'],
])('htan translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Htan()', 'X = Htan(1, 2)'])(
  '%s is a syntax error: Htan takes one value',
  async (source) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      source,
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
