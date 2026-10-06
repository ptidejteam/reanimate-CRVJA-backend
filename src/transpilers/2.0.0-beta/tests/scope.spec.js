import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return {
    translatedCode,
    normalizedJS: translatedCode.replace(/\s+/g, ' ').trim(),
  };
}

describe('scope handling', () => {
  test('treats procedure parameters as existing local bindings', async () => {
    const { normalizedJS, translatedCode } = await translate(`
      Procedure PROC_INCREMENT[X]
        X = X + 1
      End Proc
    `);

    expect(normalizedJS).toContain('function PROC_INCREMENT(X) {');
    expect(normalizedJS).toContain('X = X + 1;');
    expect(normalizedJS).not.toContain('let X = 0;');
    expect(() => new Function(translatedCode)).not.toThrow();
  });

  test('declares a procedure local only once', async () => {
    const { normalizedJS } = await translate(`
      Procedure PROC_UPDATE
        LOCAL_VALUE = 1
        LOCAL_VALUE = 2
      End Proc
    `);

    expect(normalizedJS.match(/let LOCAL_VALUE = 0;/g)).toHaveLength(1);
    expect(normalizedJS).toContain('LOCAL_VALUE = 1; LOCAL_VALUE = 2;');
  });

  test('keeps declared globals global inside a procedure', async () => {
    const { normalizedJS } = await translate(`
      SHARED_VALUE = 55
      Global SHARED_VALUE
      Procedure PROC_UPDATE
        SHARED_VALUE = 56
      End Proc
    `);

    expect(normalizedJS.match(/let SHARED_VALUE = 0;/g)).toHaveLength(1);
    expect(normalizedJS).toContain('SHARED_VALUE = 55;');
    expect(normalizedJS).toContain('SHARED_VALUE = 56;');
  });

  test('shadows a non-global root variable inside a procedure', async () => {
    const { normalizedJS } = await translate(`
      ROOT_VALUE = 55
      Procedure PROC_UPDATE
        ROOT_VALUE = 56
      End Proc
    `);

    expect(normalizedJS.match(/let ROOT_VALUE = 0;/g)).toHaveLength(2);
    expect(normalizedJS).toContain('ROOT_VALUE = 55;');
    expect(normalizedJS).toContain('ROOT_VALUE = 56;');
  });
});
