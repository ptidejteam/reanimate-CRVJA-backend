import transpileAmosToJS_v2_0_0 from "../transpilers/transpiler_v2_0_0/transpile-amos-to-js-v2-0-0.js"
import transpileAmosToJS_v1_1_0 from "../transpilers/transpiler_v1_1_0/transpile-amos-to-v1-1-0.js";

const DEFAULT_VERSION = '2.0.0';

const transpilers = {
  '1.1.0': transpileAmosToJS_v1_1_0,
  '2.0.0': transpileAmosToJS_v2_0_0
};

/**
 * Transpile the AMOS code
 * @param {string} amosCode - The AMOS Basic code to transpile.
 * @param {string} [version='2.0.0'] - The version of the transpiler to use.
 * @returns {transpileResult} - The lexicalErrors, syntaxErrors, and translatedCode (JS).
 */
export const transpileCode = (amosCode, version = DEFAULT_VERSION) => {
  const transpilerFunction = transpilers[version] || transpilers[DEFAULT_VERSION];

  return transpilerFunction(amosCode);
};