import { amiga12BitToCssRgb } from '../../../utils/amiga-color.js';

export default class ScreenHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterScreen_open(ctx) {
    const width = ctx.children[3]?.getText();
    const height = ctx.children[5]?.getText();
    const color = ctx.children[7]?.getText();

    this.translator.output += `
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
document.getElementById('amos-screen').style.backgroundColor = 'black';`;
  }

  enterCls(ctx) {
    const exprs = ctx.expression();

    if (exprs.length === 0) {
      // Case 1: Parameterless Cls (clear entire screen + set background color to current paper color)
      this.translator.output += `
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[Paper];
}`;
    } else if (exprs.length === 1) {
      // Case 2: Cls colour (clear entire screen + set background color to specified color index)
      const color = exprs[0].getText();
      this.translator.output += `
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[${color}];
}`;
    } else if (exprs.length >= 5) {
      // Case 3: Cls colour, x1, y1 To x2, y2 (clear rectangular block + fill with color)
      const color = exprs[0].getText();
      const x1 = exprs[1].getText();
      const y1 = exprs[2].getText();
      const x2 = exprs[3].getText();
      const y2 = exprs[4].getText();

      this.translator.output += `
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
}`;
    }
  }

  enterCurs_off(ctx) {
    this.translator.output += "document.getElementById('amos-screen').style.cursor = 'none';";
  }

  enterCurs_on(ctx) {
    this.translator.output += "document.getElementById('amos-screen').style.cursor = 'auto';";
  }

  enterPaper(ctx) {
    const color = this.translator.handleExpression(ctx.children[1]);
    this.translator.output += `Paper = ${color};`;
  }

  enterInk(ctx) {
    const colorIndexExp = this.translator.handleExpression(ctx.children[1]);

    this.translator.output += `Ink = ${colorIndexExp};`;
  }

  enterPen(ctx) {
    const colorIndexExp = this.translator.handleExpression(ctx.children[1]);

    this.translator.output += `Ink = ${colorIndexExp};`;
  }

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
}
