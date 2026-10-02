import BaseHandler from './base-handler.js';

/**
 * AMOS commands of the category "Function", sorted A-Z by AMOS name.
 *
 * A function is part of an expression: instead of emitting code, each method
 * returns the JavaScript expression that replaces the AMOS function call.
 * Each method is called by the forwarder with the same name in expression-visitor.js.
 * Category source: tracking spreadsheet / https://amospromanual.dev/99-appendix-g-command-index.html
 */
export default class Functions extends BaseHandler {
  // ---- COS: https://amospromanual.dev/05-03-maths.html#fn-cos ----
  /**
   * Grammar Rule:
   * cosFunction: 'Cos' '(' (NUMBER | IDENTIFIER | expression) ')'
   */
  visitCosFunction(ctx) {
    const arg = this._extractFunctionArg(ctx);
    return `Math.cos(${arg})`;
  }

  // ---- RND: https://amospromanual.dev/05-03-maths.html#fn-rnd ----
  /**
   * Grammar Rule:
   * rndFunction: 'Rnd' '(' (NUMBER | IDENTIFIER | expression) ')'
   */
  visitRndFunction(ctx) {
    const arg = this._extractFunctionArg(ctx);
    return `Math.floor(Math.random() * (${arg} + 1))`;
  }

  // ---- SIN: https://amospromanual.dev/05-03-maths.html#fn-sin ----
  /**
   * Grammar Rule:
   * sinFunction: 'Sin' '(' (NUMBER | IDENTIFIER | expression) ')'
   */
  visitSinFunction(ctx) {
    const arg = this._extractFunctionArg(ctx);
    return `Math.sin(${arg})`;
  }

  /**
   * Helper shared by COS, RND and SIN.
   * Extracts the argument from math function rules that use
   * (NUMBER | IDENTIFIER | expression) — prefers `expression()` if present,
   * otherwise falls back to the raw token text (NUMBER or IDENTIFIER).
   */
  _extractFunctionArg(ctx) {
    if (ctx.expression()) {
      return this.expr(ctx.expression());
    }
    // Fallback for bare NUMBER or IDENTIFIER alternatives
    if (ctx.NUMBER()) return ctx.NUMBER().getText();
    if (ctx.IDENTIFIER()) return ctx.IDENTIFIER().getText();
    return ctx.getText();
  }
}
