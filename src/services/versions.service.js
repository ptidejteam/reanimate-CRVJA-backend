import { readFile } from "fs/promises";

/**
 * Get the available Transpiler versions
 * @returns {transpilerVersions} - List.
 */
export async function fetchAvailableVersions(amosCode, version) {
  return ["2.0.0-beta", "1.2.0", "1.1.0",];
}
