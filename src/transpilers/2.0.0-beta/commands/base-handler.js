/**
 * Parent class of the command files in this folder (one file per command
 * category, see ../README.md).
 *
 * The methods of a command file are named after the grammar rule they
 * translate (rule `cls` -> `enterCls(ctx)`) and are called by the forwarder
 * with the same name in amos-translator.js (or expression-visitor.js for
 * functions).
 */
export default class BaseHandler {
  constructor(translator) {
    this.translator = translator;
  }

  /** Appends JavaScript to the program body. */
  emit(code) {
    this.translator.output += code;
  }

  /** Transpiles an expression subtree into a JavaScript expression string. */
  expr(ctx) {
    return this.translator.handleExpression(ctx);
  }

  /** Declares the variable with its AMOS default value the first time it is seen. */
  declareVariable(name) {
    this.translator.declareVariable(name);
  }
}
