import BaseHandler from './base-handler.js';

/**
 * AMOS commands of the category "Function", sorted A-Z by AMOS name.
 * Each method returns the JavaScript expression that replaces the function call.
 */
export default class Functions extends BaseHandler {
  // ABS
  visitAbsFunction(ctx) {
    const argument = this.expr(ctx.expression());
    return `Math.abs(${argument})`;
  }

  // COS
  visitCosFunction(ctx) {
    const argument = this.expr(ctx.expression());
    return `Math.cos(${argument})`;
  }

  // RND
  visitRndFunction(ctx) {
    const argument = this.expr(ctx.expression());
    return `Math.floor(Math.random() * (${argument} + 1))`;
  }

  // SIN
  visitSinFunction(ctx) {
    const argument = this.expr(ctx.expression());
    return `Math.sin(${argument})`;
  }
}
