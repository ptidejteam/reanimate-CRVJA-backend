import { readdir } from 'node:fs/promises';
/**
 * Get the available Transpiler versions
 * @returns {transpilerVersions} - List.
 */
export async function getAvailableVersions() {
  let directories = [];
  const path = new URL('../transpilers/', import.meta.url);

  try {
    // Read the contents of the path
    const entries = await readdir(path, { withFileTypes: true });

    // Filter and map out only the directory names
    directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    console.error('Error reading path:', error);
  }

  return directories.toReversed();
}
