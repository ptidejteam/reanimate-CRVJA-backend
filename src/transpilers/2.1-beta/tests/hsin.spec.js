import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Hsin(0)', 'X = Math.trunc(Math.sinh(0));'],
  ['a positive number', 'X = Hsin(1)', 'X = Math.trunc(Math.sinh(1));'],
  ['a negative number', 'X = Hsin(-1)', 'X = Math.trunc(Math.sinh(-1));'],
  ['a decimal number', 'X# = Hsin(0.5)', 'X_f = Math.sinh(0.5);'],
  ['a variable', 'X = Hsin(Y)', 'X = Math.trunc(Math.sinh(Y));'],
  ['a float variable', 'X# = Hsin(Y#)', 'X_f = Math.sinh(Y_f);'],
  ['an expression', 'X = Hsin(Y + 1)', 'X = Math.trunc(Math.sinh(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Hsin(VALUES#(1 + 1))',
    'X_f = Math.sinh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Hsin((Y + 1) * 2)', 'X = Math.trunc(Math.sinh((Y + 1) * 2));'],
  ['a nested function', 'X = Hsin(Abs(-1))', 'X = Math.trunc(Math.sinh(Math.abs(-1)));'],
  ['an operation on the result', 'X = Hsin(1) + 2', 'X = Math.trunc(Math.sinh(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Hsin(0)', 'X_f', 0],
  ['X# = Hsin(1)', 'X_f', 1.1752011936438014],
  ['X = Hsin(1)', 'X', 1],
])('hsin runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('hsin runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Hsin(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Hsin(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(1.1752011936438014, 12);
  expect(SECOND_f).toBeCloseTo(3.626860407847019, 12);
});

test('hsin runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Hsin(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(1.1752011936438014, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([
  ['Hsin(1000)', Infinity],
  ['Hsin(-1000)', -Infinity],
])(
  'hsin runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('hsin runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Hsin(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
