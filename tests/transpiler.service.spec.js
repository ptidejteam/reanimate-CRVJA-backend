import { transpileCode } from '../src/services/transpiler.service.js';
import { getAvailableVersions } from '../src/services/versions.service.js';

describe('Versions Service', () => {
  test('should return available transpiler versions including 2.0.0-beta', async () => {
    const versions = await getAvailableVersions();
    expect(Array.isArray(versions)).toBe(true);
    expect(versions).toContain('2.0.0-beta');
    expect(versions).toContain('1.2.0');
    expect(versions).toContain('1.1.0');
  });
});

describe('Transpiler Service', () => {
  const amosCode = 'Cls';

  test('should transpile successfully with a valid version', async () => {
    const result = await transpileCode(amosCode, '2.0.0-beta');
    expect(result).toBeDefined();
    expect(result.lexicalErrors.errors).toEqual([]);
    expect(result.syntaxErrors.errors).toEqual([]);
    expect(result.translatedCode).toContain('amos-screen');
  });

  test.each([
    ['explicit', '2.0.0-beta'],
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

  test.each(['1.1.0', '1.2.0'])(
    'should transpile successfully with version %s',
    async (version) => {
      const result = await transpileCode(amosCode, version);
      expect(result).toBeDefined();
      expect(result.lexicalErrors.errors).toEqual([]);
      expect(result.syntaxErrors.errors).toEqual([]);
      expect(result.translatedCode).toContain(`Version ${version}`);
      expect(result.translatedCode).toContain('amos-screen');
    },
  );

  test('should keep diagnostics separate between concurrent requests', async () => {
    const [failed, succeeded] = await Promise.all([
      transpileCode('A=1+\n2', '2.0.0-beta'),
      transpileCode(amosCode, '2.0.0-beta'),
    ]);
    expect(failed.syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(failed.translatedCode).toBe('');
    expect(succeeded.lexicalErrors.errors).toEqual([]);
    expect(succeeded.syntaxErrors.errors).toEqual([]);
    expect(succeeded.translatedCode).toContain('amos-screen');
  });

  test('should fall back to default version when version is missing or undefined', async () => {
    // Falls back to default version (2.0.0-beta) and should transpile successfully
    const result = await transpileCode(amosCode, undefined);
    expect(result).toBeDefined();
    expect(result.lexicalErrors.errors).toEqual([]);
    expect(result.syntaxErrors.errors).toEqual([]);
    expect(result.translatedCode).toContain('amos-screen');
  });

  test('should fall back to default version when version is an empty string', async () => {
    const result = await transpileCode(amosCode, '');
    expect(result).toBeDefined();
    expect(result.translatedCode).toContain('amos-screen');
  });

  test('should fall back to default version when version is invalid / does not exist', async () => {
    const result = await transpileCode(amosCode, '9.9.9-nonexistent');
    expect(result).toBeDefined();
    expect(result.translatedCode).toContain('amos-screen');
  });

  test('should fall back to default version and prevent path traversal when version contains directory traversal sequences', async () => {
    const result = await transpileCode(amosCode, '../../services');
    expect(result).toBeDefined();
    expect(result.translatedCode).toContain('amos-screen');
  });
});
