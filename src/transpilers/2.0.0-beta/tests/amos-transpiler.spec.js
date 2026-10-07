import AMOSTranspiler from '../AMOSTranspiler.js';

// Each transpile() starts from nothing: no diagnostics, declarations or output carried over.
describe('AMOSTranspiler instance isolation', () => {
  test('successive calls on one instance do not share declarations', async () => {
    const transpiler = new AMOSTranspiler();
    await transpiler.transpile('ALPHA=1');
    const { lexicalErrors, syntaxErrors, translatedCode } = await transpiler.transpile('BETA=2');

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors).toEqual([]);
    expect(translatedCode).toContain('let BETA = 0;');
    expect(translatedCode).not.toContain('ALPHA');
  });

  test('a failing call does not leave errors for the next call', async () => {
    const transpiler = new AMOSTranspiler();
    const failed = await transpiler.transpile('A=1+\n2');
    const { lexicalErrors, syntaxErrors, translatedCode } = await transpiler.transpile('Cls');

    expect(failed.syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors).toEqual([]);
    expect(translatedCode).toContain('amos-screen');
  });

  test('concurrent calls do not share declarations', async () => {
    const [alpha, beta] = await Promise.all([
      new AMOSTranspiler().transpile('ALPHA=1'),
      new AMOSTranspiler().transpile('BETA=2'),
    ]);

    expect(alpha.translatedCode).toContain('let ALPHA = 0;');
    expect(alpha.translatedCode).not.toContain('BETA');
    expect(beta.translatedCode).toContain('let BETA = 0;');
    expect(beta.translatedCode).not.toContain('ALPHA');
  });
});
