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
