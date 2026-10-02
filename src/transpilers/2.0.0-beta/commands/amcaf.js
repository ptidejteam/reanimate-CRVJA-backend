import BaseHandler from './base-handler.js';

/**
 * Commands of the AMCAF extension, sorted A-Z by AMOS name. AMCAF is an AMOS
 * Professional extension, so its commands are not in the AMOS command index.
 *
 * Instructions (enterX) are called by the forwarders in amos-translator.js;
 * functions (visitX) by the forwarders in expression-visitor.js.
 */
export default class Amcaf extends BaseHandler {
  // ---- BLITTER CLEAR ----
  enterBlitterClear(ctx) {
    // Blitter Clear clears a rectangular region on screen
    // Grammar: 'Blitter' 'Clear' NUMBER COMMA NUMBER (COMMA expression COMMA expression TO expression COMMA expression)?
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

  // ---- BLITTER FILL ----
  enterBlitterFill(ctx) {}

  // ---- QCOS ----
  /**
   * Grammar Rule:
   * qcosFunction: 'Qcos' '(' expression ',' expression ')'
   */
  visitQcosFunction(ctx) {
    const expressions = ctx.expression();
    const arg1 = this.expr(expressions[0]);
    const arg2 = this.expr(expressions[1]);
    return `Math.cos(${arg1}, ${arg2})`;
  }

  // ---- QSIN ----
  /**
   * Grammar Rule:
   * qsinFunction: 'Qsin' '(' expression ',' expression ')'
   */
  visitQsinFunction(ctx) {
    const expressions = ctx.expression();
    const arg1 = this.expr(expressions[0]);
    const arg2 = this.expr(expressions[1]);
    return `Math.sin(${arg1}, ${arg2})`;
  }

  // ---- TURBO DRAW ----
  enterTurboDraw(ctx) {
    function generateRandomID() {
      let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let id = '';
      for (let i = 0; i < 9; i++) {
        let randomIndex = Math.floor(Math.random() * characters.length);
        id += characters[randomIndex];
      }
      return id;
    }

    let x1 = this.expr(ctx.expression(0));
    let y1 = this.expr(ctx.expression(1));
    let x2 = this.expr(ctx.expression(2));
    let y2 = this.expr(ctx.expression(3));
    let color = `colorMapping[(${this.expr(ctx.expression(4))})]`;
    let the_ID = generateRandomID();
    let index = this.expr(ctx.expression(5));

    // Calculate the length and angle of the line

    this.emit(`
// Calculate the length and angle of the line
const TurboDrawX1${the_ID} = ${x1};
const TurboDrawX2${the_ID} = ${x2};
const TurboDrawY1${the_ID} = ${y1};
const TurboDrawY2${the_ID} = ${y2};
const idBar${the_ID} = 'TurboDraw${the_ID}';

let lineDiv${the_ID} = document.getElementById(idBar${the_ID});

const deltaX${the_ID} = TurboDrawX2${the_ID} - TurboDrawX1${the_ID};
const deltaY${the_ID} = TurboDrawY2${the_ID} - TurboDrawY1${the_ID};
const length${the_ID} = Math.sqrt(deltaX${the_ID} * deltaX${the_ID} + deltaY${the_ID} * deltaY${the_ID}); // Pythagorean theorem
const angle${the_ID}  = Math.atan2(deltaY${the_ID}, deltaX${the_ID}) * (180 / Math.PI); // Convert angle to degrees

if (lineDiv${the_ID}) {
    // If the div exists, update its properties
    lineDiv${the_ID}.style.backgroundColor = ${color};
    lineDiv${the_ID}.style.left = TurboDrawX1${the_ID} + 'px';
    lineDiv${the_ID}.style.top = TurboDrawY1${the_ID} + 'px';
    lineDiv${the_ID}.style.width = length${the_ID} + 'px';
    lineDiv${the_ID}.style.height = '2px'; // Line height
    lineDiv${the_ID}.style.transform = 'rotate(' + angle${the_ID} + 'deg)';
    lineDiv${the_ID}.style.transformOrigin = '0 0'; // Rotate from the starting point
    lineDiv${the_ID}.style.position = 'absolute';
    lineDiv${the_ID}.style.borderRadius = '1px';
    lineDiv${the_ID}.style.borderColor = ${color};
    lineDiv${the_ID}.style.zIndex = 1000 + (${index});
    lineDiv${the_ID}.indexPlacer = 1000 + (${index});
} else {
    // If the div doesn't exist, create it
    lineDiv${the_ID} = document.createElement('div');
    lineDiv${the_ID}.style.position = 'absolute';
    lineDiv${the_ID}.id = idBar${the_ID};
    lineDiv${the_ID}.style.backgroundColor = ${color};
    lineDiv${the_ID}.style.left = TurboDrawX1${the_ID} + 'px';
    lineDiv${the_ID}.style.top = TurboDrawY1${the_ID} + 'px';
    lineDiv${the_ID}.style.width = length${the_ID} + 'px';
    lineDiv${the_ID}.style.height = '2px'; // Line height
    lineDiv${the_ID}.style.transform = 'rotate(' + angle${the_ID} + 'deg)';
    lineDiv${the_ID}.style.transformOrigin = '0 0'; // Rotate from the starting point
    lineDiv${the_ID}.style.borderRadius = '1px';
    lineDiv${the_ID}.style.borderColor = ${color};
    lineDiv${the_ID}.style.zIndex = 1000 + (${index});
    lineDiv${the_ID}.indexPlacer = 1000 + (${index});
    document.getElementById('amos-screen').appendChild(lineDiv${the_ID});
}`);
  }
}
