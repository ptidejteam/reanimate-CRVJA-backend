export default class ControlFlowHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterWhileWend(ctx) {
    let leftExpression = this.translator.handleExpression(ctx.keyStateFunction(0)?.expression(0));
    if (!leftExpression) return;

    // Replace all occurrences of $xx with decimal equivalents
    leftExpression = leftExpression.replace(/\$[0-9A-Fa-f]+/g, (match) => {
      return parseInt(match.substring(1), 16);
    });

    // Cf. https://www.cknow.com/cms/articles/what-is-a-scan-code.html
    this.translator.output += `\nif (currentPressedKey === keyMapping[${leftExpression}]) {`;
  }

  exitWhileWend(ctx) {
    this.translator.output += '}';
  }

  enterWait(ctx) {
    const waitTicks = ctx.NUMBER().getText();
    const ms = parseInt(waitTicks) * 20; // AMOS = ~50fps

    this.translator.output += `await new Promise(r => setTimeout(r, ${ms}));`;
  }

  enterDoLoop(ctx) {
    this.translator.output += 'while(true) {';
  }

  exitDoLoop(ctx) {
    this.translator.output += 'await new Promise(r => setTimeout(r, 16));}';
  }

  enterRepeatUntil(ctx) {
    this.translator.output += 'setInterval(() => { currentTimer = Date.now(); Timer++;';
  }

  exitRepeatUntil(ctx) {
    this.translator.output += 'Timer = 9; }, 16);';
  }

  enterForLoop(ctx) {
    let variable = ctx.IDENTIFIER(0).getText();
    let start = this.translator.handleExpression(ctx.expression(0));
    let end = this.translator.handleExpression(ctx.expression(1));

    if (!this.translator.isVariableDeclared(variable)) {
      let defaultValue = variable.endsWith('$') ? '""' : 0;
      if (this.translator.isRootScope) {
        this.translator.globalVariables += `let ${variable} = ${defaultValue};\n`;
      } else {
        this.translator.output += `let ${variable} = ${defaultValue};\n`;
      }
      this.translator.currentScope[variable] = defaultValue;
    }

    this.translator.output += `for (${variable} = ${start}; ${variable} <= ${end}; ${variable}++) {`;
  }

  exitForLoop(ctx) {
    this.translator.output += '}';
  }

  enterIfStatement(ctx) {
    let statement = '';
    let logicalOperator = '';
    let comparator = '';

    for (let i = 0; i < ctx.children.length; i++) {
      if (ctx.children[i].constructor.name == 'ExpressionContext') {
        statement += this.translator.handleExpression(ctx.children[i]);
      } else if (ctx.children[i].constructor.name == 'LogicalOperatorContext') {
        logicalOperator = ctx.children[i].getText();
        if (logicalOperator == 'and') {
          statement += ' && ';
        } else if (logicalOperator == 'or') {
          statement += ' || ';
        } else {
          console.log('Unrecognized logicalOperator in IF Statement');
        }
      } else if (ctx.children[i].constructor.name == 'ComparisonOperatorContext') {
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
    this.translator.output += `if (${statement}) {`;
  }

  exitIfStatement(ctx) {
    this.translator.output += '}';
  }

  // TODO: verify open/close brackets
  enterIfKeyStateStatement(ctx) {
    let leftExpression = this.translator.handleExpression(ctx.keyStateFunction(0)?.expression(0));

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
    this.translator.output += `if (currentPressedKey === ${leftExpression}]) {`;
  }

  exitIfKeyStateStatement(ctx) {
    this.translator.output += '}';
  }

  enterElseStatement(ctx) {
    this.translator.output += '} else {';
  }

  exitElseStatement(ctx) {
    this.translator.output += '';
  }
}
