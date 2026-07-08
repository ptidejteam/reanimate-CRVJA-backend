import antlr4 from "antlr4";

export default class CollectingErrorListener extends antlr4.error.ErrorListener {
  constructor() {
    super();
    this.errors = [];
  }
  syntaxError(recognizer, offendingSymbol, line, column, msg /*, e*/) {
    this.errors.push({ line, column, msg });
  }
}
