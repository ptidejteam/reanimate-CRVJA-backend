import AMOSTranspiler from '../amos-transpiler.js';

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
