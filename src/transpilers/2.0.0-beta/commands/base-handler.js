/**
 * Parent class of the command files in this folder, one per AMOS command category.
 *
 * Their methods are named after the grammar rule they translate, and the translator calls
 * them automatically (forwardToCommands in amos-translator.js):
 * - enterX(ctx) / exitX(ctx) emit the code of an instruction or structure: rule `cls` -> enterCls;
 * - visitX(ctx) returns the code of a function inside an expression: rule `absFunction` -> visitAbsFunction.
 */
export default class BaseHandler {
  constructor(translator) {
    this.translator = translator;
  }

  /** Appends JavaScript to the program body. */
  emit(code) {
    this.translator.output += code;
  }

  /** Returns the JavaScript of an expression node ('' if ctx is missing). */
  expr(ctx) {
    return this.translator.handleExpression(ctx);
  }

  /** Declares the variable with its AMOS default value the first time it is seen. */
  declareVariable(name) {
    this.translator.declareVariable(name);
  }
}
