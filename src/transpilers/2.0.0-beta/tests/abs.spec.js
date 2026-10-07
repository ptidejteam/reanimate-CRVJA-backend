import AMOSTranspiler from '../AMOSTranspiler.js';

test('abs translation', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'X = Abs(-3)',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('X = Math.abs(-3);');
});
