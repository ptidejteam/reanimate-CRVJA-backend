import antlr4 from 'antlr4';
import AMOSParser from '../grammar/generated/AMOSParser.js';

/** Merges extension nodes into the ordinary AMOS token stream in source order. */
export default class ExtensionTokenSource {
  constructor(lexer, statements, source) {
    this.amosLexer = lexer;
    this.statements = statements;
    this.source = source;
    this.statementIndex = 0;
    this.pendingAmosToken = undefined;
    // ANTLR's token stream expects its token source to expose the lexer factory.
    this._factory = lexer._factory;
  }

  nextToken() {
    this.pendingAmosToken ??= this.amosLexer.nextToken();
    const statement = this.statements[this.statementIndex];
    if (
      statement &&
      (this.pendingAmosToken.type === antlr4.Token.EOF ||
        statement.start < this.pendingAmosToken.start)
    ) {
      this.statementIndex++;
      // Keep the ordinary token pending until all earlier extension spans are emitted.
      return this.createStatementToken(statement);
    }
    const token = this.pendingAmosToken;
    this.pendingAmosToken = undefined;
    return token;
  }

  createStatementToken(statement) {
    const token = new antlr4.CommonToken(
      [this.amosLexer, this.amosLexer._input],
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
