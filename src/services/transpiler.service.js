import { readFile } from 'fs/promises';
import { getAvailableVersions } from './versions.service.js';

/**
 * Transpile the AMOS code
 * @param {string} amosCode - The AMOS Basic code to transpile.
 * @param {string} version - The version of the transpiler to use.
 * @returns {transpileResult} - The lexicalErrors, syntaxErrors, and translatedCode (JS).
 */
export async function transpileCode(amosCode, version) {
  // get the defaultVersion of the `transpiler` from "package.json"
  const packageData = await readFile(new URL('../../package.json', import.meta.url), 'utf-8');
  const { version: defaultVersion } = JSON.parse(packageData);

  const availableVersions = await getAvailableVersions();

  let selectedVersion = version;
  if (
    !selectedVersion ||
    typeof selectedVersion !== 'string' ||
    !availableVersions.includes(selectedVersion)
  ) {
    selectedVersion = defaultVersion;
  }

  const { default: AMOSTranspiler } = await import(
    `../transpilers/${selectedVersion}/AMOSTranspiler.js`
  );

  return new AMOSTranspiler().transpile(amosCode);
}
