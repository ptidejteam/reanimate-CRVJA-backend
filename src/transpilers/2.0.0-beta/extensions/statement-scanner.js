/** Reads AMOS statement boundaries without interpreting extension arguments. */
export default class StatementScanner {
  constructor(source) {
    this.source = source;
    this.parts = this.scanSource();
  }

  scanSource() {
    const source = this.source;
    const parts = [];
    const word = /[A-Za-z_][A-Za-z_0-9]*[$#]?/y;
    for (let start = 0; start < source.length;) {
      let end = start + 1;
      let kind = 'punctuation';
      const char = source[start];
      if (char === '\r' || char === '\n') {
        kind = 'newline';
        if (char === '\r' && source[end] === '\n') end++;
      } else if (char === ' ' || char === '\t') {
        kind = 'space';
        while (source[end] === ' ' || source[end] === '\t') end++;
      } else if (char === '"') {
        kind = 'string';
        while (end < source.length && !'"\r\n'.includes(source[end])) end++;
        if (source[end] === '"') end++;
      } else if (char === "'" || source.startsWith('Rem', start)) {
        // Match the current AMOS lexer: Rem consumes the rest of the line.
        kind = 'comment';
        while (end < source.length && !'\r\n'.includes(source[end])) end++;
      } else {
        word.lastIndex = start;
        const match = word.exec(source);
        if (match) {
          kind = 'word';
          end = word.lastIndex;
        }
      }
      parts.push({ start, end, kind, text: source.slice(start, end) });
      start = end;
    }
    return parts;
  }

  /** Returns the index of the terminating source part, not a character offset. */
  findStatementEndIndex(startPartIndex) {
    let bracketDepth = 0;
    for (let i = startPartIndex; i < this.parts.length; i++) {
      const part = this.parts[i];
      if (
        part.kind === 'newline' ||
        part.kind === 'comment' ||
        (bracketDepth === 0 &&
          (part.text === ':' || (part.kind === 'word' && part.text === 'Else')))
      )
        return i;
      bracketDepth = this.nextBracketDepth(bracketDepth, part);
    }
    return this.parts.length;
  }

  nextBracketDepth(bracketDepth, part) {
    if (part.kind !== 'punctuation') return bracketDepth;
    if ('([{'.includes(part.text)) return bracketDepth + 1;
    if (')]}'.includes(part.text)) return Math.max(0, bracketDepth - 1);
    return bracketDepth;
  }

  startsStatementAfter(part, bracketDepth) {
    return (
      bracketDepth === 0 &&
      (part.text === ':' || (part.kind === 'word' && ['Then', 'Else'].includes(part.text)))
    );
  }
}
