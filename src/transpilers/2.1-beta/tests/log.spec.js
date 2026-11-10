import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Log(0)', 'X = Math.log10(0);'],
  ['a positive number', 'X = Log(1)', 'X = Math.log10(1);'],
  ['a negative number', 'X = Log(-1)', 'X = Math.log10(-1);'],
  ['a decimal number', 'X# = Log(0.5)', 'X_f = Math.log10(0.5);'],
  ['a variable', 'X = Log(Y)', 'X = Math.log10(Y);'],
  ['a float variable', 'X# = Log(Y#)', 'X_f = Math.log10(Y_f);'],
  ['an expression', 'X = Log(Y + 1)', 'X = Math.log10(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Log(VALUES#(1 + 1))',
    'X_f = Math.log10(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Log((Y + 1) * 2)', 'X = Math.log10((Y + 1) * 2);'],
  ['a nested function', 'X = Log(Abs(-1))', 'X = Math.log10(Math.abs(-1));'],
  ['an operation on the result', 'X = Log(1) + 2', 'X = Math.log10(1) + 2;'],
])('log translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Log()', 'X = Log(1, 2)'])(
  '%s is a syntax error: Log takes one value',
  async (source) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      source,
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
