export default class DrawingHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterBlitter_fill(ctx) {}

  enterBlitter_clear(ctx) {
    // Blitter Clear clears a rectangular region on screen
    // Grammar: 'Blitter' 'Clear' NUMBER COMMA NUMBER (COMMA expression COMMA expression 'To' expression COMMA expression)?
    if (ctx.expression().length >= 4) {
      const x1 = ctx.expression(0)?.getText();
      const y1 = ctx.expression(1)?.getText();
      const x2 = ctx.expression(2)?.getText();
      const y2 = ctx.expression(3)?.getText();

      this.translator.output += `
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
`;
    }
  }

  enterLoadBank(ctx) {
    const fileName = ctx.children[1]?.getText();
    const bankId = ctx.children[3]?.getText();
    if (!bankId) {
      this.translator.output += `loadBank('${fileName}', 1);`;
    } else {
      this.translator.output += `loadBank('${fileName}', ${bankId});`;
    }
  }

  enterLoadBankImgToSprite(ctx) {
    const option = ctx.children[1]?.getText();
    if (option === 'Off') {
      this.translator.output += `
{
    const screen = document.getElementById('amos-screen');
    if (screen) {
        const sprites = screen.querySelectorAll('[id^="sprite"]');
        sprites.forEach(sprite => sprite.remove());
    }
}`;
      return;
    }
    const spriteNumber = option;
    const x = ctx.children[3]?.getText();
    const y = ctx.children[5]?.getText();
    const bankImgIndex = ctx.children[7]?.getText();
    this.translator.output += `renderSprite(${spriteNumber}, ${x}, ${y}, ${bankImgIndex});`;
  }

  enterTurbo_draw(ctx) {
    function generateRandomID() {
      let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let id = '';
      for (let i = 0; i < 9; i++) {
        let randomIndex = Math.floor(Math.random() * characters.length);
        id += characters[randomIndex];
      }
      return id;
    }

    let x1 = ctx.expression(0)?.getText();
    let y1 = ctx.expression(1)?.getText();
    let x2 = ctx.expression(2)?.getText();
    let y2 = ctx.expression(3)?.getText();
    let color = `colorMapping[(${ctx.expression(4)?.getText()})]`;
    let the_ID = generateRandomID();
    let index = ctx.expression(5)?.getText();

    // Calculate the length and angle of the line

    this.translator.output += `
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
    lineDiv${the_ID}.style.zIndex = 1000${index};
    lineDiv${the_ID}.indexPlacer = 1000${index};
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
    lineDiv${the_ID}.style.zIndex = 1000${index};
    lineDiv${the_ID}.indexPlacer = 1000${index};
    document.getElementById('amos-screen').appendChild(lineDiv${the_ID});
}`;
  }

  enterBar(ctx) {
    // AMOS command: Bar X1,Y1 To X2,Y2
    const x1 = ctx.expression(0).getText();
    const y1 = ctx.expression(1).getText();
    const x2 = ctx.expression(2).getText();
    const y2 = ctx.expression(3).getText();

    const idBar = `"Bar_" + (${x1}) + "_" + (${y1})`;

    this.translator.output += `
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
}`;
  }

  enterBox(ctx) {
    const x1 = ctx.expression(0).getText();
    const y1 = ctx.expression(1).getText();
    const x2 = ctx.expression(2).getText();
    const y2 = ctx.expression(3).getText();

    const boxID = `"Box_" + ${x1} + "_" + ${y1} + "_" + ${x2} + "_" + ${y2}`;

    this.translator.output += `
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
}`;
  }

  enterCircle(ctx) {
    const x = ctx.expression(0).getText();
    const y = ctx.expression(1).getText();
    const r = ctx.expression(2).getText();
    const circleID = `"Circle_" + (${x}) + "_" + (${y}) + "_" + (${r})`;

    this.translator.output += `
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
}`;
  }

  enterText(ctx) {
    const text = (ctx.STRING() || ctx.IDENTIFIER())?.getText();

    const x = ctx.expression(0)?.getText();
    const y = ctx.expression(1)?.getText();

    const isNumeric = (str) => /^\d+$/.test(str);
    const xValue = isNumeric(x) ? `'${x}px'` : `(${x}) + 'px'`;
    const yValue = isNumeric(y) ? `'${y}px'` : `(${y}) + 'px'`;

    const textId = `"textDiv_" + (${x}) + "_" + (${y})`;

    this.translator.output += `
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
}`;
  }
}
