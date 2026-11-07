import { getAvailableVersions } from './versions.service.js';

const DEFAULT_VERSION = '2.0';
const legacyVersions = new Map([
  ['1.1.0', '1.1'],
  ['1.2.0', '1.2'],
  ['2.0.0-beta', '2.0'],
]);

/**
 * Transpile the AMOS code
 * @param {string} amosCode - The AMOS Basic code to transpile.
 * @param {string} version - The version of the transpiler to use.
 * @returns {transpileResult} - The lexicalErrors, syntaxErrors, and translatedCode (JS).
 */
export async function transpileCode(amosCode, version) {
  const availableVersions = await getAvailableVersions();
  const requestedVersion = legacyVersions.get(version) ?? version;
  const selectedVersion = availableVersions.includes(requestedVersion)
    ? requestedVersion
    : DEFAULT_VERSION;

  const { default: AMOSTranspiler } = await import(
    `../transpilers/${selectedVersion}/amos-transpiler.js`
  );

  return new AMOSTranspiler().transpile(amosCode);
}
