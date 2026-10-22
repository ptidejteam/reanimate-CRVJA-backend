import antlr4 from 'antlr4';
import AMOSParser from '../grammar/generated/AMOSParser.js';

/** Merges extension nodes into the ordinary AMOS token stream in source order. */
export default class ExtensionTokenSource {
  constructor(lexer, statements, source) {
    this.lexer = lexer;
    this.statements = statements;
    this.source = source;
    this.index = 0;
    this.pending = undefined;
    // ANTLR's token stream expects its token source to expose the lexer factory.
    this._factory = lexer._factory;
  }

  nextToken() {
    this.pending ??= this.lexer.nextToken();
    const statement = this.statements[this.index];
    if (
      statement &&
      (this.pending.type === antlr4.Token.EOF || statement.start < this.pending.start)
    ) {
      this.index++;
      // Keep the ordinary token pending until all earlier extension spans are emitted.
      return this.createStatementToken(statement);
    }
    const token = this.pending;
    this.pending = undefined;
    return token;
  }

  createStatementToken(statement) {
    const token = new antlr4.CommonToken(
      [this.lexer, this.lexer._input],
      AMOSParser.EXTENSION_STATEMENT,
      antlr4.Token.DEFAULT_CHANNEL,
      statement.start,
      statement.stop,
    );
    token.line = statement.line;
    token.column = statement.column;
    token.text = this.source.slice(statement.start, statement.stop + 1);
    token.extensionStatement = statement;
    return token;
  }
}
