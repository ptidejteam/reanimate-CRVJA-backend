import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Hcos(0)', 'X = Math.trunc(Math.cosh(0));'],
  ['a positive number', 'X = Hcos(1)', 'X = Math.trunc(Math.cosh(1));'],
  ['a negative number', 'X = Hcos(-1)', 'X = Math.trunc(Math.cosh(-1));'],
  ['a decimal number', 'X# = Hcos(0.5)', 'X_f = Math.cosh(0.5);'],
  ['a variable', 'X = Hcos(Y)', 'X = Math.trunc(Math.cosh(Y));'],
  ['a float variable', 'X# = Hcos(Y#)', 'X_f = Math.cosh(Y_f);'],
  ['an expression', 'X = Hcos(Y + 1)', 'X = Math.trunc(Math.cosh(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Hcos(VALUES#(1 + 1))',
    'X_f = Math.cosh(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Hcos((Y + 1) * 2)', 'X = Math.trunc(Math.cosh((Y + 1) * 2));'],
  ['a nested function', 'X = Hcos(Abs(-1))', 'X = Math.trunc(Math.cosh(Math.abs(-1)));'],
  ['an operation on the result', 'X = Hcos(1) + 2', 'X = Math.trunc(Math.cosh(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Hcos(0)', 'X_f', 1],
  ['X# = Hcos(1)', 'X_f', 1.5430806348152437],
  ['X = Hcos(1)', 'X', 1],
])('hcos runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('hcos runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Hcos(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Hcos(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(1.5430806348152437, 12);
  expect(SECOND_f).toBeCloseTo(3.7621956910836314, 12);
});

test('hcos runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Hcos(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(1.5430806348152437, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([
  ['Hcos(1000)', Infinity],
  ['Hcos(-1000)', Infinity],
])(
  'hcos runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('hcos runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Hcos(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
