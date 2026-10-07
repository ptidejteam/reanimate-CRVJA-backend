import AMOSTranspiler from '../AMOSTranspiler.js';

test('plot translation', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Plot 10,20',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain("plotDiv.style.left = 10 + 'px';");
  expect(translatedCode).toContain("plotDiv.style.top = 20 + 'px';");
});
