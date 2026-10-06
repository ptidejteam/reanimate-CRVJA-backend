import transpile from '../transpiler.js';

test('abs translation', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile('X = Abs(-3)');

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('X = Math.abs(-3);');
});
