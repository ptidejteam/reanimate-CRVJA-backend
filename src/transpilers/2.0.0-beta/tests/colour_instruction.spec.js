import AMOSTranspiler from '../amos-transpiler.js';

test('Instruction', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Colour 1, $ABC'
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain("colorMapping[1] = 'rgb(170, 187, 204)'");
});
