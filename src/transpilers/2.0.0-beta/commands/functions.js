/**
 * AMOS commands of the category "Function", sorted A-Z by AMOS name.
 * Implemented methods return the JavaScript expression that replaces the function call.
 */
export default class Functions {
  constructor(context) {
    this.context = context;
    this.expressions = context.expressions;
  }

  // ABS
  translateAbsFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `Math.abs(${value})`;
  }

  // ACOS
  translateAcosFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    //return `Math.acos(${value})`;
    return this.fromRadians(`Math.acos(${value})`);
  }

  // ASIN
  translateAsinFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    //return `Math.asin(${value})`;
    return this.fromRadians(`Math.asin(${value})`);
  }

  // ATAN
  translateAtanFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    //return `Math.atan(${value})`;
    return this.fromRadians(`Math.atan(${value})`);
  }

  // COLOUR
  translateColourFunction(ctx) {
    const index = this.expressions.translate(ctx.expression());
    return `cssRgbToAmiga12Bit(getColour(${index}))`;
  }

  // COS
  translateCosFunction(ctx) {
    const angle = this.expressions.translate(ctx.expression());
   // return `Math.cos(${angle})`;
   return `Math.cos(${this.toRadians(angle)})`;
  }

  // EXP
  translateExpFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `Math.exp(${value})`;
  }

  // FLIP$
  translateFlipFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `(${value}).split('').reverse().join('')`;
  }

  // HCOS
  translateHcosFunction(ctx) {
    const angle = this.expressions.translate(ctx.expression());
    return `Math.cosh(${angle})`;
  }

  // HSIN
  translateHsinFunction(ctx) {
    const angle = this.expressions.translate(ctx.expression());
    return `Math.sinh(${angle})`;
  }

  // HTAN
  translateHtanFunction(ctx) {
    const angle = this.expressions.translate(ctx.expression());
    return `Math.tanh(${angle})`;
  }

  // INT
  translateIntFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `Math.floor(${value})`;
  }

  // LN
  translateLnFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `Math.log(${value})`;
  }

  // LOG
  translateLogFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `Math.log10(${value})`;
  }

  // LOWER$
  translateLowerFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `(${value}).toLowerCase()`;
  }

  // MAX
  translateMaxFunction(ctx) {
    const value1 = this.expressions.translate(ctx.expression(0));
    const value2 = this.expressions.translate(ctx.expression(1));

    return `Math.max(${value1}, ${value2})`;
  }

  // MIN
  translateMinFunction(ctx) {
    const value1 = this.expressions.translate(ctx.expression(0));
    const value2 = this.expressions.translate(ctx.expression(1));

    return `Math.min(${value1}, ${value2})`;
  }

  // PI#
  translatePiFunction(ctx) {
    return `Math.PI`;
  }

  // RND
  translateRndFunction(ctx) {
    const angle = this.expressions.translate(ctx.expression());
    return `Math.floor(Math.random() * (${angle} + 1))`;
  }

  // SIN
  translateSinFunction(ctx) {
    const angle = this.expressions.translate(ctx.expression());
    //return `Math.sin(${angle})`;
    return `Math.sin(${this.toRadians(angle)})`;
  }

  // SPRITE COL
  translateSpriteColFunction(ctx) {
    console.log('to be implemented');
  }

  // SQR
  translateSqrFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `Math.sqrt(${value})`;
  }

  // TRUE
  translateTrueFunction(ctx) {
    return `(-1)`;
  }

  // FALSE
  translateFalseFunction(ctx) {
    return `(0)`;
  }

  // UPPER$
  translateUpperFunction(ctx) {
    const value = this.expressions.translate(ctx.expression());
    return `(${value}).toUpperCase()`;
  }

  // X SPRITE
  translateXSpriteFunction(ctx) {
    const spriteNumber = this.expressions.translate(ctx.expression());
    return `getXSpritePosition(${spriteNumber})`;
  }

  // Y SPRITE
  translateYSpriteFunction(ctx) {
    const spriteNumber = this.expressions.translate(ctx.expression());
    return `getYSpritePosition(${spriteNumber})`;
  }
  toRadians(angle) {
    return this.context.degreeMode ? `(${angle}) * Math.PI / 180` : angle;
  }

  fromRadians(angle) {
    return this.context.degreeMode ? `(${angle} * 180 / Math.PI)` : angle;
  }
}
