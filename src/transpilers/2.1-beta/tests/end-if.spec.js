import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('End If closes the If block', async () => {
  const normalizedJS = await translate('If 1 > 0\nCurs Off\nEnd If');

  expect(normalizedJS).toContain(
    "if (1 > 0) { document.getElementById('amos-screen').style.cursor = 'none'; }",
  );
});
