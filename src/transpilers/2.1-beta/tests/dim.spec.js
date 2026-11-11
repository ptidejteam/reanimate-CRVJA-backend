import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Dim creates a 1D array inclusive of the upper bound', async () => {
  const normalizedJS = await translate('Dim C(1)');

  expect(normalizedJS).toContain('const C = Array.from({ length: 1 + 1 }, () => 0);');
});

test('Dim creates a 2D array', async () => {
  const normalizedJS = await translate('Dim S(2,2)');

  expect(normalizedJS).toContain(
    'const S = Array.from({ length: 2 + 1 }, () => Array.from({ length: 2 + 1 }, () => 0), );',
  );
});
