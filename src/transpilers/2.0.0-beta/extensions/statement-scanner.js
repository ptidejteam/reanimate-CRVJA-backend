/** Reads AMOS statement boundaries without interpreting extension arguments. */
export default class StatementScanner {
  constructor(source) {
    this.source = source;
    this.parts = this.scan();
  }

  scan() {
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

  findStatementEnd(start) {
    let depth = 0;
    for (let i = start; i < this.parts.length; i++) {
      const part = this.parts[i];
      if (
        part.kind === 'newline' ||
        part.kind === 'comment' ||
        (depth === 0 && (part.text === ':' || (part.kind === 'word' && part.text === 'Else')))
      )
        return i;
      depth = this.nextDepth(depth, part);
    }
    return this.parts.length;
  }

  nextDepth(depth, part) {
    if (part.kind !== 'punctuation') return depth;
    if ('([{'.includes(part.text)) return depth + 1;
    if (')]}'.includes(part.text)) return Math.max(0, depth - 1);
    return depth;
  }

  startsStatementAfter(part, depth) {
    return (
      depth === 0 &&
      (part.text === ':' || (part.kind === 'word' && ['Then', 'Else'].includes(part.text)))
    );
  }
}
