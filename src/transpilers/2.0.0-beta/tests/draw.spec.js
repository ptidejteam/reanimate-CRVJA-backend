import AMOSTranspiler from '../amos-transpiler.js';


test('draw translation', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Draw 50,50 To 250,150',
  );
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('const drawX1 = 50;');
  expect(translatedCode).toContain('const drawY1 = 50;');
  expect(translatedCode).toContain('const drawX2 = 250;');
  expect(translatedCode).toContain('const drawY2 = 150;');
});
test('draw with variables', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'X=10 : Y=20\nDraw X,Y To X+100,Y',
  );
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('const drawX1 = X;');
  expect(translatedCode).toContain('const drawX2 = X + 100;');
});