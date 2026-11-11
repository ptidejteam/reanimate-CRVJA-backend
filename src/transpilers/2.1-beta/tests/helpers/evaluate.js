import vm from 'node:vm';
import AMOSTranspiler from '../../amos-transpiler.js';

// Runs one AMOS expression and returns its value, for the behaviour tests of functions:
//
//   expect(await evaluate('Abs(-3)')).toBe(3);
//   expect(await evaluate('Upper$("AbC")')).toBe('ABC');
//   expect(await evaluate('Rnd(10)', { random: 0.5 })).toBe(5);
//
// The expression is stored in RESULT$ when it is a string (it starts with a quote or a $
// function such as Upper$), otherwise in the float variable RESULT#, which keeps fractions.
// `random` fixes the value of Math.random(), for Rnd.
export async function evaluate(expression, { random } = {}) {
  const isString = /^("|[A-Za-z_]+\$)/.test(expression.trim());
  const amos = `${isString ? 'RESULT$' : 'RESULT#'} = ${expression}`;
  const result = await new AMOSTranspiler().transpile(amos);

  expect(result.lexicalErrors.errors).toEqual([]);
  expect(result.syntaxErrors.errors).toEqual([]);

  const math = Object.create(Math);
  if (random !== undefined) math.random = () => random;

  // The program runs inside an async function, as in the IDE. The runtime only needs
  // document.addEventListener to start.
  return vm.runInNewContext(
    `(async () => {\n"use strict";\n${result.translatedCode}\nreturn ${isString ? 'RESULT$' : 'RESULT_f'};\n})()`,
    { Math: math, document: { addEventListener() {} } },
    { timeout: 1000 },
  );
}
