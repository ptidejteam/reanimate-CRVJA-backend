import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

test.each([
  ['zero', 'X = Ln(0)', 'X = Math.trunc(Math.log(0));'],
  ['a positive number', 'X = Ln(1)', 'X = Math.trunc(Math.log(1));'],
  ['a negative number', 'X = Ln(-1)', 'X = Math.trunc(Math.log(-1));'],
  ['a decimal number', 'X# = Ln(0.5)', 'X_f = Math.log(0.5);'],
  ['a variable', 'X = Ln(Y)', 'X = Math.trunc(Math.log(Y));'],
  ['a float variable', 'X# = Ln(Y#)', 'X_f = Math.log(Y_f);'],
  ['an expression', 'X = Ln(Y + 1)', 'X = Math.trunc(Math.log(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Ln(VALUES#(1 + 1))',
    'X_f = Math.log(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Ln((Y + 1) * 2)', 'X = Math.trunc(Math.log((Y + 1) * 2));'],
  ['a nested function', 'X = Ln(Abs(-1))', 'X = Math.trunc(Math.log(Math.abs(-1)));'],
  ['an operation on the result', 'X = Ln(1) + 2', 'X = Math.trunc(Math.log(1) + 2);'],
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

// Runtime: the translated program gives the AMOS result.
// Manual example: Print Ln(10) / A#=Ln(100) (https://amospromanual.dev/05-03-maths.html)
// An integer variable (X) truncates the result toward zero; a float variable (X#) keeps it.
test.each([
  ['X# = Ln(1)', 'X_f', 0],
  ['X# = Ln(10)', 'X_f', 2.302585092994046],
  ['X# = Ln(100)', 'X_f', 4.605170185988092],
  ['X = Ln(10)', 'X', 2],
])('ln runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBeCloseTo(expected, 12);
});

test('ln runtime: evaluates a float variable again after it changes', async () => {
  const { FIRST_f, SECOND_f } = await run(
    'ARGUMENT#=1\nFIRST#=Ln(ARGUMENT#)\nARGUMENT#=2\nSECOND#=Ln(ARGUMENT#)',
    ['FIRST_f', 'SECOND_f'],
  );

  expect(FIRST_f).toBeCloseTo(0, 12);
  expect(SECOND_f).toBeCloseTo(0.6931471805599453, 12);
});

test('ln runtime: evaluates a nested array argument once', async () => {
  const math = seededMath(0.5); // Rnd(3) is 2
  const { RESULT_f } = await run(
    'Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=Ln(Abs(VALUES#(Rnd(3))))',
    ['RESULT_f'],
    { Math: math },
  );

  expect(RESULT_f).toBeCloseTo(0, 12);
  expect(math.random).toHaveBeenCalledTimes(1);
});

test.each([
  ['Ln(-1)', NaN],
  ['Ln(0)', -Infinity],
])(
  'ln runtime: %s keeps the native Math domain and overflow result',
  async (expression, expected) => {
    const { RESULT_f } = await run(`RESULT#=${expression}`, ['RESULT_f']);

    expect(RESULT_f).toBe(expected);
  },
);

test('ln runtime: propagates a NaN argument', async () => {
  const { RESULT_f } = await run('ARGUMENT#=Ln(-1)\nRESULT#=Ln(ARGUMENT#)', ['RESULT_f']);

  expect(RESULT_f).toBeNaN();
});
