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

describe('Procedure command', () => {
  test('translates a procedure without parameters and its call', async () => {
    const { normalizedJS } = await translate(`
      Procedure PROC_RESET
      End Proc
      PROC_RESET
    `);

    expect(normalizedJS).toContain('function PROC_RESET() {');
    expect(normalizedJS).toContain('PROC_RESET();');
  });

  test('translates multiple parameters and call arguments in order', async () => {
    const { normalizedJS } = await translate(`
      Procedure PROC_SUM[A,B]
        RESULT = A + B
      End Proc
      PROC_SUM[1,2 + 3]
    `);

    expect(normalizedJS).toContain('function PROC_SUM(A, B) {');
    expect(normalizedJS).toContain('RESULT = A + B;');
    expect(normalizedJS).toContain('PROC_SUM(1, 2 + 3);');
  });

  test('generates valid JavaScript when assigning to a parameter', async () => {
    const { normalizedJS, translatedCode } = await translate(`
      MY_VAR = 55
      Global MY_VAR
      Procedure PROC_INCREMENT[X]
        X = X + 1
      End Proc
      PROC_INCREMENT[MY_VAR]
    `);

    expect(normalizedJS).toContain('function PROC_INCREMENT(X) {');
    expect(normalizedJS).toContain('X = X + 1;');
    expect(normalizedJS).toContain('PROC_INCREMENT(MY_VAR);');
    expect(normalizedJS).not.toContain('let X = 0;');
    expect(() => new Function(translatedCode)).not.toThrow();
  });
});
