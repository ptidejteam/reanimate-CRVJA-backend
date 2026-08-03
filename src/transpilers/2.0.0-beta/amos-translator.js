import AMOSListener from './grammar/generated/AMOSListener.js';
import setupAmosTranslatorBase from './amos-base-setup.js';

class AmosTranslator extends AMOSListener {
  constructor() {
    super();

    setupAmosTranslatorBase(this);
  }

  // Scope management
  enterNewScope() {
    this.scopes.push({});
  }

  exitCurrentScope() {
    this.scopes.pop();
  }

  get currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  get isRootScope() {
    return this.scopes.length === 1;
  }

  isVariableDeclared(name) {
    const isLocal = this.currentScope[name] !== undefined;
    const isGlobal = this.globalVariablesSet.has(name);

    return isLocal || isGlobal;
  }

  enterScreen_open(ctx) {
    const width = ctx.children[3]?.getText();
    const height = ctx.children[5]?.getText();
    const color = ctx.children[7]?.getText();

    this.output += `
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

  enterBlitter_fill(ctx) { }

  enterBlitter_clear(ctx) {
    // Blitter Clear clears a rectangular region on screen
    // Grammar: 'Blitter' 'Clear' NUMBER COMMA NUMBER (COMMA expression1 COMMA expression1 'To' expression1 COMMA expression1)?
    if (ctx.expression1().length >= 4) {
      const x1 = ctx.expression1(0)?.getText();
      const y1 = ctx.expression1(1)?.getText();
      const x2 = ctx.expression1(2)?.getText();
      const y2 = ctx.expression1(3)?.getText();

      this.output += `
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
      this.output += `loadBank('${fileName}', 1);`;
    } else {
      this.output += `loadBank('${fileName}', ${bankId});`;
    }
  }

  enterLoadBankImgToSprite(ctx) {
    const option = ctx.children[1]?.getText();
    if (option === 'Off') {
      this.output += `
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
    this.output += `renderSprite(${spriteNumber}, ${x}, ${y}, ${bankImgIndex});`;
  }

  enterOpen_out_readfile(ctx) {
    const channel = ctx.children[2]?.getText();
    const fileName = ctx.children[4]?.getText();

    this.output += `openFile('${fileName}', ${channel}, 'w');`;
  }

  enterOpen_in_writefile(ctx) {
    const channel = ctx.children[2]?.getText();
    const fileName = ctx.children[4]?.getText();

    this.output += `openFile('${fileName}', ${channel}, 'r');`;
  }

  enterInput_variable(ctx) {
    let channel = ctx.children[1]?.getText() || '';
    if (ctx.children[2]) channel += ctx.children[2].getText();

    let variable = ctx.children[4]?.getText() || '';
    if (ctx.children[5]) variable += ctx.children[5].getText();

    this.output += `
let ${variable} = '';
readFromChannel(${channel}, (data) => {
    ${variable} = data;
});`;
  }

  enterClose_file(ctx) {
    const channel = ctx.children[1]?.getText();

    this.output += `closeChannel(${channel});`;
  }

  enterPrint_something(ctx) {
    const printConfig = ctx.print_options(0)?.getText();
    if (printConfig.includes('#')) {
      /* WRITE TO FILE */
      let channel = ctx.print_options(0)?.getText();
      let content = ctx.print_options(1)?.getText();
      this.output += `writeToChannel(${channel}, ${content});`;
      return;
    }
    for (let i = 0; i < ctx.print_options().length; i++) {
      let text = ctx.print_options(i)?.getText();

      if (!text.includes('"')) {
        text = ctx.print_options(i)?.expression1(0)?.getText().replace(/["']/g, '');
        this.output += `
const finder_printDiv${i} = document.getElementById('printDiv${i}' + '${text}');
if (finder_printDiv${i}) { finder_printDiv${i}.remove(); }
const printDiv${i} = document.createElement('div');
printDiv${i}.innerText = ${text};
printDiv${i}.style.position = 'relative';
printDiv${i}.style.left = '50%';
printDiv${i}.style.top = '50%';
printDiv${i}.style.fontSize = '14px';
printDiv${i}.style.color = getColour(Ink);
printDiv${i}.style.zIndex = '999';
printDiv${i}.id = 'printDiv${i}' + '${text}';
document.getElementById('amos-screen').appendChild(printDiv${i});`;
      } else {
        this.output += `
const finder_printDiv${i} = document.getElementById('printDiv${i}' + '${text}');
if (finder_printDiv${i}) { finder_printDiv${i}.remove(); }
const printDiv${i} = document.createElement('div');
printDiv${i}.innerText = ${text};
printDiv${i}.style.position = 'relative';
printDiv${i}.style.left = '50%';
printDiv${i}.style.top = '50%';
printDiv${i}.style.fontSize = '14px';
printDiv${i}.style.color = getColour(Ink);
printDiv${i}.style.zIndex = '999';
printDiv${i}.id = 'printDiv${i}' + '${text}';
document.getElementById('amos-screen').appendChild(printDiv${i});`;
      }
    }
  }

  enterCls(ctx) {
    const exprs = ctx.expression1();

    if (exprs.length === 0) {
      // Case 1: Parameterless Cls (clear entire screen + set background color to current paper color)
      this.output += `
const amosScreen = document.getElementById('amos-screen');
if (amosScreen) {
    amosScreen.innerHTML = '';
    amosScreen.style.backgroundColor = colorMapping[Paper];
}`;
    } else if (exprs.length === 1) {
      // Case 2: Cls colour (clear entire screen + set background color to specified color index)
      const color = exprs[0].getText();
      this.output += `
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

      this.output += `
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
    this.output += "document.getElementById('amos-screen').style.cursor = 'none';";
  }

  enterPaper(ctx) {
    const color = this.handleExpression(ctx.children[1]);
    this.output += `Paper = ${color};`;
  }

  enterCurs_on(ctx) {
    this.output += "document.getElementById('amos-screen').style.cursor = 'auto';";
  }

  enterPlay_sound(ctx) {
    const soundIndex = ctx.children[1]?.getText();
    const duration = ctx.children[3]?.getText();

    this.output += `soundPlayer(${soundIndex}, ${duration} * 1000);`;
  }

  enterInk(ctx) {
    const colorIndexExp = this.handleExpression(ctx.children[1]);

    this.output += `Ink = ${colorIndexExp};`;
  }

  enterPen(ctx) {
    const colorIndexExp = this.handleExpression(ctx.children[1]);

    this.output += `Ink = ${colorIndexExp};`;
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
    this.colorMapping = {};
    hexColors.forEach((hex, index) => {
      const hexValue = parseInt(hex.slice(1), 16); // Remove '$' and parse as hex

      // Extract R, G, B components
      const red = ((hexValue >> 8) & 0xf) * 17;
      const green = ((hexValue >> 4) & 0xf) * 17;
      const blue = (hexValue & 0xf) * 17;

      // Map color in `rgb` format
      this.colorMapping[index] = `rgb(${red}, ${green}, ${blue})`;
    });
    this.palette = `const colorMapping = ${JSON.stringify(this.colorMapping, null, 2)};`;
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

    let x1 = ctx.expression1(0)?.getText();
    let y1 = ctx.expression1(1)?.getText();
    let x2 = ctx.expression1(2)?.getText();
    let y2 = ctx.expression1(3)?.getText();
    let color = `colorMapping[(${ctx.expression1(4)?.getText()})]`;
    let the_ID = generateRandomID();
    let index = ctx.expression1(5)?.getText();

    // Calculate the length and angle of the line

    this.output += `
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
    const x1 = ctx.expression1(0).getText();
    const y1 = ctx.expression2(0).getText();
    const x2 = ctx.expression1(1).getText();
    const y2 = ctx.expression2(1).getText();

    // Gere um ID seguro e único baseado nas coordenadas
    const idBar = `"Bar_" + (${x1}) + "_" + (${y1})`;

    this.output += `
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
screenBarDiv.style.zIndex = 10;`;
  }

  enterBox(ctx) {
    const x1 = ctx.expression1(0).getText();
    const y1 = ctx.expression1(1).getText();
    const x2 = ctx.expression1(2).getText();
    const y2 = ctx.expression1(3).getText();

    const boxID = `"Box_" + ${x1} + "_" + ${y1} + "_" + ${x2} + "_" + ${y2}`;

    this.output += `
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
boxDiv.style.zIndex = 10;`;
  }

  enterCircle(ctx) {
    const x = ctx.expression1(0).getText();
    const y = ctx.expression1(1).getText();
    const r = ctx.expression1(2).getText();
    const circleID = `"Circle_" + (${x}) + "_" + (${y}) + "_" + (${r})`;

    this.output += `
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
circleDiv.style.backgroundColor = getColour(Ink);`;
  }

  enterWhile_wend(ctx) {
    let leftExpression = ctx.current_Key_State(0)?.expression1(0)?.getText();
    if (!leftExpression) return;

    // Replace all occurrences of $xx with decimal equivalents
    leftExpression = leftExpression.replace(/\$[0-9A-Fa-f]+/g, (match) => {
      return parseInt(match.substring(1), 16);
    });

    // Cf. https://www.cknow.com/cms/articles/what-is-a-scan-code.html
    this.output += `\nif (currentPressedKey === keyMapping[${leftExpression}]) {`;
  }

  enterWait_key(ctx) {
    const waitTime = ctx.NUMBER().getText();
    const ms = parseInt(waitTime) * 20; // 20ms por tick
    this.output += `await new Promise(resolve => setTimeout(resolve, ${ms}));\n`;
  }

  exitWhile_wend(ctx) {
    this.output += '}';
  }

  enterGlobal(ctx) {
    for (let i = 0; i < ctx.IDENTIFIER().length; i++) {
      this.globalVariablesSet.add(ctx.IDENTIFIER(i).getText());
    }
    for (let i = 0; i < ctx.array_structure().length; i++) {
      this.globalVariablesSet.add(ctx.array_structure(i).IDENTIFIER(0).getText());
    }
  }

  enterVariable_starter(ctx) {
    let name = ctx.children[0].getText();
    let value = this.handleExpression(ctx.children[2]);

    let lineNumber = ctx.start.line;
    if (name !== 'Timer') {
      if (value > 2147483647) {
        throw new Error(
          `ERROR: Amos code line ${lineNumber}: Value for variable "${name}" exceeds the allowed limit of 2,147,483,647.`,
        );
      }

      if (this.isVariableDeclared(name)) {
        // Variable already exists at this level
        this.output += `${name} = ${value};`;
      } else {
        // Variable doesn't exist at this level, so create it
        let defaultValue = name.endsWith('$') ? '""' : 0;
        if (this.isRootScope) {
          this.globalVariables += `let ${name} = ${defaultValue};\n`;
          this.output += `${name} = ${value};`;
        } else {
          this.output += `let ${name} = ${defaultValue};${name} = ${value};`;
        }

        // Store the variable in the current scope
        this.currentScope[name] = defaultValue;
      }
    }
  }

  enterAdd(ctx) {
    let variable = ctx.children[1]?.getText();
    let valueExpression = ctx.children[3]?.getText();

    if (!this.isVariableDeclared(variable)) {
      let defaultValue = variable.endsWith('$') ? '""' : 0;
      if (this.isRootScope) {
        this.globalVariables += `let ${variable} = ${defaultValue};`;
      } else {
        this.output += `let ${variable} = ${defaultValue};`;
      }
      this.currentScope[variable] = defaultValue;
    }

    let valueStarter;
    let valueEndIteration;

    if (ctx.expression1().length > 1) {
      valueStarter = ctx.expression1(1)?.getText();
      valueEndIteration = ctx.expression1(2)?.getText();

      this.output += `
${variable} = (${variable} + ${valueExpression}) % ${valueEndIteration};
if (${variable} < ${valueStarter}) {
    ${variable} += ${valueEndIteration};
}`;
    } else {
      this.output += `${variable} = ${variable} + ${valueExpression};`;
    }
  }

  enterProcedure(ctx) {
    this.id++;
    let name = ctx.children[1]?.getText();

    let params = [];
    // Collect all IDENTIFIER tokens after the procedure name (which is index 0 in the parser context)
    for (let i = 1; i < ctx.IDENTIFIER().length; i++) {
      params.push(ctx.IDENTIFIER(i).getText());
    }
    let props = params.join(', ');

    this.enterNewScope();
    let localDeclarations = '';
    for (let varName of Object.keys(this.scopes[0])) {
      if (!this.globalVariablesSet.has(varName) && !params.includes(varName)) {
        let defaultValue = varName.endsWith('$') ? '""' : 0;
        localDeclarations += `\n  let ${varName} = ${defaultValue};`;
        this.currentScope[varName] = defaultValue;
      }
    }

    this.functionDeclarationSupport += `let lastTime${name} = 0; let timeoutId${name} = null;`;

    this.output += `2
function ${name}(${props}) {
    const currentTime = Date.now();
    const timeSinceLastCall = currentTime - lastTime${name};
    if (timeSinceLastCall < 16) {
        if (timeoutId${name}) {
            clearTimeout(timeoutId${name});
        }
        timeoutId${name} = setTimeout(() => { ${name}(${props}); }, 100 - timeSinceLastCall);
        return;
    }
    lastTime${name} = currentTime;
    timeoutId${name} = null; // Clear the timeout ID after execution
${localDeclarations}`;
  }

  exitProcedure(ctx) {
    this.exitCurrentScope();
    this.output += '}';
  }

  enterText(ctx) {
    const text = (ctx.STRING() || ctx.IDENTIFIER())?.getText();
    const cleanText = text.replace(/ /g, ' '); // Replace all occurrences of <Space> with <Em Dash>

    const x = ctx.expression1(0)?.getText();
    const cleanX = x.replace(/[^a-zA-Z0-9]/g, '');
    const y = ctx.expression1(1)?.getText();
    const cleanY = y.replace(/[^a-zA-Z0-9]/g, '');
    const varName = `textDiv${cleanX}${cleanY}`;

    const isNumeric = (str) => /^\d+$/.test(str);
    const xValue = isNumeric(x) ? `'${x}px'` : `(${x}) + 'px'`;
    const yValue = isNumeric(y) ? `'${y}px'` : `(${y}) + 'px'`;

    if (this.output.includes(varName)) {
      // Changing the value of a text
      this.output += `${varName}.innerText = ${cleanText};`;
    } else {
      this.output += `
const ${varName} = document.createElement('div');
${varName}.innerText = ${cleanText};
${varName}.id = 'textDiv${x}${y}';
${varName}.style.position = 'absolute';
${varName}.style.left = ${xValue};
${varName}.style.top = ${yValue};
${varName}.style.fontSize = '14px';
${varName}.style.color = getColour(Ink);
${varName}.style.backgroundColor = getColour(Paper);
${varName}.style.zIndex = 99;
document.getElementById('amos-screen').appendChild(${varName});`;
    }
  }

  enterWait_key(ctx) {
    const waitTicks = ctx.NUMBER().getText();
    const ms = parseInt(waitTicks) * 20; // AMOS = ~50fps

    this.output += `await new Promise(r => setTimeout(r, ${ms}));`;
  }

  enterDo_loop(ctx) {
    this.output += 'while(true) {';
  }

  enterRepeat_key(ctx) {
    this.output += 'setInterval(() => { currentTimer = Date.now(); Timer++;';
  }

  exitRepeat_key(ctx) {
    this.output += 'Timer = 9; }, 16);';
  }

  exitDo_loop(ctx) {
    this.output += 'await new Promise(r => setTimeout(r, 16));}';
  }

  enterFor_loop(ctx) {
    let variable = ctx.children[1]?.getText();
    let start = ctx.children[3]?.getText();
    let end = ctx.children[5]?.getText();

    if (!this.isVariableDeclared(variable)) {
      let defaultValue = variable.endsWith('$') ? '""' : 0;
      if (this.isRootScope) {
        this.globalVariables += `let ${variable} = ${defaultValue};\n`;
      } else {
        this.output += `let ${variable} = ${defaultValue};\n`;
      }
      this.currentScope[variable] = defaultValue;
    }

    this.output += `for (${variable} = ${start}; ${variable} <= ${end}; ${variable}++) {`;
  }

  enterIf_then(ctx) {
    let expressions1 = [];
    let expressions2 = [];
    let comparators = [];
    let or_and = [];

    for (let i = 0; i < ctx.expression1().length; i++) {
      expressions1.push(ctx.expression1(i).getText());
    }
    for (let i = 0; i < ctx.expression2().length; i++) {
      expressions2.push(ctx.expression2(i).getText());
    }
    for (let i = 0; i < ctx.expressions_comparators().length; i++) {
      comparators.push(ctx.expressions_comparators(i).getText());
    }
    for (let i = 0; i < ctx.or_and().length; i++) {
      or_and.push(ctx.or_and(i).getText());
    }

    let finalIfStatement = '';

    for (let i = 0; i < expressions1.length; i++) {
      finalIfStatement += expressions1[i] + ' ' + comparators[i] + ' ' + expressions2[i];
      if (or_and[i] && or_and[i] === 'AND') {
        finalIfStatement += ' && ';
      }
      if (or_and[i] && or_and[i] === 'OR') {
        finalIfStatement += ' || ';
      }
    }
  }

  enterArray_create(ctx) {
    for (let i = 0; i < ctx.array_structure().length; i++) {
      const struct = ctx.array_structure(i);
      const name = struct.IDENTIFIER(0)?.getText();

      const numberOfDimensions = struct.expression1().length;
      let dimension = struct.expression1()[0].getText();
      this.output += `const ${name} = Array(${dimension}).fill(0)`;

      for (let i = 1; i < numberOfDimensions; i++) {
        let dimension = struct.expression1()[i].getText();
        this.output += `.map(x => Array(${dimension}).fill(0)`;
      }
      for (let i = 1; i < numberOfDimensions; i++) {
        this.output += ')';
      }

      this.output += ';';
    }
  }

  exitFor_loop(ctx) {
    this.output += '}';
  }

  enterData_statement(ctx) {
    if (!this.hasDataMatrix) {
      this.hasDataMatrix = true;
      this.output += 'const dataMatrix = [];';
    }

    // Data values are "contiguous" and should be read one after the other until no more
    const values = ctx.expression1().map((e) => e.getText());
    const row = `${values.join(', ')}`;
    this.output += `dataMatrix.push(${row});`;
  }

  enterRead_statement(ctx) {
    const targets = ctx.children.filter(
      (child) => child.getText() !== 'Read' && child.getText() !== ',',
    );

    for (let i = 0; i < targets.length; i++) {
      const children = targets[i].children;

      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        const childName = child.constructor.name;

        // TODO: AMOS should report an error if dataMatrixPointer > dataMatrix.length
        if (childName === 'Me' || childName === 'Fe') {
          this.output += child.getText();
          this.output += ` = dataMatrix[dataMatrixPointer++];`;
        } else if (childName === 'Array_structureContext') {
          const name = child.IDENTIFIER(0).getText();
          this.output += `${name}`;

          const numberOfDimensions = child.expression1().length;
          for (let j = 0; j < numberOfDimensions; j++) {
            const indexValue = child.expression1(j).getText();
            this.output += `[${indexValue}]`;
          }

          // Reading dataMatrix should be independent of x and y
          this.output += ' = dataMatrix[dataMatrixPointer++];';
        } else {
          console.log("WWW, I don't know what to do with " + childName);
          accumulator.push(child.getText());
        }
      }
    }
  }

  enterArray_update(ctx) {
    // This is NOT a context, it's an Array_updateContext, which contains an array_structure
    const struct = ctx.array_structure();

    const name = struct.IDENTIFIER(0)?.getText();
    const firstIndex = struct.expression1(0).getText();
    this.output += ` ${name}[Math.trunc(${firstIndex})]`;
    const numberOfDimensions = struct.expression1().length;
    for (let j = 1; j < numberOfDimensions; j++) {
      const indexValue = struct.expression1(j).getText();
      this.output += `[Math.trunc(${indexValue})]`;
    }

    const expression1 = ctx.expression1();
    const arrayValue = expression1.getText();
    this.output += ` = ${arrayValue};`;
  }

  /*
      NUMBER
      | STRING
      | array_structure
      | sin_function
      | cos_function
      | qsin_function
      | qcos_function
      | rndFunction
      | IDENTIFIER
      | '(' expression1 ')'
      | HEX_NUMBER
      */
  handleFactor(accumulator, factorContext) {
    const children = factorContext.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childName = child.constructor.name;

      if (childName === 'Me' || childName === 'Fe') {
        this.handleSymbol(accumulator, child);
      } else if (childName === 'Array_structureContext') {
        this.handleArrayAccess(accumulator, child);
      } else if (childName === 'Expression1Context') {
        this.handleExpr(accumulator, child);
      } else if (typeof factorContext.expression1() === 'function') {
        accumulator.push('(');
        this.handleExpression(accumulator, factorContext.expression());
        accumulator.push(')');
      } else {
        console.log("XXX, I don't know what to do with " + childName);
        // console.log(child.getText());
        accumulator.push(child.getText());
      }
    }
  }

  handleArrayAccess(accumulator, arrayStructure) {
    const name = arrayStructure.IDENTIFIER(0)?.getText();

    const firstIndex = arrayStructure.expression1(0).getText();
    accumulator.push(`${name}[Math.trunc(${firstIndex})]`);

    const numberOfDimensions = arrayStructure.expression1().length;
    for (let j = 1; j < numberOfDimensions; j++) {
      const indexValue = arrayStructure.expression1(j).getText();
      accumulator.push(`[Math.trunc(${indexValue})]`);
    }
  }

  handleSymbol(accumulator, symbol) {
    accumulator.push(symbol.getText());
  }

  handleTerm(accumulator, termContext) {
    const children = termContext.children;
    if (termContext.children != null) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childName = child.constructor.name;
        if (childName === 'Me' || childName === 'Fe') {
          this.handleSymbol(accumulator, child);
        } else if (childName === 'FactorContext') {
          this.handleFactor(accumulator, child);
        } else {
          console.log("ZZZ, I don't know what to do with " + childName);
          //   accumulator.push("ZZZ");
        }
      }
    }
  }

  handleExpr(accumulator, expressionContext) {
    this.handleTerm(accumulator, expressionContext.term(0));
    if (expressionContext.term(1)) {
      this.handleSymbol(accumulator, expressionContext.children[1]);
      this.handleTerm(accumulator, expressionContext.term(1));
    }
  }

  handleExpression(expressionContext) {
    let accumulator = [];
    this.handleTerm(accumulator, expressionContext.term(0));
    if (expressionContext.term(1)) {
      this.handleSymbol(accumulator, expressionContext.children[1]);
      this.handleTerm(accumulator, expressionContext.term(1));
    }
    return accumulator.join('');
  }

  enterIf_statement(ctx) {
    let statement = '';
    let logicalOperator = '';
    let comparator = '';

    for (let i = 0; i < ctx.children.length; i++) {
      if (ctx.children[i].constructor.name == 'Expression1Context') {
        statement += this.handleExpression(ctx.children[i]);
      } else if (ctx.children[i].constructor.name == 'Or_andContext') {
        logicalOperator = ctx.children[i].getText();
        if (logicalOperator == 'and') {
          statement += ' && ';
        } else if (logicalOperator == 'or') {
          statement += ' || ';
        } else {
          console.log('Unrecognized logicalOperator in IF Statement');
        }
      } else if (ctx.children[i].constructor.name == 'Expression2Context') {
        statement += this.handleExpression(ctx.children[i]);
      } else if (ctx.children[i].constructor.name == 'Expressions_comparatorsContext') {
        comparator = ctx.children[i].getText();
        // Special cases for = and <>
        if (comparator === '=') {
          comparator = '==';
        } else if (comparator === '<>') {
          comparator = '!=';
        } else {
          // Nothing to do here
        }
        statement += ` ${comparator} `;
      }
    }
    this.output += `if (${statement}) {`;
  }

  exitIf_statement(ctx) {
    this.output += '}';
  }

  enterProcedure_call(ctx) {
    const name = ctx.IDENTIFIER().getText();
    let callCode = '';

    if (!ctx.SQUARE_BRACKET_OPEN()) {
      // Case 1: Calling a procedure with just its name
      callCode = `${name}();`;
    } else {
      // Case 2: Calling a procedure with some parameters
      const args = ctx
        .expression1()
        .map((expr) => expr.getText())
        .join(', ');
      callCode = `${name}(${args});`;
    }

    this.output += `${callCode}`;
  }

  enterIf_statement_key_state(ctx) {
    let leftExpression = ctx.current_Key_State(0)?.expression1(0)?.getText();

    if (leftExpression.includes('$')) {
      // Extract the hexadecimal value from the expression
      let hexValueMatch = leftExpression.match(/\$[0-9A-Fa-f]+/);

      if (hexValueMatch) {
        let hexValue = parseInt(hexValueMatch[0].replace('$', ''), 16);

        // Check if the leftExpression is just a hexadecimal value
        if (hexValueMatch[0] === leftExpression) {
          // If it's only a hex value, convert it to a key mapping lookup
          leftExpression = `keyMapping[${hexValue}`;
        } else {
          let variable = leftExpression.split('$')[0];

          // If it's a variable or expression with a hex part, construct it accordingly
          leftExpression = leftExpression.replace(/\$[0-9A-Fa-f]+/, `keyMapping[${hexValue}`);
        }
      }
    }
    this.output += `if (currentPressedKey === ${leftExpression}]) {`;
  }

  exitIf_statement_key_state(ctx) {
    this.output += '}';
  }

  enterElse_statement(ctx) {
    this.output += '} else {';
  }

  exitElse_statement(ctx) {
    this.output += '';
  }

  getJavaScript() {
    let result =
      '// Using Version 2.0.0 of the AMOS to JavaScript Transpiler\n' +
      this.imports +
      this.palette +
      this.globalVariables +
      this.functionDeclarationSupport +
      this.preamble +
      this.output;

    // console.log(result);
    return result;
  }
}

export default AmosTranslator;
