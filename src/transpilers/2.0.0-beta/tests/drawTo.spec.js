import AMOSTranspiler from '../amos-transpiler.js';

test('draw to translation', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Draw To 275,175',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('const drawX1 = graphicCursorX;');
  expect(translatedCode).toContain('const drawY1 = graphicCursorY;');
  expect(translatedCode).toContain('const drawX2 = 275;');
  expect(translatedCode).toContain('const drawY2 = 175;');
});

test('draw moves the graphic cursor', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Draw 50,50 To 250,150',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('graphicCursorX = drawX2;');
  expect(translatedCode).toContain('graphicCursorY = drawY2;');
});