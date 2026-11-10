import { getAvailableVersions } from './versions.service.js';

/**
 * Transpile the AMOS code
 * @param {string} amosCode - The AMOS Basic code to transpile.
 * @param {string} version - The version of the transpiler to use.
 * @returns {transpileResult} - The lexicalErrors, syntaxErrors, and translatedCode (JS).
 */
export async function transpileCode(amosCode, version) {
  const availableVersions = await getAvailableVersions();
  // Unknown or missing versions use the newest one, matching the frontend default.
  const selectedVersion = availableVersions.includes(version) ? version : availableVersions[0];

  const { default: AMOSTranspiler } = await import(
    `../transpilers/${selectedVersion}/amos-transpiler.js`
  );

  return new AMOSTranspiler().transpile(amosCode);
}
