import AMOSTranspiler from '../amos-transpiler.js';

test('radian goes back to radians after degree', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Degree\nA# = Sin(90)\nRadian\nB# = Sin(1)',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('A_f = Math.sin((90 * Math.PI) / 180);');
  expect(translatedCode).toContain('B_f = Math.sin(1);');
});

test('radian on its own changes nothing', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Radian\nX# = Asin(1)',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('X_f = Math.asin(1);');
});