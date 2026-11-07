import antlr4 from 'antlr4';

/** ANTLR counts LF only; source diagnostics also need to handle standalone CR. */
export function createPositionLookup(source) {
  const starts = [0];
  for (const match of source.matchAll(/\r\n|\r|\n/g)) starts.push(match.index + match[0].length);
  return (offset) => {
    let low = 0;
    let high = starts.length;
    while (low + 1 < high) {
      const middle = (low + high) >>> 1;
      if (starts[middle] <= offset) low = middle;
      else high = middle;
    }
    return { line: low + 1, column: offset - starts[low] };
  };
}

export default class AMOSErrorListener extends antlr4.error.ErrorListener {
  constructor(source) {
    super();
    this.errors = [];
    this.lexicalErrors = { errors: [] };
    this.syntaxErrors = { errors: [] };
    this.positionAt = source === undefined ? null : createPositionLookup(source);
  }
  syntaxError(recognizer, offendingSymbol, line, column, msg /*, e*/) {
    const offset = offendingSymbol?.start ?? recognizer._tokenStartCharIndex;
    if (this.positionAt && offset >= 0) ({ line, column } = this.positionAt(offset));
    const error = { line, column, msg };
    this.errors.push(error);
    const diagnostics = recognizer instanceof antlr4.Lexer ? this.lexicalErrors : this.syntaxErrors;
    diagnostics.errors.push(error);
  }
}
