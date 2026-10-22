import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Loads mini-transpilers by folder convention, without command registration. */
export default class ExtensionLoader {
  constructor(directory = new URL('./', import.meta.url)) {
    this.directory = path.resolve(directory instanceof URL ? fileURLToPath(directory) : directory);
  }

  async load() {
    const entries = await readdir(this.directory, { withFileTypes: true });
    const names = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const extensions = [];
    for (const name of names) {
      const folder = path.join(this.directory, name);
      const filename = `${name}-transpiler.js`;
      if (!(await readdir(folder)).includes(filename)) continue;
      const { default: MiniTranspiler } = await import(
        pathToFileURL(path.join(folder, filename)).href
      );
      if (typeof MiniTranspiler !== 'function' || !MiniTranspiler.prototype) {
        throw new Error(`Extension ${name} must export a mini-transpiler class`);
      }
      // Imports are cached by Node. Instances are fresh so counters never leak
      // between programs, even when the same AMOSTranspiler is reused.
      const extension = new MiniTranspiler();
      if (
        typeof extension.parse !== 'function' ||
        typeof extension.translate !== 'function' ||
        (extension.runtimeSource !== undefined && typeof extension.runtimeSource !== 'string')
      ) {
        throw new Error(
          `Invalid mini-transpiler ${name}: expected parse(), translate(), and optional runtimeSource string`,
        );
      }
      extensions.push(extension);
    }
    return extensions;
  }
}
