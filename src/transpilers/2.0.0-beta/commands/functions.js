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
    console.log('To be implemented...');
    return `0`;
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
	const value = Number(this.visit(ctx.expression()));
	return String(Math.exp(Value));
  }

  // FALSE
  visitFalseFunction(ctx) {
    console.log('To be implemented...');
    return `0`;
  }

  // HCOS
  visitHcosFunction(ctx) {
    const angle = this.expr(ctx.expression());

    if (!Number.isFinite(angle)) {
      throw new RangeError(`${angle} must be a finite, real number.`);
    }
  
    if (Math.abs(angle) > 710.47) {
      throw new RangeError(`${angle} is too large and will cause floating-point overflow.`);
    }

    return `Math.cosh(${angle})`;
  }

  // HSIN
  visitHsinFunction(ctx) {
    console.log('To be implemented...');
    return `0`;
  }

  // HTAN
  visitHtanFunction(ctx) {
    const num = this.expr(ctx.expression());

    if (!Number.isFinite(num)) {
      if (isNaN(num)) {
        console.error(`Invalid number ${num}`);
        return null;
      }
    }

    return `Math.tanh(${num})`;
  }

  // INT
  visitIntFunction(ctx) {
    console.log('To be implemented...');
    return `0`;
  }

  // LN
  visitLnFunction(ctx) {
	const value = Number(this.visit(ctx.expression()));
	
	if (value <= 0){
		throw new Error("LN requires a positive number.");
	}
	
	return String(Math.log(value));
  }

  // LOG
  visitLogFunction(ctx) {
	const value = Number(this.visit(ctx.expression()));
	
	if (value <= 0){
		throw new Error("LOG requires a positive number.");
	}
	
	return String(Math.log10(value));
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
    console.log('To be implemented...');
    return `0`;
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
	const number = Number(this.visit(ctx.expression()));
	
	if (number < 0){
		throw new error("Sqr requires a non-negative number.");
	}
	
	return String(Math.sqrt(number));
  }

  // TRUE
  visitTrueFunction(ctx) {
    console.log('To be implemented...');
    return `0`;
  }
}
