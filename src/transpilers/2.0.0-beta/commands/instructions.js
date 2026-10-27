import { amiga12BitToCssRgb } from '../../../utils/amiga-color.js';

/** AMOS commands of the category "Instruction", sorted A-Z by AMOS name. */
export default class Instructions {
  constructor(context) {
    this.context = context;
    this.expressions = context.expressions;
  }

  // ADD
  enterAdd(ctx) {
    let variable = ctx.IDENTIFIER().getText();
    let valueExpression = this.expressions.translate(ctx.expression(0));

    this.context.declareVariable(variable);

    let valueStarter;
    let valueEndIteration;

    if (ctx.expression().length > 1) {
      valueStarter = this.expressions.translate(ctx.expression(1));
      valueEndIteration = this.expressions.translate(ctx.expression(2));

      this.context.emit(`
${variable} = (${variable} + ${valueExpression}) % ${valueEndIteration};
if (${variable} < ${valueStarter}) {
    ${variable} += ${valueEndIteration};
}`);
    } else {
      this.context.emit(`${variable} = ${variable} + ${valueExpression};`);
    }
  }

  // BAR
  enterBar(ctx) {
    const x1 = this.expressions.translate(ctx.expression(0));
    const y1 = this.expressions.translate(ctx.expression(1));
    const x2 = this.expressions.translate(ctx.expression(2));
    const y2 = this.expressions.translate(ctx.expression(3));

    const idBar = `"Bar_" + (${x1}) + "_" + (${y1})`;

    this.context.emit(`
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

  // BOX
  enterBox(ctx) {
    const x1 = this.expressions.translate(ctx.expression(0));
    const y1 = this.expressions.translate(ctx.expression(1));
    const x2 = this.expressions.translate(ctx.expression(2));
    const y2 = this.expressions.translate(ctx.expression(3));

    const boxID = `"Box_" + ${x1} + "_" + ${y1} + "_" + ${x2} + "_" + ${y2}`;

    this.context.emit(`
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

  // CIRCLE
  enterCircle(ctx) {
    const x = this.expressions.translate(ctx.expression(0));
    const y = this.expressions.translate(ctx.expression(1));
    const r = this.expressions.translate(ctx.expression(2));
    const circleID = `"Circle_" + (${x}) + "_" + (${y}) + "_" + (${r})`;

    this.context.emit(`
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

  // CLOSE
  enterCloseFile(ctx) {
    const channel = ctx.children[1]?.getText();

    this.context.emit(`closeChannel(${channel});`);
  }

  // CLS
  enterCls(ctx) {
    const exprs = ctx.expression();

    if (exprs.length === 0) {
      // Cls: clear the screen with the Paper colour
      this.context.emit(`
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[Paper];
}`);
    } else if (exprs.length === 1) {
      // Cls colour: clear the screen with that colour
      const color = this.expressions.translate(exprs[0]);
      this.context.emit(`
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[${color}];
}`);
    } else if (exprs.length >= 5) {
      // Cls colour, x1, y1 To x2, y2: clear that rectangle and fill it with the colour
      const color = this.expressions.translate(exprs[0]);
      const x1 = this.expressions.translate(exprs[1]);
      const y1 = this.expressions.translate(exprs[2]);
      const x2 = this.expressions.translate(exprs[3]);
      const y2 = this.expressions.translate(exprs[4]);

      this.context.emit(`
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

  // COLOUR
  enterColour(ctx) {
    const index = this.expressions.translate(ctx.expression(0));
    const value = this.expressions.translate(ctx.expression(1));
    this.context.emit(`colorMapping[${index}] = amiga12BitToCssRgb(${value});`);
  }

  // COLOUR BACK
  enterColourBack(ctx) {
    console.log('To be implemented...');
  }

  // CURS OFF
  enterCursOff(ctx) {
    this.context.emit("document.getElementById('amos-screen').style.cursor = 'none';");
  }

  // CURS ON
  enterCursOn(ctx) {
    this.context.emit("document.getElementById('amos-screen').style.cursor = 'auto';");
  }

  // DEC
  enterDec(ctx) {
    const variable = ctx.IDENTIFIER().getText();
    const expression = `${variable} = ${variable} - 1`;
    this.context.emit(expression);
    //console.log('To be implemented...');
  }

  // DEGREE
  enterDegree(ctx) {
    console.log('to be implemented');
  }

  // DIM
  enterArrayDeclaration(ctx) {
    for (let i = 0; i < ctx.arrayStructure().length; i++) {
      const struct = ctx.arrayStructure(i);
      const name = struct.IDENTIFIER(0)?.getText();

      const fill = name.endsWith('$') ? '""' : '0';
      const sizes = struct.expression().map((e) => this.expressions.translate(e));

      const init = sizes.reduceRight(
        (inner, size) => `Array.from({ length: (${size}) + 1 }, () => ${inner})`,
        fill,
      );

      this.context.emit(`const ${name} = ${init};`);

      /*const numberOfDimensions = struct.expression().length;
      let dimension = this.expressions.translate(struct.expression(0));
      this.context.emit(`const ${name} = Array(${dimension}).fill(0)`);

      for (let i = 1; i < numberOfDimensions; i++) {
        let dimension = this.expressions.translate(struct.expression(i));
        this.context.emit(`.map(x => Array(${dimension}).fill(0)`);
      }
      for (let i = 1; i < numberOfDimensions; i++) {
        this.context.emit(')');
      }

      this.context.emit(';');*/
    }
  }

  // DRAW
  enterDraw(ctx) {
    const x1 = this.expressions.translate(ctx.expression(0));
    const y1 = this.expressions.translate(ctx.expression(1));
    const x2 = this.expressions.translate(ctx.expression(2));
    const y2 = this.expressions.translate(ctx.expression(3));

    this.context.emit(`
{
const drawX1 = ${x1};
const drawY1 = ${y1};
const drawX2 = ${x2};
const drawY2 = ${y2};
const lineDiv = document.createElement('div');
lineDiv.style.position = 'absolute';
lineDiv.style.left = drawX1 + 'px';
lineDiv.style.top = drawY1 + 'px';
lineDiv.style.width = Math.hypot(drawX2 - drawX1, drawY2 - drawY1) + 1 + 'px';
lineDiv.style.height = '1px';
lineDiv.style.backgroundColor = getColour(Ink);
lineDiv.style.transformOrigin = '0 0';
lineDiv.style.transform = 'rotate(' + Math.atan2(drawY2 - drawY1, drawX2 - drawX1) + 'rad)';
document.getElementById('amos-screen').appendChild(lineDiv);
graphicCursorX = drawX2;
graphicCursorY = drawY2;
}`);
  }

  // DRAW TO
  enterDrawTo(ctx) {
    const x = this.expressions.translate(ctx.expression(0));
    const y = this.expressions.translate(ctx.expression(1));

    this.context.emit(`
{
const drawX1 = graphicCursorX;
const drawY1 = graphicCursorY;
const drawX2 = ${x};
const drawY2 = ${y};
const lineDiv = document.createElement('div');
lineDiv.style.position = 'absolute';
lineDiv.style.left = drawX1 + 'px';
lineDiv.style.top = drawY1 + 'px';
lineDiv.style.width = Math.hypot(drawX2 - drawX1, drawY2 - drawY1) + 1 + 'px';
lineDiv.style.height = '1px';
lineDiv.style.backgroundColor = getColour(Ink);
lineDiv.style.transformOrigin = '0 0';
lineDiv.style.transform = 'rotate(' + Math.atan2(drawY2 - drawY1, drawX2 - drawX1) + 'rad)';
document.getElementById('amos-screen').appendChild(lineDiv);
graphicCursorX = drawX2;
graphicCursorY = drawY2;
}`);
  }

  // ELLIPSE
  enterEllipse(ctx) {
    const x = ctx.centerX ? this.expressions.translate(ctx.centerX) : 'null';
    const y = ctx.centerY ? this.expressions.translate(ctx.centerY) : 'null';
    const radiusX = this.expressions.translate(ctx.radiusX);
    const radiusY = this.expressions.translate(ctx.radiusY);

    this.context.emit(`drawEllipse(${x}, ${y}, ${radiusX}, ${radiusY});`);
  }

  // INC
  enterInc(ctx) {
    const variable = ctx.IDENTIFIER().getText();
    const expression = `${variable} = ${variable} + 1`;
    this.context.emit(expression);
    //console.log('To be implemented...');
  }

  // INK
  enterInk(ctx) {
    const colorIndexExp = this.expressions.translate(ctx.children[1]);

    this.context.emit(`Ink = ${colorIndexExp};`);
  }

  // LOAD
  enterLoadBank(ctx) {
    const fileName = ctx.children[1]?.getText();
    const bankId = ctx.children[3]?.getText();
    if (!bankId) {
      this.context.emit(`loadBank('${fileName}', 1);`);
    } else {
      this.context.emit(`loadBank('${fileName}', ${bankId});`);
    }
  }

  // OPEN IN
  enterOpenIn(ctx) {
    const channel = ctx.NUMBER().getText();
    const fileName = ctx.IDENTIFIER().getText();

    this.context.emit(`openFile('${fileName}', ${channel}, 'w');`);
  }

  // OPEN OUT
  enterOpenOut(ctx) {
    const channel = ctx.NUMBER().getText();
    const fileName = ctx.IDENTIFIER().getText();

    this.context.emit(`openFile('${fileName}', ${channel}, 'r');`);
  }

  // PALETTE
  enterPalette(ctx) {
    // Collect the hex colours ($RGB) of the Palette, separated by commas
    const hexColors = [];
    let currentHex = '';

    for (const child of ctx.children) {
      const text = child.getText().trim();

      if (text.toLowerCase() === 'palette') continue;
      if (text === '$') {
        currentHex = '$';
      } else if (text === ',') {
        if (currentHex.length > 1) {
          hexColors.push(currentHex);
          currentHex = '';
        }
      } else {
        currentHex += text;
      }
    }

    // The last colour has no trailing comma
    if (currentHex.length > 1) {
      hexColors.push(currentHex);
    }

    this.context.colorMapping = {};
    hexColors.forEach((hex, index) => {
      const hexValue = parseInt(hex.slice(1), 16); // without the '$'

      this.context.colorMapping[index] = amiga12BitToCssRgb(hexValue);
    });
    this.context.palette = `const colorMapping = ${JSON.stringify(this.context.colorMapping, null, 2)};`;
  }

  // PAPER
  enterPaper(ctx) {
    const color = this.expressions.translate(ctx.children[1]);
    this.context.emit(`Paper = ${color};`);
  }

  // PEN
  enterPen(ctx) {
    const colorIndexExp = this.expressions.translate(ctx.children[1]);

    this.context.emit(`Ink = ${colorIndexExp};`);
  }

  // PLAY
  enterPlaySound(ctx) {
    const soundIndex = this.expressions.translate(ctx.expression());
    const duration = ctx.NUMBER().getText();

    this.context.emit(`soundPlayer(${soundIndex}, ${duration} * 1000);`);
  }

  // PLOT
  enterPlot(ctx) {
    const x = this.expressions.translate(ctx.expression(0));
    const y = this.expressions.translate(ctx.expression(1));

    this.context.emit(`
{
const plotDiv = document.createElement('div');
plotDiv.style.position = 'absolute';
plotDiv.style.left = (${x}) + 'px';
plotDiv.style.top = (${y}) + 'px';
plotDiv.style.width = '1px';
plotDiv.style.height = '1px';
plotDiv.style.backgroundColor = getColour(Ink);
document.getElementById('amos-screen').appendChild(plotDiv);
}`);
  }

  // POLYGON
  enterPolygon(ctx) {
    console.log('to be implemented');
  }

  // POLYLINE
  enterPolyline(ctx) {
    console.log('to be implemented');
  }

  // PRINT (and PRINT #)
  // PRINT # is a Structure, but it shares the printStatement rule with PRINT,
  // so it is translated here.
  enterPrintStatement(ctx) {
    const firstOption = ctx.printItem(0);
    if (firstOption.HASH()) {
      // PRINT #: write to a file
      const channel = firstOption.NUMBER().getText();
      const content = this.expressions.translate(ctx.printItem(1)?.expression());
      this.context.emit(`writeToChannel(${channel}, ${content});`);
      return;
    }
    for (let i = 0; i < ctx.printItem().length; i++) {
      const expression = ctx.printItem(i)?.expression();

      if (expression) {
        const text = this.expressions.translate(expression);
        this.context.emit(
          `\n{\nlet printId='printDiv${i}_'+String(${text});\nlet printEl=document.getElementById(printId);\nwhile(printEl)printEl=document.getElementById(printId=printId+'_');\nprintEl=document.createElement('div');\nprintEl.id=printId;\nprintEl.style.position='relative';\nprintEl.style.left=printEl.style.top='50%';\nprintEl.style.fontSize='14px';\nprintEl.style.zIndex='999';\ndocument.getElementById('amos-screen').appendChild(printEl);\nprintEl.innerText=${text};\nprintEl.style.color=getColour(Ink);\n}`,
        );
      }
    }
  }

  // RADIAN
  enterRadian(ctx) {
    console.log('to be implemented');
  }

  // RANDOMIZE
  enterRandomize(ctx) {
    const seed = this.expressions.translate(ctx.expression());
    this.context.emit(`Randomize(${seed});`);
  }

  // SCREEN OPEN
  enterScreenOpen(ctx) {
    const width = ctx.children[3]?.getText();
    const height = ctx.children[5]?.getText();
    const color = ctx.children[7]?.getText();

    this.context.emit(`
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

  // SORT a(0) / a#(0) / a$(0)
  enterSort(ctx) {
    const struct = ctx.arrayStructure();
    const name = struct.IDENTIFIER(0)?.getText();
    const indexes = struct.expression();

    if (indexes.length !== 1) {
      throw new Error(`Line ${ctx.start.line}: SORT only supports one-dimensional arrays`);
    }

    // AMOS requires the first element: index 0
    if (Number(indexes[0].getText()) !== 0) {
      throw new Error(`Line ${ctx.start.line}: SORT must start at index 0, e.g., Sort ${name}(0)`);
    }

    const comparator = name.endsWith('$')
      ? '(a, b) => (a < b ? -1: a > b ? 1 : 0)'
      : '(a, b) => a - b';

    this.context.emit(`${name}.sort(${comparator});`);
  }

  // SPRITE
  enterSprite(ctx) {
    const spriteExpression = ctx.expression();
    if (!spriteExpression) {
      this.context.emit(`
{
    const screen = document.getElementById('amos-screen');
    if (screen) {
        const sprites = screen.querySelectorAll('[id^="sprite"]');
        sprites.forEach(sprite => sprite.remove());
    }
}`);
      return;
    }

    const spriteNumber = this.expressions.translate(spriteExpression);
    const x = ctx.children[3]?.getText();
    const y = ctx.children[5]?.getText();
    const bankImgIndex = ctx.children[7]?.getText();
    this.context.emit(`renderSprite(${spriteNumber}, ${x}, ${y}, ${bankImgIndex});`);
  }

  // TEXT
  enterText(ctx) {
    const text = (ctx.STRING() || ctx.IDENTIFIER())?.getText();

    const x = this.expressions.translate(ctx.expression(0));
    const y = this.expressions.translate(ctx.expression(1));

    const isNumeric = (str) => /^\d+$/.test(str);
    const xValue = isNumeric(x) ? `'${x}px'` : `(${x}) + 'px'`;
    const yValue = isNumeric(y) ? `'${y}px'` : `(${y}) + 'px'`;

    const textId = `"textDiv_" + (${x}) + "_" + (${y})`;

    this.context.emit(`
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

  // WAIT
  enterWait(ctx) {
    const waitTicks = ctx.NUMBER().getText();
    const ms = parseInt(waitTicks) * 20; // AMOS = ~50fps

    this.context.emit(`await new Promise(r => setTimeout(r, ${ms}));`);
  }

  // WAIT KEY
  enterWaitKey() {
    this.context.emit(`
await new Promise((resolve) => {
  document.addEventListener('keydown', resolve, { once: true });
});
`);
  }
}
