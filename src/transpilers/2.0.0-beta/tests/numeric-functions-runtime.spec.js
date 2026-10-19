import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

async function run(source, resultExpression = 'RESULT_f') {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const random = jest.fn(() => 0.5);
  const math = Object.create(Math);
  math.random = random;
  const value = await vm.runInNewContext(
    `(async () => { "use strict";\n${translatedCode}\nreturn ${resultExpression}; })()`,
    {
      Math: math,
      // Numeric programs only register keyboard listeners during runtime initialization.
      document: { addEventListener() {} },
    },
    { timeout: 1000 },
  );
  return { value, random };
}

const functions = [
  { name: 'Exp', input: 0, expected: 1, atOne: Math.E, atTwo: 7.38905609893065 },
  { name: 'Ln', input: 1, expected: 0, atOne: 0, atTwo: Math.LN2 },
  { name: 'Log', input: 100, expected: 2, atOne: 0, atTwo: 0.3010299956639812 },
  { name: 'Sqr', input: 4, expected: 2, atOne: 1, atTwo: Math.SQRT2 },
  { name: 'Hcos', input: 0, expected: 1, atOne: 1.5430806348152437, atTwo: 3.7621956910836314 },
  { name: 'Hsin', input: 0, expected: 0, atOne: 1.1752011936438014, atTwo: 3.626860407847019 },
  { name: 'Htan', input: 0, expected: 0, atOne: 0.7615941559557649, atTwo: 0.9640275800758169 },
];

describe('numeric function execution', () => {
  test.each(functions)('$name($input) returns $expected', async ({ name, input, expected }) => {
    const { value } = await run(`RESULT#=${name}(${input})`);
    expect(value).toBeCloseTo(expected, 12);
  });

  test.each(functions)(
    '$name evaluates a float variable again after it changes',
    async ({ name, atOne, atTwo }) => {
      const { value } = await run(
        `ARGUMENT#=1\nFIRST#=${name}(ARGUMENT#)\nARGUMENT#=2\nSECOND#=${name}(ARGUMENT#)`,
        '[FIRST_f, SECOND_f]',
      );
      expect(value[0]).toBeCloseTo(atOne, 12);
      expect(value[1]).toBeCloseTo(atTwo, 12);
    },
  );

  test.each(functions)(
    '$name evaluates a nested array argument once at runtime',
    async ({ name, atOne }) => {
      const { value, random } = await run(
        `Dim VALUES#(3)\nVALUES#(2)=1\nRESULT#=${name}(Abs(VALUES#(Rnd(3))))`,
      );
      expect(value).toBeCloseTo(atOne, 12);
      expect(random).toHaveBeenCalledTimes(1);
    },
  );

  test.each([
    ['Ln(-1)', NaN],
    ['Ln(0)', -Infinity],
    ['Log(-1)', NaN],
    ['Log(0)', -Infinity],
    ['Sqr(-1)', NaN],
    ['Exp(1000)', Infinity],
    ['Exp(-1000)', 0],
    ['Hcos(1000)', Infinity],
    ['Hcos(-1000)', Infinity],
    ['Hsin(1000)', Infinity],
    ['Hsin(-1000)', -Infinity],
    ['Htan(1000)', 1],
    ['Htan(-1000)', -1],
  ])('%s preserves native Math domain and overflow behavior', async (expression, expected) => {
    const { value } = await run(`RESULT#=${expression}`);
    expect(value).toBe(expected);
  });

  test.each(functions)('$name propagates a runtime NaN argument', async ({ name }) => {
    const { value } = await run(`ARGUMENT#=Ln(-1)\nRESULT#=${name}(ARGUMENT#)`);
    expect(value).toBeNaN();
  });
});
