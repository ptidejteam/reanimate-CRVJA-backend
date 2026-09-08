import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

test('palette converts AMOS 12-bit colors through the shared converter', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile('Palette $000,$F80,$FFF');

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('rgb(0, 0, 0)');
  expect(translatedCode).toContain('rgb(255, 136, 0)');
  expect(translatedCode).toContain('rgb(255, 255, 255)');
});
