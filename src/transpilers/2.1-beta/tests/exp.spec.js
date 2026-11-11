import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Exp(0)', 'X = Math.trunc(Math.exp(0));'],
  ['a positive number', 'X = Exp(1)', 'X = Math.trunc(Math.exp(1));'],
  ['a negative number', 'X = Exp(-1)', 'X = Math.trunc(Math.exp(-1));'],
  ['a decimal number', 'X# = Exp(0.5)', 'X_f = Math.exp(0.5);'],
  ['a variable', 'X = Exp(Y)', 'X = Math.trunc(Math.exp(Y));'],
  ['a float variable', 'X# = Exp(Y#)', 'X_f = Math.exp(Y_f);'],
  ['an expression', 'X = Exp(Y + 1)', 'X = Math.trunc(Math.exp(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Exp(VALUES#(1 + 1))',
    'X_f = Math.exp(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Exp((Y + 1) * 2)', 'X = Math.trunc(Math.exp((Y + 1) * 2));'],
  ['a nested function', 'X = Exp(Abs(-1))', 'X = Math.trunc(Math.exp(Math.abs(-1)));'],
  ['an operation on the result', 'X = Exp(1) + 2', 'X = Math.trunc(Math.exp(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// Manual example: Print Exp(1) (https://amospromanual.dev/05-03-maths.html)
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Exp(0)', 'X_f', 1],
  ['X# = Exp(1)', 'X_f', 2.718281828459045],
  ['X = Exp(1)', 'X', 2],
])('exp runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('exp runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Exp(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Exp(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(2.718281828459045, 12);
  expect(SECOND_f).toBeCloseTo(7.38905609893065, 12);
});

test('exp runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Exp(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(2.718281828459045, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([
  ['Exp(1000)', Infinity],
  ['Exp(-1000)', 0],
])(
  'exp runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('exp runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Exp(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
