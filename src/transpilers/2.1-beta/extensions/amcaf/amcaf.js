/**
 * Commands of the AMCAF extension, sorted A-Z by AMOS name. AMCAF is an AMOS
 * Professional extension, so its commands are not in the AMOS command index.
 */
export default class Amcaf {
  constructor(context) {
    this.context = context;
    this.expressions = context.expressions;
    this.turboDrawCounter = 0;
  }

  // BLITTER CLEAR
  enterBlitterClear(ctx) {
    // AmcafTranspiler has already validated the rectangular form and its four expressions.
    const x1 = this.expressions.translate(ctx.expression(0));
    const y1 = this.expressions.translate(ctx.expression(1));
    const x2 = this.expressions.translate(ctx.expression(2));
    const y2 = this.expressions.translate(ctx.expression(3));

    this.context.emit(`
// Blitter Clear - remove elements in the region
{
  const clearX1 = ${x1};
  const clearY1 = ${y1};
  const clearX2 = ${x2};
  const clearY2 = ${y2};
  const screen = document.getElementById('amos-screen');
  if (screen) {
    const children = Array.from(screen.children);
    children.forEach(child => {
      const left = parseInt(child.style.left) || 0;
      const top = parseInt(child.style.top) || 0;
      if (left >= clearX1 && left <= clearX2 && top >= clearY1 && top <= clearY2) {
        child.remove();
      }
    });
  }
}
`);
  }

  // QCOS
  translateQcosFunction(ctx) {
    const expressions = ctx.expression();
    const angle = this.expressions.translate(expressions[0]);
    const radius = this.expressions.translate(expressions[1]);
    return `Qcos(${angle}, ${radius})`;
  }

  // QSIN
  translateQsinFunction(ctx) {
    const expressions = ctx.expression();
    const angle = this.expressions.translate(expressions[0]);
    const radius = this.expressions.translate(expressions[1]);
    return `Qsin(${angle}, ${radius})`;
  }

  // TURBO DRAW
  enterTurboDraw(ctx) {
    const x1 = this.expressions.translate(ctx.expression(0));
    const y1 = this.expressions.translate(ctx.expression(1));
    const x2 = this.expressions.translate(ctx.expression(2));
    const y2 = this.expressions.translate(ctx.expression(3));
    const colorIndex = this.expressions.translate(ctx.expression(4));
    const index = this.expressions.translate(ctx.expression(5));

    // Each statement owns a line and reuses it when an animation runs it again.
    const id = `turboDraw_${this.turboDrawCounter++}`;
    this.context.emit(
      `turboDrawLine('${id}', ${x1}, ${y1}, ${x2}, ${y2}, ${colorIndex}, ${index});\n`,
    );
  }
}
