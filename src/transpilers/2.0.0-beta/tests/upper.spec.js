import AMOSTranspiler from '../amos-transpiler.js';

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
