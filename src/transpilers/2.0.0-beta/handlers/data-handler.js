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
    const firstOption = ctx.print_options(0);
    if (firstOption.HASHTAG()) {
      /* WRITE TO FILE */
      const channel = firstOption.NUMBER().getText();
      const content = this.translator.handleExpression(ctx.print_options(1)?.expression());
      this.translator.output += `writeToChannel(${channel}, ${content});`;
      return;
    }
    for (let i = 0; i < ctx.print_options().length; i++) {
      const expression = ctx.print_options(i)?.expression();

      if (expression) {
        const text = this.translator.handleExpression(expression);
        this.translator.output += `\n{\nconst printId = 'printDiv${i}_' + String(${text});\nlet printEl = document.getElementById(printId);\nif (!printEl) {\n    printEl = document.createElement('div');\n    printEl.id = printId;\n    printEl.style.position = 'relative';\n    printEl.style.left = '50%';\n    printEl.style.top = '50%';\n    printEl.style.fontSize = '14px';\n    printEl.style.zIndex = '999';\n    document.getElementById('amos-screen').appendChild(printEl);\n}\nprintEl.innerText = ${text};\nprintEl.style.color = getColour(Ink);\n}`;
      }
    }
  }

  enterArray_create(ctx) {
    for (let i = 0; i < ctx.array_structure().length; i++) {
      const struct = ctx.array_structure(i);
      const name = struct.IDENTIFIER(0)?.getText();

      const numberOfDimensions = struct.expression().length;
      let dimension = this.translator.handleExpression(struct.expression(0));
      this.translator.output += `const ${name} = Array(${dimension}).fill(0)`;

      for (let i = 1; i < numberOfDimensions; i++) {
        let dimension = this.translator.handleExpression(struct.expression(i));
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
    const values = ctx
      .expression()
      .map((expression) => this.translator.handleExpression(expression));
    const row = `${values.join(', ')}`;
    this.translator.output += `dataMatrix.push(${row});`;
  }

  enterRead_statement(ctx) {
    for (const target of ctx.read_target()) {
      const arrayTarget = target.array_structure();
      const targetCode = arrayTarget
        ? this.translator.handleExpression(arrayTarget)
        : target.IDENTIFIER().getText();

      // TODO: AMOS should report an error if dataMatrixPointer > dataMatrix.length
      this.translator.output += `${targetCode} = dataMatrix[dataMatrixPointer++];`;
    }
  }

  enterArray_update(ctx) {
    // This is NOT a context, it's an Array_updateContext, which contains an array_structure
    const struct = ctx.array_structure();

    const arrayTarget = this.translator.handleExpression(struct);
    const arrayValue = this.translator.handleExpression(ctx.expression());
    this.translator.output += ` ${arrayTarget} = ${arrayValue};`;
  }
}
