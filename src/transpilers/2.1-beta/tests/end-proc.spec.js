import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('End Proc closes the Procedure', async () => {
  const normalizedJS = await translate('Procedure PROC_RESET\nEnd Proc\nPROC_RESET');

  expect(normalizedJS).toContain('async function PROC_RESET() {}');
  expect(normalizedJS).toContain('await PROC_RESET();');
});
