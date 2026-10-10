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

  // DEF FN
  enterDefFn(ctx) {
    console.log('To be implemented...');
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

  // ELSE IF
  enterElseIfStatement(ctx) {
    this.emit(`} else if (${this.ifCondition(ctx.condition())}) {`);
  }

  // EXIT
  enterExitLoop(ctx) {
    console.log('To be implemented...');
  }

  // EXIT IF
  enterExitIf(ctx) {
    console.log('To be implemented...');
  }

  // FN
  // FN is a Structure, but it returns a value inside an expression (Print Fn X(1,10,100)),
  // so it is translated by a visitX method.
  visitFnCall(ctx) {
    console.log('To be implemented...');
    return `0`;
  }

  // FOR ... NEXT (and STEP)
  // STEP is a Structure, but it is part of the forLoop rule (For I=1 To 9 Step 2),
  // so it is translated here.
  enterForLoop(ctx) {
    let variable = ctx.IDENTIFIER(0).getText();
    let start = this.expr(ctx.expression(0));
    let end = this.expr(ctx.expression(1));

    if (ctx.STEP()) {
      console.log('To be implemented...');
    }

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
    this.emit(`if (${this.ifCondition(ctx)}) {`);
  }

  exitIfStatement(ctx) {
    this.emit('}');
  }

  // IF KEY STATE(...) ... END IF
  // KEY STATE is a Function, but the grammar only accepts it as the condition of If / While,
  // so it is translated here.
  enterIfKeyStateStatement(ctx) {
    this.emit(`if (${this.keyStateCondition(ctx.keyStateFunction())}) {`);
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

  // NOT
  // NOT is a Structure, but it returns a value inside an expression (X = Not Y),
  // so it is translated by a visitX method.
  visitNotOperator(ctx) {
    console.log('To be implemented...');
    return `0`;
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

  // SWAP
  enterSwap(ctx) {
    console.log('To be implemented...');
  }

  // THEN
  // Single-line If: If X=1 Then Print "A" Else Print "B"
  enterIfThenStatement(ctx) {
    console.log('To be implemented...');
  }

  // WHILE ... WEND
  // KEY STATE is a Function, but the grammar only accepts it as the condition of If / While,
  // so it is translated here.
  enterWhileWend(ctx) {
    this.emit(`\nif (${this.keyStateCondition(ctx.keyStateFunction())}) {`);
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

  // Condition of IF ... END IF, or a `condition` node (ELSE IF, EXIT IF, THEN):
  // X = 1 and Y <> 2 → X == 1 && Y != 2, or Key State($10) → currentPressedKey === keyMapping[16]
  ifCondition(ctx) {
    let condition = '';

    for (const child of ctx.children) {
      if (child instanceof AMOSParser.KeyStateFunctionContext) {
        condition += this.keyStateCondition(child);
      } else if (child instanceof AMOSParser.ExpressionContext) {
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
    return condition;
  }

  // Condition of KEY STATE: Key State($10+I) → currentPressedKey === keyMapping[16 + I]
  keyStateCondition(ctx) {
    // AMOS scan codes are hexadecimal ($10): keyMapping is indexed by their decimal value.
    // Cf. https://www.cknow.com/cms/articles/what-is-a-scan-code.html
    const scanCode = this.expr(ctx.expression()).replace(/\$[0-9A-Fa-f]+/g, (hex) =>
      parseInt(hex.substring(1), 16),
    );
    return `currentPressedKey === keyMapping[${scanCode}]`;
  }
}
