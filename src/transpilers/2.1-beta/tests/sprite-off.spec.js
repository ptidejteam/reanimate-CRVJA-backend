import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Sprite Off hides one sprite', async () => {
  expect(await translate('Sprite Off 0')).toContain('spriteOff(0);');
});

test('Sprite Off without a number hides all sprites', async () => {
  expect(await translate('Sprite Off')).toContain('spriteOff();');
});
