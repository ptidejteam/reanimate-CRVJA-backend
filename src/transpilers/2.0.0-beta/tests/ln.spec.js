import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['zero', 'X = Ln(0)', 'X = Math.log(0);'],
  ['a positive number', 'X = Ln(1)', 'X = Math.log(1);'],
  ['a negative number', 'X = Ln(-1)', 'X = Math.log(-1);'],
  ['a decimal number', 'X# = Ln(0.5)', 'X_f = Math.log(0.5);'],
  ['a variable', 'X = Ln(Y)', 'X = Math.log(Y);'],
  ['a float variable', 'X# = Ln(Y#)', 'X_f = Math.log(Y_f);'],
  ['an expression', 'X = Ln(Y + 1)', 'X = Math.log(Y + 1);'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Ln(VALUES#(1 + 1))',
    'X_f = Math.log(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Ln((Y + 1) * 2)', 'X = Math.log((Y + 1) * 2);'],
  ['a nested function', 'X = Ln(Abs(-1))', 'X = Math.log(Math.abs(-1));'],
  ['an operation on the result', 'X = Ln(1) + 2', 'X = Math.log(1) + 2;'],
])('ln translation with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

test.each(['X = Ln()', 'X = Ln(1, 2)'])(
  '%s is a syntax error: Ln takes one value',
  async (source) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      source,
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(translatedCode).toBe('');
  },
);
