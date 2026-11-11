import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Htan(0)', 'X = Math.trunc(Math.tanh(0));'],
  ['a positive number', 'X = Htan(1)', 'X = Math.trunc(Math.tanh(1));'],
  ['a negative number', 'X = Htan(-1)', 'X = Math.trunc(Math.tanh(-1));'],
  ['a decimal number', 'X# = Htan(0.5)', 'X_f = Math.tanh(0.5);'],
  ['a variable', 'X = Htan(Y)', 'X = Math.trunc(Math.tanh(Y));'],
  ['a float variable', 'X# = Htan(Y#)', 'X_f = Math.tanh(Y_f);'],
  ['an expression', 'X = Htan(Y + 1)', 'X = Math.trunc(Math.tanh(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Htan(VALUES#(1 + 1))',
    'X_f = Math.tanh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Htan((Y + 1) * 2)', 'X = Math.trunc(Math.tanh((Y + 1) * 2));'],
  ['a nested function', 'X = Htan(Abs(-1))', 'X = Math.trunc(Math.tanh(Math.abs(-1)));'],
  ['an operation on the result', 'X = Htan(1) + 2', 'X = Math.trunc(Math.tanh(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Htan(0)', 'X_f', 0],
  ['X# = Htan(1)', 'X_f', 0.7615941559557649],
  ['X = Htan(1)', 'X', 0],
])('htan runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('htan runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Htan(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Htan(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(0.7615941559557649, 12);
  expect(SECOND_f).toBeCloseTo(0.9640275800758169, 12);
});

test('htan runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Htan(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(0.7615941559557649, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([
  ['Htan(1000)', 1],
  ['Htan(-1000)', -1],
])(
  'htan runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('htan runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Htan(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
