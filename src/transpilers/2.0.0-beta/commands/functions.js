import BaseHandler from './base-handler.js';

/**
 * AMOS commands of the category "Function", sorted A-Z by AMOS name.
 * Each method returns the JavaScript expression that replaces the function call.
 */
export default class Functions extends BaseHandler {
  // ABS
  visitAbsFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.abs(${value})`;
  }

  // COS
  visitCosFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.cos(${angle})`;
  }

  // RND
  visitRndFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.floor(Math.random() * (${angle} + 1))`;
  }

  // SIN
  visitSinFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.sin(${angle})`;
  }
}
