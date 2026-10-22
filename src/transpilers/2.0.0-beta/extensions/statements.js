import { createPositionLookup } from '../amos-error-listener.js';
import StatementScanner from './statement-scanner.js';

/** Tries mini-parsers and keeps accepted fragments in their original positions. */
export default class ExtensionStatements {
  constructor(source, extensions) {
    this.source = source;
    this.extensions = extensions;
    this.scanner = new StatementScanner(source);
    this.positionAt = createPositionLookup(source);
  }

  /** Finds accepted fragments and masks their text for the AMOS lexer. */
  prepareStatements() {
    const statements = [];
    const parts = this.scanner.parts;
    let atStatementStart = true;
    let bracketDepth = 0;

    for (let i = 0; i < parts.length;) {
      const part = parts[i];
      if (atStatementStart && !['space', 'comment', 'newline'].includes(part.kind)) {
        const endPartIndex = this.scanner.findStatementEndIndex(i);
        const end = parts[endPartIndex]?.start ?? this.source.length;
        const match =
          end > part.start ? this.tryExtensionParsers(this.source.slice(part.start, end)) : null;
        if (match) {
          statements.push({
            start: part.start,
            stop: end - 1,
            ...this.positionAt(part.start),
            ...match,
          });
          i = endPartIndex;
          atStatementStart = false;
          continue;
        }
        // Leave rejected text for AMOS, but keep looking for Then/Else boundaries
        // inside it: an inline branch may contain an accepted extension statement.
      }
      if (part.kind === 'newline') {
        atStatementStart = true;
        bracketDepth = 0;
      } else if (part.kind !== 'space' && part.kind !== 'comment') {
        atStatementStart = this.scanner.startsStatementAfter(part, bracketDepth);
        bracketDepth = this.scanner.nextBracketDepth(bracketDepth, part);
      }
      i++;
    }
    return { source: this.maskExtensionStatements(statements), statements };
  }

  tryExtensionParsers(source) {
    for (const extension of this.extensions) {
      const node = extension.parse(source);
      if (node === null) continue;
      if (typeof node !== 'object' || typeof node.then === 'function') {
        throw new Error(
          `${extension.constructor.name}.parse() must return a node or null synchronously`,
        );
      }
      // First success wins. Later parsers do not participate in this statement.
      return { extension, node };
    }
    return null;
  }

  maskExtensionStatements(statements) {
    const masked = [];
    let copiedUntil = 0;
    for (const { start, stop } of statements) {
      // Equal-length spaces preserve offsets. The scanner excludes line endings.
      masked.push(this.source.slice(copiedUntil, start), ' '.repeat(stop - start + 1));
      copiedUntil = stop + 1;
    }
    masked.push(this.source.slice(copiedUntil));
    return masked.join('');
  }
}
