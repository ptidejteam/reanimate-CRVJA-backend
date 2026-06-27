import transpileAmosToJS from "#root/src/transpilers/transpiler_v2.0.0/transpileAmosToJS.js"
import transpileAmosToJS_v1_1_0 from "#root/src/transpilers/transpiler_v1.1.0/transpileAmosToJS_v1_1_0.js";
      
/**
 * Processes the dummy "AMOS" code by returning its length.
 * @param {string} amosCode - The AMOS Basic code to transpile.
 * @param {string} version - The version of the transpiler to use.
 * @returns {transpileResult} - The transpiled JavaScript code with Lexer and Parser.
 */
export const transpileCode = (amosCode, version) => {

  switch (version) {
    case '1.1.0':
      return transpileAmosToJS_v1_1_0(amosCode);
    case '2.0.0':
      return transpileAmosToJS(amosCode);
    default:
      return transpileAmosToJS(amosCode);
  }
};