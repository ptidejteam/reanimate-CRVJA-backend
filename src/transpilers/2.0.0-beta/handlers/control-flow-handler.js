export default class ControlFlowHandler {
  constructor(translator) {
    this.translator = translator;
  }

  enterWhile_wend(ctx) {
    let leftExpression = ctx.current_Key_State(0)?.expression(0)?.getText();
    if (!leftExpression) return;

    // Replace all occurrences of $xx with decimal equivalents
    leftExpression = leftExpression.replace(/\$[0-9A-Fa-f]+/g, (match) => {
      return parseInt(match.substring(1), 16);
    });

    // Cf. https://www.cknow.com/cms/articles/what-is-a-scan-code.html
    this.translator.output += `\nif (currentPressedKey === keyMapping[${leftExpression}]) {`;
  }

  exitWhile_wend(ctx) {
    this.translator.output += '}';
  }

  enterWait_key(ctx) {
    const waitTicks = ctx.NUMBER().getText();
    const ms = parseInt(waitTicks) * 20; // AMOS = ~50fps

    this.translator.output += `await new Promise(r => setTimeout(r, ${ms}));`;
  }

  enterDo_loop(ctx) {
    this.translator.output += 'while(true) {';
  }

  exitDo_loop(ctx) {
    this.translator.output += 'await new Promise(r => setTimeout(r, 16));}';
  }

  enterRepeat_key(ctx) {
    this.translator.output += 'setInterval(() => { currentTimer = Date.now(); Timer++;';
  }

  exitRepeat_key(ctx) {
    this.translator.output += 'Timer = 9; }, 16);';
  }

  enterFor_loop(ctx) {
    let variable = ctx.children[1]?.getText();
    let start = ctx.children[3]?.getText();
    let end = ctx.children[5]?.getText();

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

  exitFor_loop(ctx) {
    this.translator.output += '}';
  }

  enterIf_statement(ctx) {
    let statement = '';
    let logicalOperator = '';
    let comparator = '';

    for (let i = 0; i < ctx.children.length; i++) {
      if (ctx.children[i].constructor.name == 'ExpressionContext') {
        statement += this.translator.handleExpression(ctx.children[i]);
      } else if (ctx.children[i].constructor.name == 'Or_andContext') {
        logicalOperator = ctx.children[i].getText();
        if (logicalOperator == 'and') {
          statement += ' && ';
        } else if (logicalOperator == 'or') {
          statement += ' || ';
        } else {
          console.log('Unrecognized logicalOperator in IF Statement');
        }
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
    this.translator.output += `if (${statement}) {`;
  }

  exitIf_statement(ctx) {
    this.translator.output += '}';
  }

  // TODO: verify open/close brackets
  enterIf_statement_key_state(ctx) {
    let leftExpression = ctx.current_Key_State(0)?.expression(0)?.getText();

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

  exitIf_statement_key_state(ctx) {
    this.translator.output += '}';
  }

  enterElse_statement(ctx) {
    this.translator.output += '} else {';
  }

  exitElse_statement(ctx) {
    this.translator.output += '';
  }
}
