import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Global keeps a variable shared with the Procedures', async () => {
  const normalizedJS = await translate(
    'SHARED_VALUE = 55\nGlobal SHARED_VALUE\nProcedure PROC_UPDATE\nSHARED_VALUE = 56\nEnd Proc',
  );

  expect(normalizedJS.match(/let SHARED_VALUE = 0;/g)).toHaveLength(1);
  expect(normalizedJS).toContain('SHARED_VALUE = 55;');
  expect(normalizedJS).toContain('SHARED_VALUE = 56;');
});
