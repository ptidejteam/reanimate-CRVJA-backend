import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Sqr(0)', 'X = Math.trunc(Math.sqrt(0));'],
  ['a positive number', 'X = Sqr(1)', 'X = Math.trunc(Math.sqrt(1));'],
  ['a negative number', 'X = Sqr(-1)', 'X = Math.trunc(Math.sqrt(-1));'],
  ['a decimal number', 'X# = Sqr(0.5)', 'X_f = Math.sqrt(0.5);'],
  ['a variable', 'X = Sqr(Y)', 'X = Math.trunc(Math.sqrt(Y));'],
  ['a float variable', 'X# = Sqr(Y#)', 'X_f = Math.sqrt(Y_f);'],
  ['an expression', 'X = Sqr(Y + 1)', 'X = Math.trunc(Math.sqrt(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Sqr(VALUES#(1 + 1))',
    'X_f = Math.sqrt(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Sqr((Y + 1) * 2)', 'X = Math.trunc(Math.sqrt((Y + 1) * 2));'],
  ['a nested function', 'X = Sqr(Abs(-1))', 'X = Math.trunc(Math.sqrt(Math.abs(-1)));'],
  ['an operation on the result', 'X = Sqr(1) + 2', 'X = Math.trunc(Math.sqrt(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// Manual example: Print Sqr(25) / Print Sqr(11.1111) (https://amospromanual.dev/05-03-maths.html)
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Sqr(25)', 'X_f', 5],
  ['X# = Sqr(11.1111)', 'X_f', 3.33333166666625],
  ['X = Sqr(2)', 'X', 1],
])('sqr runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('sqr runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Sqr(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Sqr(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(1, 12);
  expect(SECOND_f).toBeCloseTo(1.4142135623730951, 12);
});

test('sqr runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Sqr(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(1, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([['Sqr(-1)', NaN]])(
  'sqr runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('sqr runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Sqr(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
