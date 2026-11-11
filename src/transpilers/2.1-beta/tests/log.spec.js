import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Log(0)', 'X = Math.trunc(Math.log10(0));'],
  ['a positive number', 'X = Log(1)', 'X = Math.trunc(Math.log10(1));'],
  ['a negative number', 'X = Log(-1)', 'X = Math.trunc(Math.log10(-1));'],
  ['a decimal number', 'X# = Log(0.5)', 'X_f = Math.log10(0.5);'],
  ['a variable', 'X = Log(Y)', 'X = Math.trunc(Math.log10(Y));'],
  ['a float variable', 'X# = Log(Y#)', 'X_f = Math.log10(Y_f);'],
  ['an expression', 'X = Log(Y + 1)', 'X = Math.trunc(Math.log10(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Log(VALUES#(1 + 1))',
    'X_f = Math.log10(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Log((Y + 1) * 2)', 'X = Math.trunc(Math.log10((Y + 1) * 2));'],
  ['a nested function', 'X = Log(Abs(-1))', 'X = Math.trunc(Math.log10(Math.abs(-1)));'],
  ['an operation on the result', 'X = Log(1) + 2', 'X = Math.trunc(Math.log10(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// Manual example: Print Log(10) / A#=Log(100) (https://amospromanual.dev/05-03-maths.html)
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Log(10)', 'X_f', 1],
  ['X# = Log(100)', 'X_f', 2],
  ['X = Log(500)', 'X', 2],
])('log runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('log runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Log(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Log(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(0, 12);
  expect(SECOND_f).toBeCloseTo(0.3010299956639812, 12);
});

test('log runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Log(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(0, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([
  ['Log(-1)', NaN],
  ['Log(0)', -Infinity],
])(
  'log runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('log runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Log(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
