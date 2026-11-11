import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test.each([
  ['a string', 'RESULT$=Upper$("AbC")', "RESULT$ = 'AbC'.toUpperCase();"],
  [
    'nested functions',
    'RESULT$=Upper$(Flip$(Lower$("AbC")))',
    "RESULT$ = 'AbC'.toLowerCase().split('').reverse().join('').toUpperCase();",
  ],
])('Upper$ translates %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Runtime: the translated program gives the AMOS result.
// Manual example: Print Upper$("aMoS pRoFeSsIoNaL") (https://amospromanual.dev/05-02-string-functions.html)
test.each([
  ['RESULT$=Upper$("aMoS pRoFeSsIoNaL")', 'RESULT$', 'AMOS PROFESSIONAL'],
  ['RESULT$=Upper$(Flip$(Lower$("AbC")))', 'RESULT$', 'CBA'],
])('upper runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBe(expected);
});
