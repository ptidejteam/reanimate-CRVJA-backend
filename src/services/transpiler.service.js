import useAMOSParser from "../transpiler/useAmosParser.js"

/**
 * Processes the dummy "AMOS" code by returning its length.
 * @param {string} amosCode - The code to process.
 * @returns {number} - The number of characters in the code.
 */
export const processCode = (amosCode) => {
  // return amosCode.length;

  const code = useAMOSParser(amosCode);
  // expect(lexErrs.errors).toEqual([]);
  // expect(parseErrs.errors).toEqual([]);
  return code;
};