import BaseHandler from './base-handler.js';

/**
 * Commands of the AMCAF extension, sorted A-Z by AMOS name. AMCAF is an AMOS
 * Professional extension, so its commands are not in the AMOS command index.
 */
export default class Amcaf extends BaseHandler {
  constructor(translator) {
    super(translator);
    this.turboDrawCounter = 0;
  }

  // BLITTER CLEAR
  enterBlitterClear(ctx) {
    // Blitter Clear clears a rectangular region on screen
    if (ctx.expression().length >= 4) {
      const x1 = this.expr(ctx.expression(0));
      const y1 = this.expr(ctx.expression(1));
      const x2 = this.expr(ctx.expression(2));
      const y2 = this.expr(ctx.expression(3));

      this.emit(`
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
  }

  // BLITTER FILL
  enterBlitterFill(ctx) {}

  // QCOS
  visitQcosFunction(ctx) {
    const expressions = ctx.expression();
    const angle = this.expr(expressions[0]);
    const radius = this.expr(expressions[1]);
    return `Qcos(${angle}, ${radius})`;
  }

  // QSIN
  visitQsinFunction(ctx) {
    const expressions = ctx.expression();
    const angle = this.expr(expressions[0]);
    const radius = this.expr(expressions[1]);
    return `Qsin(${angle}, ${radius})`;
  }

  // TURBO DRAW
  enterTurboDraw(ctx) {
    const x1 = this.expr(ctx.expression(0));
    const y1 = this.expr(ctx.expression(1));
    const x2 = this.expr(ctx.expression(2));
    const y2 = this.expr(ctx.expression(3));
    const colorIndex = this.expr(ctx.expression(4));
    const index = this.expr(ctx.expression(5));

    // Each statement owns a line and reuses it when an animation runs it again.
    const id = `turboDraw_${this.turboDrawCounter++}`;
    this.emit(`turboDrawLine('${id}', ${x1}, ${y1}, ${x2}, ${y2}, ${colorIndex}, ${index});\n`);
  }
}
