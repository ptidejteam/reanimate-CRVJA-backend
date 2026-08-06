export default class DataHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterOpen_out_readfile(ctx) {
    const channel = ctx.children[2]?.getText();
    const fileName = ctx.children[4]?.getText();

    this.translator.output += `openFile('${fileName}', ${channel}, 'r');`;
  }

  enterOpen_in_writefile(ctx) {
    const channel = ctx.children[2]?.getText();
    const fileName = ctx.children[4]?.getText();

    this.translator.output += `openFile('${fileName}', ${channel}, 'w');`;
  }

  enterInput_variable(ctx) {
    let channel = ctx.children[1]?.getText() || '';
    if (ctx.children[2]) channel += ctx.children[2].getText();

    let variable = ctx.children[4]?.getText() || '';
    if (ctx.children[5]) variable += ctx.children[5].getText();

    this.translator.output += `\nlet ${variable} = '';\nreadFromChannel(${channel}, (data) => {\n    ${variable} = data;\n});`;
  }

  enterClose_file(ctx) {
    const channel = ctx.children[1]?.getText();

    this.translator.output += `closeChannel(${channel});`;
  }

  enterPrint_something(ctx) {
    const printConfig = ctx.print_options(0)?.getText();
    if (printConfig.includes('#')) {
      /* WRITE TO FILE */
      let channel = ctx.print_options(0)?.getText();
      let content = ctx.print_options(1)?.getText();
      this.translator.output += `writeToChannel(${channel}, ${content});`;
      return;
    }
    for (let i = 0; i < ctx.print_options().length; i++) {
      let text = ctx.print_options(i)?.getText();

      if (!text.includes('"')) {
        text = ctx.print_options(i)?.expression(0)?.getText().replace(/["']/g, '');
        this.translator.output += `\n{\nconst printId = 'printDiv${i}_' + '${text}';\nlet printEl = document.getElementById(printId);\nif (!printEl) {\n    printEl = document.createElement('div');\n    printEl.id = printId;\n    printEl.style.position = 'relative';\n    printEl.style.left = '50%';\n    printEl.style.top = '50%';\n    printEl.style.fontSize = '14px';\n    printEl.style.zIndex = '999';\n    document.getElementById('amos-screen').appendChild(printEl);\n}\nprintEl.innerText = ${text};\nprintEl.style.color = getColour(Ink);\n}`;
      }
    }
  }

  enterArray_create(ctx) {
    for (let i = 0; i < ctx.array_structure().length; i++) {
      const struct = ctx.array_structure(i);
      const name = struct.IDENTIFIER(0)?.getText();

      const numberOfDimensions = struct.expression().length;
      let dimension = struct.expression()[0].getText();
      this.translator.output += `const ${name} = Array(${dimension}).fill(0)`;

      for (let i = 1; i < numberOfDimensions; i++) {
        let dimension = struct.expression()[i].getText();
        this.translator.output += `.map(x => Array(${dimension}).fill(0)`;
      }
      for (let i = 1; i < numberOfDimensions; i++) {
        this.translator.output += ')';
      }

      this.translator.output += ';';
    }
  }

  enterData_statement(ctx) {
    if (!this.translator.hasDataMatrix) {
      this.translator.hasDataMatrix = true;
      this.translator.output += 'const dataMatrix = [];';
    }

    // Data values are "contiguous" and should be read one after the other until no more
    const values = ctx.expression().map((e) => e.getText());
    const row = `${values.join(', ')}`;
    this.translator.output += `dataMatrix.push(${row});`;
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
          this.translator.output += child.getText();
          this.translator.output += ` = dataMatrix[dataMatrixPointer++];`;
        } else if (childName === 'Array_structureContext') {
          const name = child.IDENTIFIER(0).getText();
          this.translator.output += `${name}`;

          const numberOfDimensions = child.expression().length;
          for (let j = 0; j < numberOfDimensions; j++) {
            const indexValue = child.expression(j).getText();
            this.translator.output += `[${indexValue}]`;
          }

          // Reading dataMatrix should be independent of x and y
          this.translator.output += ' = dataMatrix[dataMatrixPointer++];';
        } else {
          console.warn(`enterRead_statement: unhandled child type "${childName}"`);
        }
      }
    }
  }

  enterArray_update(ctx) {
    // This is NOT a context, it's an Array_updateContext, which contains an array_structure
    const struct = ctx.array_structure();

    const name = struct.IDENTIFIER(0)?.getText();
    const firstIndex = struct.expression(0).getText();
    this.translator.output += ` ${name}[Math.trunc(${firstIndex})]`;
    const numberOfDimensions = struct.expression().length;
    for (let j = 1; j < numberOfDimensions; j++) {
      const indexValue = struct.expression(j).getText();
      this.translator.output += `[Math.trunc(${indexValue})]`;
    }

    const expression = ctx.expression();
    const arrayValue = expression.getText();
    this.translator.output += ` = ${arrayValue};`;
  }
}
