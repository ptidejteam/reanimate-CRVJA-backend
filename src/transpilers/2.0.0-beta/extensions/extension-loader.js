import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Loads mini-transpilers by folder convention, without command registration. */
export default class ExtensionLoader {
  constructor(extensionsDirectory = new URL('./', import.meta.url)) {
    this.extensionsDirectory = path.resolve(
      extensionsDirectory instanceof URL ? fileURLToPath(extensionsDirectory) : extensionsDirectory,
    );
  }

  /** Returns fresh instances in folder-name order, which determines parser precedence. */
  async loadExtensions() {
    const directoryEntries = await readdir(this.extensionsDirectory, { withFileTypes: true });
    const extensionFolderNames = directoryEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const extensions = [];
    for (const extensionName of extensionFolderNames) {
      const extensionDirectory = path.join(this.extensionsDirectory, extensionName);
      const entryFilename = `${extensionName}-transpiler.js`;
      if (!(await readdir(extensionDirectory)).includes(entryFilename)) continue;
      const { default: MiniTranspiler } = await import(
        pathToFileURL(path.join(extensionDirectory, entryFilename)).href
      );
      if (typeof MiniTranspiler !== 'function' || !MiniTranspiler.prototype) {
        throw new Error(`Extension ${extensionName} must export a mini-transpiler class`);
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
          `Invalid mini-transpiler ${extensionName}: expected parse(), translate(), and optional runtimeSource string`,
        );
      }
      extensions.push(extension);
    }
    return extensions;
  }
}
