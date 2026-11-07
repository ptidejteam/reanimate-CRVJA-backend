import AMOSTranspiler from '../amos-transpiler.js';

test('Flip$ reverses a string', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'RESULT$=Flip$("AbC")',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain("RESULT$ = 'AbC'.split('').reverse().join('');");
});
