import { readFile } from "fs/promises";

/**
 * Get the available Transpiler versions
 * @returns {transpilerVersions} - List.
 */
export async function fetchAvailableVersions(amosCode, version) {
  return ["1.1.0", "1.2.0", "2.0.0-beta"];
}
