import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test.each([
  ['a string', 'RESULT$=Lower$("AbC")', "RESULT$ = 'AbC'.toLowerCase();"],
  ['an expression', 'RESULT$=Lower$(TEXT$+"Ab")', "RESULT$ = (TEXT$ + 'Ab').toLowerCase();"],
])('Lower$ translates %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// Runtime: the translated program gives the AMOS result.
test.each([
  ['RESULT$=Lower$("AbC")', 'RESULT$', 'abc'],
  ['TEXT$="X"\nRESULT$=Lower$(TEXT$+"Ab")', 'RESULT$', 'xab'],
])('lower runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBe(expected);
});
