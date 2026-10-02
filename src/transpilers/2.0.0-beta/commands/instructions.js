import { amiga12BitToCssRgb } from '../../../utils/amiga-color.js';
import BaseHandler from './base-handler.js';

/**
 * AMOS commands of the category "Instruction", sorted A-Z by AMOS name.
 *
 * The category comes from the tracking spreadsheet, which follows the AMOS
 * Professional command index: https://amospromanual.dev/99-appendix-g-command-index.html
 * Each method is called by the forwarder with the same name in amos-translator.js.
 */
export default class Instructions extends BaseHandler {
  // ---- ADD: https://amospromanual.dev/05-03-maths.html#i-add ----
  enterAdd(ctx) {
    let variable = ctx.IDENTIFIER().getText();
    let valueExpression = this.expr(ctx.expression(0));

    this.declareVariable(variable);

    let valueStarter;
    let valueEndIteration;

    if (ctx.expression().length > 1) {
      valueStarter = this.expr(ctx.expression(1));
      valueEndIteration = this.expr(ctx.expression(2));

      this.emit(`
${variable} = (${variable} + ${valueExpression}) % ${valueEndIteration};
if (${variable} < ${valueStarter}) {
    ${variable} += ${valueEndIteration};
}`);
    } else {
      this.emit(`${variable} = ${variable} + ${valueExpression};`);
    }
  }

  // ---- BAR: https://amospromanual.dev/06-04-graphics.html#i-bar ----
  enterBar(ctx) {
    // AMOS command: Bar X1,Y1 To X2,Y2
    const x1 = this.expr(ctx.expression(0));
    const y1 = this.expr(ctx.expression(1));
    const x2 = this.expr(ctx.expression(2));
    const y2 = this.expr(ctx.expression(3));

    const idBar = `"Bar_" + (${x1}) + "_" + (${y1})`;

    this.emit(`
{
const idBar = ${idBar};
const x1 = ${x1};
const y1 = ${y1};
const x2 = ${x2};
const y2 = ${y2};
const width = x2 - x1;
const height = y2 - y1;

let screenBarDiv = document.getElementById(idBar);
if (!screenBarDiv) {
    screenBarDiv = document.createElement('div');
    screenBarDiv.id = idBar;
    screenBarDiv.style.position = 'absolute';
    screenBarDiv.style.boxSizing = 'border-box';
    document.getElementById('amos-screen').appendChild(screenBarDiv);
}

screenBarDiv.style.backgroundColor = getColour(Ink);
screenBarDiv.style.left = x1 + 'px';
screenBarDiv.style.top = y1 + 'px';
screenBarDiv.style.width = width + 'px';
screenBarDiv.style.height = height + 'px';
screenBarDiv.style.zIndex = 10;
}`);
  }

  // ---- BOX: https://amospromanual.dev/06-04-graphics.html#i-box ----
  enterBox(ctx) {
    const x1 = this.expr(ctx.expression(0));
    const y1 = this.expr(ctx.expression(1));
    const x2 = this.expr(ctx.expression(2));
    const y2 = this.expr(ctx.expression(3));

    const boxID = `"Box_" + ${x1} + "_" + ${y1} + "_" + ${x2} + "_" + ${y2}`;

    this.emit(`
{
const idBox = ${boxID};
let boxDiv = document.getElementById(idBox);
if (!boxDiv) {
    boxDiv = document.createElement('div');
    boxDiv.id = idBox;
    boxDiv.style.position = 'absolute';
    boxDiv.style.boxSizing = 'border-box';
    document.getElementById('amos-screen').appendChild(boxDiv);
}
boxDiv.style.border = '2px solid ' + getColour(Ink);
boxDiv.style.left = (${x1}) + 'px';
boxDiv.style.top = (${y1}) + 'px';
boxDiv.style.width = (${x2} - ${x1}) + 'px';
boxDiv.style.height = (${y2} - ${y1}) + 'px';
boxDiv.style.zIndex = 10;
}`);
  }

  // ---- CIRCLE: https://amospromanual.dev/06-04-graphics.html#i-circle ----
  enterCircle(ctx) {
    const x = this.expr(ctx.expression(0));
    const y = this.expr(ctx.expression(1));
    const r = this.expr(ctx.expression(2));
    const circleID = `"Circle_" + (${x}) + "_" + (${y}) + "_" + (${r})`;

    this.emit(`
{
const circleId = ${circleID};
let circleDiv = document.getElementById(circleId);
if (!circleDiv) {
    circleDiv = document.createElement('div');
    circleDiv.id = circleId;
    circleDiv.style.position = 'absolute';
    circleDiv.style.boxSizing = 'border-box';
    document.getElementById('amos-screen').appendChild(circleDiv);
}
circleDiv.style.borderRadius = '50%';
circleDiv.style.border = '2px solid ' + getColour(Ink);
circleDiv.style.left = (${x} - ${r}) + 'px';
circleDiv.style.top = (${y} - ${r}) + 'px';
circleDiv.style.width = (${r} * 2) + 'px';
circleDiv.style.height = (${r} * 2) + 'px';
circleDiv.style.zIndex = 10;
circleDiv.style.backgroundColor = getColour(Ink);
}`);
  }

  // ---- CLOSE: https://amospromanual.dev/10-02-disc-access.html#i-close ----
  enterCloseFile(ctx) {
    const channel = ctx.children[1]?.getText();

    this.emit(`closeChannel(${channel});`);
  }

  // ---- CLS: https://amospromanual.dev/06-01-setting-up-screens.html#i-cls ----
  enterCls(ctx) {
    const exprs = ctx.expression();

    if (exprs.length === 0) {
      // Case 1: Parameterless Cls (clear entire screen + set background color to current paper color)
      this.emit(`
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[Paper];
}`);
    } else if (exprs.length === 1) {
      // Case 2: Cls colour (clear entire screen + set background color to specified color index)
      const color = this.expr(exprs[0]);
      this.emit(`
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[${color}];
}`);
    } else if (exprs.length >= 5) {
      // Case 3: Cls colour, x1, y1 To x2, y2 (clear rectangular block + fill with color)
      const color = this.expr(exprs[0]);
      const x1 = this.expr(exprs[1]);
      const y1 = this.expr(exprs[2]);
      const x2 = this.expr(exprs[3]);
      const y2 = this.expr(exprs[4]);

      this.emit(`
{
    const clearColor = colorMapping[${color}];
    const clearX1 = ${x1};
    const clearY1 = ${y1};
    const clearX2 = ${x2};
    const clearY2 = ${y2};
    const screen = document.getElementById('amos-screen');
    if (screen) {
        // 1. Remove child elements that fall inside the bounding box coordinates
        const children = Array.from(screen.children);
        children.forEach(child => {
            const left = parseInt(child.style.left) || 0;
            const top = parseInt(child.style.top) || 0;
            if (left >= clearX1 && left <= clearX2 && top >= clearY1 && top <= clearY2) { child.remove(); }
        });
        // 2. Add a filled background div to cover the cleared area
        const fillDiv = document.createElement('div');
        fillDiv.style.position = 'absolute';
        fillDiv.style.left = clearX1 + 'px';
        fillDiv.style.top = clearY1 + 'px';
        fillDiv.style.width = (clearX2 - clearX1) + 'px';
        fillDiv.style.height = (clearY2 - clearY1) + 'px';
        fillDiv.style.backgroundColor = clearColor;
        fillDiv.style.zIndex = 1;
        screen.appendChild(fillDiv);
    }
}`);
    }
  }

  // ---- CURS OFF: https://amospromanual.dev/05-06-text.html#i-curs-on-off ----
  enterCursOff(ctx) {
    this.emit("document.getElementById('amos-screen').style.cursor = 'none';");
  }

  // ---- CURS ON: https://amospromanual.dev/05-06-text.html#i-curs-on-off ----
  enterCursOn(ctx) {
    this.emit("document.getElementById('amos-screen').style.cursor = 'auto';");
  }

  // ---- DIM: https://amospromanual.dev/05-01-the-bare-bones.html#i-dim ----
  enterArrayDeclaration(ctx) {
    for (let i = 0; i < ctx.arrayStructure().length; i++) {
      const struct = ctx.arrayStructure(i);
      const name = struct.IDENTIFIER(0)?.getText();

      const numberOfDimensions = struct.expression().length;
      let dimension = this.expr(struct.expression(0));
      this.emit(`const ${name} = Array(${dimension}).fill(0)`);

      for (let i = 1; i < numberOfDimensions; i++) {
        let dimension = this.expr(struct.expression(i));
        this.emit(`.map(x => Array(${dimension}).fill(0)`);
      }
      for (let i = 1; i < numberOfDimensions; i++) {
        this.emit(')');
      }

      this.emit(';');
    }
  }

  // ---- INK: https://amospromanual.dev/06-04-graphics.html#i-ink ----
  enterInk(ctx) {
    const colorIndexExp = this.expr(ctx.children[1]);

    this.emit(`Ink = ${colorIndexExp};`);
  }

  // ---- LOAD: https://amospromanual.dev/05-09-memory-banks.html#i-load ----
  enterLoadBank(ctx) {
    const fileName = ctx.children[1]?.getText();
    const bankId = ctx.children[3]?.getText();
    if (!bankId) {
      this.emit(`loadBank('${fileName}', 1);`);
    } else {
      this.emit(`loadBank('${fileName}', ${bankId});`);
    }
  }

  // ---- OPEN IN: https://amospromanual.dev/10-02-disc-access.html#i-open-in ----
  enterOpenIn(ctx) {
    const channel = ctx.children[2]?.getText();
    const fileName = ctx.children[4]?.getText();

    this.emit(`openFile('${fileName}', ${channel}, 'w');`);
  }

  // ---- OPEN OUT: https://amospromanual.dev/10-02-disc-access.html#i-open-out ----
  enterOpenOut(ctx) {
    const channel = ctx.children[2]?.getText();
    const fileName = ctx.children[4]?.getText();

    this.emit(`openFile('${fileName}', ${channel}, 'r');`);
  }

  // ---- PALETTE: https://amospromanual.dev/06-04-graphics.html#i-palette ----
  enterPalette(ctx) {
    // Array to collect complete hex colour values from the Palette
    const hexColors = [];
    let currentHex = '';

    // Loop through each child in `ctx` to gather colors
    for (const child of ctx.children) {
      const text = child.getText().trim();

      if (text.toLowerCase() === 'palette') continue;
      if (text === '$') {
        // Start of a new hex color, initialize currentHex
        currentHex = '$';
      } else if (text === ',') {
        // End of a hex color, parse it if currentHex has a complete hex value
        if (currentHex.length > 1) {
          hexColors.push(currentHex);
          currentHex = ''; // Reset for the next hex color
        }
      } else {
        // Append hex digits to currentHex
        currentHex += text;
      }
    }

    // Handle the last hex color if there's no trailing comma
    if (currentHex.length > 1) {
      hexColors.push(currentHex);
    }

    // Convert and map hex colors
    this.translator.colorMapping = {};
    hexColors.forEach((hex, index) => {
      const hexValue = parseInt(hex.slice(1), 16); // Remove '$' and parse as hex

      this.translator.colorMapping[index] = amiga12BitToCssRgb(hexValue);
    });
    this.translator.palette = `const colorMapping = ${JSON.stringify(this.translator.colorMapping, null, 2)};`;
  }

  // ---- PAPER: https://amospromanual.dev/05-06-text.html#i-paper ----
  enterPaper(ctx) {
    const color = this.expr(ctx.children[1]);
    this.emit(`Paper = ${color};`);
  }

  // ---- PEN: https://amospromanual.dev/05-06-text.html#i-pen ----
  enterPen(ctx) {
    const colorIndexExp = this.expr(ctx.children[1]);

    this.emit(`Ink = ${colorIndexExp};`);
  }

  // ---- PLAY: https://amospromanual.dev/08-01-music.html#i-play ----
  enterPlaySound(ctx) {
    const soundIndex = ctx.expression() ? this.expr(ctx.expression()) : ctx.children[1]?.getText();
    const duration = ctx.children[3]?.getText();

    this.emit(`soundPlayer(${soundIndex}, ${duration} * 1000);`);
  }

  // ---- PRINT (and PRINT #): https://amospromanual.dev/05-06-text.html#i-print ----
  // PRINT # (https://amospromanual.dev/10-02-disc-access.html#str-print-pound) is a Structure, but it
  // shares the printStatement grammar rule with PRINT, so it is translated here.
  enterPrintStatement(ctx) {
    const firstOption = ctx.printItem(0);
    if (firstOption.HASH()) {
      /* WRITE TO FILE */
      const channel = firstOption.NUMBER().getText();
      const content = this.expr(ctx.printItem(1)?.expression());
      this.emit(`writeToChannel(${channel}, ${content});`);
      return;
    }
    for (let i = 0; i < ctx.printItem().length; i++) {
      const expression = ctx.printItem(i)?.expression();

      if (expression) {
        const text = this.expr(expression);
        this.emit(
          `\n{\nconst printId = 'printDiv${i}_' + String(${text});\nlet printEl = document.getElementById(printId);\nif (!printEl) {\n    printEl = document.createElement('div');\n    printEl.id = printId;\n    printEl.style.position = 'relative';\n    printEl.style.left = '50%';\n    printEl.style.top = '50%';\n    printEl.style.fontSize = '14px';\n    printEl.style.zIndex = '999';\n    document.getElementById('amos-screen').appendChild(printEl);\n}\nprintEl.innerText = ${text};\nprintEl.style.color = getColour(Ink);\n}`,
        );
      }
    }
  }

  // ---- SCREEN OPEN: https://amospromanual.dev/06-01-setting-up-screens.html#i-screen-open ----
  enterScreenOpen(ctx) {
    const width = ctx.children[3]?.getText();
    const height = ctx.children[5]?.getText();
    const color = ctx.children[7]?.getText();

    this.emit(`
const screenDiv = document.createElement('div');
screenDiv.style.width = '${width}px';
screenDiv.style.height = '${height}px';
screenDiv.style.border = '1px solid black';
screenDiv.style.overflow = 'hidden'; 
screenDiv.style.padding = '0'; 
screenDiv.style.position = 'relative'; 
screenDiv.id = 'amos-screen'; 
screenDiv.style.zIndex = 1;
document.getElementById('game-container').appendChild(screenDiv);
document.getElementById('amos-screen').style.backgroundColor = 'black';`);
  }

  // ---- SPRITE: https://amospromanual.dev/07-01-hardware-sprites.html#i-sprite ----
  enterSprite(ctx) {
    const spriteExpression = ctx.expression();
    if (!spriteExpression) {
      this.emit(`
{
    const screen = document.getElementById('amos-screen');
    if (screen) {
        const sprites = screen.querySelectorAll('[id^="sprite"]');
        sprites.forEach(sprite => sprite.remove());
    }
}`);
      return;
    }

    const spriteNumber = this.expr(spriteExpression);
    const x = ctx.children[3]?.getText();
    const y = ctx.children[5]?.getText();
    const bankImgIndex = ctx.children[7]?.getText();
    this.emit(`renderSprite(${spriteNumber}, ${x}, ${y}, ${bankImgIndex});`);
  }

  // ---- TEXT: https://amospromanual.dev/11-01-fonts.html#i-text ----
  enterText(ctx) {
    const text = (ctx.STRING() || ctx.IDENTIFIER())?.getText();

    const x = this.expr(ctx.expression(0));
    const y = this.expr(ctx.expression(1));

    const isNumeric = (str) => /^\d+$/.test(str);
    const xValue = isNumeric(x) ? `'${x}px'` : `(${x}) + 'px'`;
    const yValue = isNumeric(y) ? `'${y}px'` : `(${y}) + 'px'`;

    const textId = `"textDiv_" + (${x}) + "_" + (${y})`;

    this.emit(`
{
const textId = ${textId};
let textEl = document.getElementById(textId);
if (!textEl) {
    textEl = document.createElement('div');
    textEl.id = textId;
    textEl.style.position = 'absolute';
    textEl.style.left = ${xValue};
    textEl.style.top = ${yValue};
    textEl.style.fontSize = '14px';
    textEl.style.zIndex = 99;
    document.getElementById('amos-screen').appendChild(textEl);
}
textEl.innerText = ${text};
textEl.style.color = getColour(Ink);
textEl.style.backgroundColor = getColour(Paper);
}`);
  }

  // ---- WAIT: https://amospromanual.dev/07-06-amal.html#i-wait-amal ----
  enterWait(ctx) {
    const waitTicks = ctx.NUMBER().getText();
    const ms = parseInt(waitTicks) * 20; // AMOS = ~50fps

    this.emit(`await new Promise(r => setTimeout(r, ${ms}));`);
  }
}
