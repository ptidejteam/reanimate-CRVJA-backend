import antlr4 from 'antlr4';

export default class AmosErrorListener extends antlr4.error.ErrorListener {
  constructor() {
    super();
    this.errors = [];
    this.lexicalErrors = { errors: [] };
    this.syntaxErrors = { errors: [] };
  }
  syntaxError(recognizer, offendingSymbol, line, column, msg /*, e*/) {
    const error = { line, column, msg };
    this.errors.push(error);
    const diagnostics = recognizer instanceof antlr4.Lexer ? this.lexicalErrors : this.syntaxErrors;
    diagnostics.errors.push(error);
  }
}
