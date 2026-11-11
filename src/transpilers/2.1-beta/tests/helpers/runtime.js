import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../../amos-transpiler.js';

// A Math whose random() always returns `value`, for Rnd. Pass it as a global:
//
//   const math = seededMath(0.5);
//   const { X } = await run('X = Rnd(10)', ['X'], { Math: math });   // X is 5
//   expect(math.random).toHaveBeenCalledTimes(1);
export function seededMath(value) {
  const math = Object.create(Math);
  math.random = jest.fn(() => value);
  return math;
}

// Transpiles an AMOS program, runs it the way the IDE does and returns the values of the
// requested JavaScript variables (AMOS X -> X, X# -> X_f, ...).
//
//   const { X } = await run('X = Abs(-3)', ['X']);
//
// The program runs inside an async function (Procedure calls and waits are awaited), in a
// fresh vm context with only these browser stand-ins:
//   - document.addEventListener: the runtime registers its keyboard listeners on start;
//   - setTimeout: calls back at once, so frame waits do not stall the test.
// `globals` adds to or replaces them (a seeded Math, a recording setTimeout, ...).
export async function run(source, names, globals = {}) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return vm.runInNewContext(
    `(async () => { "use strict";\n${translatedCode}\nreturn { ${names.join(', ')} }; })()`,
    {
      document: { addEventListener() {} },
      setTimeout: (callback) => callback(),
      ...globals,
    },
    { timeout: 1000 },
  );
}
