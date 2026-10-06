import AMOSParser from '../grammar/generated/AMOSParser.js';
import BaseHandler from './base-handler.js';

/**
 * AMOS commands of the category "Structure", sorted A-Z by AMOS name, followed by
 * the language syntax that has no category (assignments).
 */
export default class Structures extends BaseHandler {
  // DATA
  enterDataStatement(ctx) {
    if (!this.translator.hasDataMatrix) {
      this.translator.hasDataMatrix = true;
      this.emit('const dataMatrix = [];');
    }

    // All Data values form one list, read in order by Read
    const values = ctx.expression().map((expression) => this.expr(expression));
    const row = `${values.join(', ')}`;
    this.emit(`dataMatrix.push(${row});`);
  }

  // DO ... LOOP
  enterDoLoop(ctx) {
    this.emit('while(true) {');
  }

  exitDoLoop(ctx) {
    this.emit('await new Promise(r => setTimeout(r, 16));}');
  }

  // ELSE
  enterElseStatement(ctx) {
    this.emit('} else {');
  }

  exitElseStatement(ctx) {
    this.emit('');
  }

  // FOR ... NEXT
  enterForLoop(ctx) {
    let variable = ctx.IDENTIFIER(0).getText();
    let start = this.expr(ctx.expression(0));
    let end = this.expr(ctx.expression(1));

    this.declareVariable(variable);
    this.emit(`for (${variable} = ${start}; ${variable} <= ${end}; ${variable}++) {`);
  }

  exitForLoop(ctx) {
    this.emit('}');
  }

  // GLOBAL
  enterGlobal(ctx) {
    for (let i = 0; i < ctx.IDENTIFIER().length; i++) {
      this.translator.globalVariablesSet.add(ctx.IDENTIFIER(i).getText());
    }
    for (let i = 0; i < ctx.arrayStructure().length; i++) {
      this.translator.globalVariablesSet.add(ctx.arrayStructure(i).IDENTIFIER(0).getText());
    }
  }

  // IF ... END IF
  enterIfStatement(ctx) {
    let condition = '';

    for (const child of ctx.children) {
      if (child instanceof AMOSParser.ExpressionContext) {
        condition += this.expr(child);
      } else if (child instanceof AMOSParser.LogicalOperatorContext) {
        condition += child.AND() ? ' && ' : ' || ';
      } else if (child instanceof AMOSParser.ComparisonOperatorContext) {
        let comparator = child.getText();
        // Special cases for = and <>
        if (comparator === '=') comparator = '==';
        if (comparator === '<>') comparator = '!=';
        condition += ` ${comparator} `;
      }
    }
    this.emit(`if (${condition}) {`);
  }

  exitIfStatement(ctx) {
    this.emit('}');
  }

  // IF KEY STATE(...) ... END IF
  // KEY STATE is a Function, but the grammar only accepts it as the condition of If / While,
  // so it is translated here.
  // TODO: verify open/close brackets
  enterIfKeyStateStatement(ctx) {
    let leftExpression = this.expr(ctx.keyStateFunction(0)?.expression(0));

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
    this.emit(`if (currentPressedKey === ${leftExpression}]) {`);
  }

  exitIfKeyStateStatement(ctx) {
    this.emit('}');
  }

  // INPUT #
  enterInputVariable(ctx) {
    let channel = ctx.children[1]?.getText() || '';
    if (ctx.children[2]) channel += ctx.children[2].getText();

    let variable = ctx.children[4]?.getText() || '';
    if (ctx.children[5]) variable += ctx.children[5].getText();

    this.emit(
      `\nlet ${variable} = '';\nreadFromChannel(${channel}, (data) => {\n    ${variable} = data;\n});`,
    );
  }

  // PROC (procedure call)
  enterProcedureCall(ctx) {
    const name = ctx.IDENTIFIER().getText();
    let callCode = '';

    if (!ctx.SQUARE_BRACKET_OPEN()) {
      // Case 1: Calling a procedure with just its name
      callCode = `${name}();`;
    } else {
      // Case 2: Calling a procedure with some parameters
      const args = ctx
        .expression()
        .map((expr) => this.expr(expr))
        .join(', ');
      callCode = `${name}(${args});`;
    }

    this.emit(`${callCode}`);
  }

  // PROCEDURE ... END PROC
  enterProcedure(ctx) {
    let name = ctx.children[1]?.getText();

    let params = [];
    // Collect all IDENTIFIER tokens after the procedure name (which is index 0 in the parser context)
    for (let i = 1; i < ctx.IDENTIFIER().length; i++) {
      params.push(ctx.IDENTIFIER(i).getText());
    }
    let props = params.join(', ');

    this.translator.scopes.push({});
    for (const param of params) {
      // A procedure parameter is already a binding in the generated function scope
      this.translator.currentScope[param] = this.translator.defaultValueFor(param);
    }

    // Main-program variables that are not Global become locals of the procedure
    let localDeclarations = '';
    for (let varName of Object.keys(this.translator.scopes[0])) {
      if (!this.translator.globalVariablesSet.has(varName) && !params.includes(varName)) {
        let defaultValue = this.translator.defaultValueFor(varName);
        localDeclarations += `\n  let ${varName} = ${defaultValue};`;
        this.translator.currentScope[varName] = defaultValue;
      }
    }

    this.translator.functionDeclarationSupport += `let lastTime${name} = 0; let timeoutId${name} = null;`;

    this.emit(`
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
${localDeclarations}`);
  }

  exitProcedure(ctx) {
    this.translator.scopes.pop();
    this.emit('}');
  }

  // READ
  enterReadStatement(ctx) {
    for (const target of ctx.readTarget()) {
      const arrayTarget = target.arrayStructure();
      const targetCode = arrayTarget ? this.expr(arrayTarget) : target.IDENTIFIER().getText();

      // TODO: AMOS should report an error if dataMatrixPointer > dataMatrix.length
      this.emit(`${targetCode} = dataMatrix[dataMatrixPointer++];`);
    }
  }

  // REPEAT ... UNTIL
  enterRepeatUntil(ctx) {
    this.emit('setInterval(() => { currentTimer = Date.now(); Timer++;');
  }

  exitRepeatUntil(ctx) {
    this.emit('Timer = 9; }, 16);');
  }

  // WHILE ... WEND
  // KEY STATE is a Function, but the grammar only accepts it as the condition of If / While,
  // so it is translated here.
  enterWhileWend(ctx) {
    let leftExpression = this.expr(ctx.keyStateFunction(0)?.expression(0));
    if (!leftExpression) return;

    // Replace all occurrences of $xx with decimal equivalents
    leftExpression = leftExpression.replace(/\$[0-9A-Fa-f]+/g, (match) => {
      return parseInt(match.substring(1), 16);
    });

    // Cf. https://www.cknow.com/cms/articles/what-is-a-scan-code.html
    this.emit(`\nif (currentPressedKey === keyMapping[${leftExpression}]) {`);
  }

  exitWhileWend(ctx) {
    this.emit('}');
  }

  // Not in the command index: language syntax without a category.

  // Array assignment: A(1) = 2
  enterArrayAssignment(ctx) {
    const struct = ctx.arrayStructure();

    const arrayTarget = this.expr(struct);
    const arrayValue = this.expr(ctx.expression());
    this.emit(` ${arrayTarget} = ${arrayValue};`);
  }

  // Variable assignment: X = 1
  enterVariableAssignment(ctx) {
    let name = ctx.children[0].getText();
    let value = this.expr(ctx.children[2]);

    let lineNumber = ctx.start.line;
    if (name !== 'Timer') {
      if (value > 2147483647) {
        throw new Error(
          `ERROR: Amos code line ${lineNumber}: Value for variable "${name}" exceeds the allowed limit of 2,147,483,647.`,
        );
      }

      this.declareVariable(name);
      this.emit(`${name} = ${value};`);
    }
  }
}
