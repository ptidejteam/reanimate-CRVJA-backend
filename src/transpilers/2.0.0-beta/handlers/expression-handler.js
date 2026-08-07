import ExpressionVisitor from './expression-visitor.js';

/**
 * ExpressionHandler is a thin wrapper around ExpressionVisitor.
 *
 * Statement-level Listeners call `handleExpression(ctx)` to transpile an
 * expression AST subtree into a JavaScript string. Internally, all the
 * heavy lifting is done by ExpressionVisitor using ANTLR's standard
 * Visitor dispatch — no manual children iteration, no constructor-name
 * checks, and no mutable accumulator arrays.
 */
export default class ExpressionHandler {
  constructor(translator) {
    this.translator = translator;
    this.visitor = new ExpressionVisitor(translator);
  }

  /**
   * Main entry point for evaluating any expression AST context node.
   * @param {ExpressionContext|FactorContext|TermContext} expressionContext
   * @returns {string} Transpiled JavaScript expression code
   */
  handleExpression(expressionContext) {
    if (!expressionContext) return '';
    return this.visitor.visit(expressionContext);
  }
}
