import { transpileCode } from '../src/services/transpiler.service.js';
import { getAvailableVersions } from '../src/services/versions.service.js';

describe('Versions Service', () => {
  test('should return the canonical transpiler versions newest first', async () => {
    const versions = await getAvailableVersions();
    expect(versions).toEqual(['2.0', '1.2', '1.1']);
  });
});

describe('Transpiler Service', () => {
  const amosCode = 'Cls';

  test('should transpile successfully with a valid version', async () => {
    const result = await transpileCode(amosCode, '2.0');
    expect(result).toBeDefined();
    expect(result.lexicalErrors.errors).toEqual([]);
    expect(result.syntaxErrors.errors).toEqual([]);
    expect(result.translatedCode).toContain('Version 2.0 of the AMOS to JavaScript Transpiler');
    expect(result.translatedCode).toContain('amos-screen');
  });

  test.each([
    ['explicit', '2.0'],
    ['default', undefined],
  ])('should transpile numeric functions with the %s version', async (_name, version) => {
    const functions = [
      ['EXP_RESULT', 'Exp', 'exp'],
      ['LN_RESULT', 'Ln', 'log'],
      ['LOG_RESULT', 'Log', 'log10'],
      ['SQR_RESULT', 'Sqr', 'sqrt'],
      ['HCOS_RESULT', 'Hcos', 'cosh'],
      ['HSIN_RESULT', 'Hsin', 'sinh'],
      ['HTAN_RESULT', 'Htan', 'tanh'],
    ];
    const source = [
      'ARGUMENT#=0.5',
      ...functions.map(([variable, amos]) => `${variable}#=${amos}(ARGUMENT#)`),
    ].join('\n');

    const result = await transpileCode(source, version);

    expect(Object.keys(result).sort()).toEqual(['lexicalErrors', 'syntaxErrors', 'translatedCode']);
    expect(result.lexicalErrors).toEqual({ errors: [] });
    expect(result.syntaxErrors).toEqual({ errors: [] });
    for (const [variable, _amos, math] of functions) {
      expect(result.translatedCode).toContain(`${variable}_f = Math.${math}(ARGUMENT_f);`);
    }
  });

  test.each(['1.1', '1.2'])('should transpile successfully with version %s', async (version) => {
    const result = await transpileCode(amosCode, version);
    expect(result).toBeDefined();
    expect(result.lexicalErrors.errors).toEqual([]);
    expect(result.syntaxErrors.errors).toEqual([]);
    expect(result.translatedCode).toContain(
      `Version ${version} of the AMOS to JavaScript Transpiler`,
    );
    expect(result.translatedCode).toContain('amos-screen');
  });

  test.each([
    ['1.1.0', '1.1'],
    ['1.2.0', '1.2'],
    ['2.0.0-beta', '2.0'],
  ])('should resolve legacy version %s to %s', async (legacy, canonical) => {
    expect(await transpileCode(amosCode, legacy)).toEqual(await transpileCode(amosCode, canonical));
  });

  test('should keep diagnostics separate between concurrent requests', async () => {
    const [failed, succeeded] = await Promise.all([
      transpileCode('A=1+\n2', '2.0'),
      transpileCode(amosCode, '2.0'),
    ]);
    expect(failed.syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(failed.translatedCode).toBe('');
    expect(succeeded.lexicalErrors.errors).toEqual([]);
    expect(succeeded.syntaxErrors.errors).toEqual([]);
    expect(succeeded.translatedCode).toContain('amos-screen');
  });

  test.each([undefined, '', 2, '9.9.9-nonexistent', '../../services'])(
    'should fall back to 2.0 for version %p',
    async (version) => {
      const result = await transpileCode(amosCode, version);
      expect(result.lexicalErrors.errors).toEqual([]);
      expect(result.syntaxErrors.errors).toEqual([]);
      expect(result.translatedCode).toContain('Version 2.0 of the AMOS to JavaScript Transpiler');
      expect(result.translatedCode).toContain('amos-screen');
    },
  );
});
