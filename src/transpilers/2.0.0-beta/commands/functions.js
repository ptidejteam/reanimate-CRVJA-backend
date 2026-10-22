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

  // ACOS
  visitAcosFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.acos(${value})`;
  }

  // ASIN
  visitAsinFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.asin(${value})`;
  }

  // ATAN
  visitAtanFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.atan(${value})`;
  }

  // COLOUR
  visitColourFunction(ctx) {
    console.log('To be implemented...');
    return `0`;
  }

  // COS
  visitCosFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.cos(${angle})`;
  }

  // EXP
  visitExpFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.exp(${value})`;
  }

  // HCOS
  visitHcosFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.cosh(${angle})`;
  }

  // HSIN
  visitHsinFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.sinh(${angle})`;
  }

  // HTAN
  visitHtanFunction(ctx) {
    const angle = this.expr(ctx.expression());
    return `Math.tanh(${angle})`;
  }

  // INT
  visitIntFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.floor(${value})`;
  }

  // LN
  visitLnFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.log(${value})`;
  }

  // LOG
  visitLogFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.log10(${value})`;
  }

  // MAX
  visitMaxFunction(ctx) {
    const value1 = this.expr(ctx.expression(0));
    const value2 = this.expr(ctx.expression(1));

    return `Math.max(${value1}, ${value2})`;
  }

  // MIN
  visitMinFunction(ctx) {
    const value1 = this.expr(ctx.expression(0));
    const value2 = this.expr(ctx.expression(1));

    return `Math.min(${value1}, ${value2})`;
  }

  // PI#
  visitPiFunction(ctx) {
    return `Math.PI`;
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

  // SQR
  visitSqrFunction(ctx) {
    const value = this.expr(ctx.expression());
    return `Math.sqrt(${value})`;
  }

  // TRUE
  visitTrueFunction(ctx) {
    return `(-1)`;
  }

  // FALSE
  visitFalseFunction(ctx) {
    return `(0)`;
  }
}
