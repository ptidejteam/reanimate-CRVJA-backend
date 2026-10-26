import { getRuleName } from '../core/handler-dispatcher.js';

/**
 * AMOS commands of the category "Structure", sorted A-Z by AMOS name, followed by
 * the language syntax that has no category (assignments).
 */
export default class Structures {
  constructor(context) {
    this.context = context;
    this.expressions = context.expressions;
  }

  // DATA
  enterDataStatement(ctx) {
    if (!this.context.hasDataMatrix) {
      this.context.hasDataMatrix = true;
      this.context.emit('const dataMatrix = [];');
    }

    // All Data values form one list, read in order by Read
    const values = ctx.expression().map((expression) => this.expressions.translate(expression));
    const row = `${values.join(', ')}`;
    this.context.emit(`dataMatrix.push(${row});`);
  }

  // DEF FN
  enterDefFn(ctx) {
    const name = ctx.IDENTIFIER(0).getText();
    const parameters = ctx
      .IDENTIFIER()
      .slice(1)
      .map((identifier) => identifier.getText());
    const expression = this.expressions.translate(ctx.expression());

    this.context.emit(`${name}=(${parameters.join(',')})=>${expression};`);
  }

  // DO ... LOOP
  enterDoLoop(ctx) {
    this.context.incrementCurrentLoop();
    this.context.emit('loop' + this.context.currentLoop + ': while(true) {');
  }

  exitDoLoop(ctx) {
    this.context.decrementCurrentLoop();
    this.context.emit('await new Promise(r => setTimeout(r, 16));}');
  }

  // ELSE
  enterElseStatement(ctx) {
    this.context.emit('} else {');
  }

  exitElseStatement(ctx) {
    this.context.emit('');
  }

  // ELSE IF
  enterElseIfStatement(ctx) {
    this.context.emit(`} else if (${this.ifCondition(ctx.condition())}) {`);
  }

  // EXIT
  enterExitLoop(ctx) {
    const count = ctx.NUMBER() ? parseInt(ctx.NUMBER().getText(), 10) : 1; // Exit without a number is the same as Exit 1
    const depth = this.context.currentLoop;

    this.context.emit('break loop' + (depth - count + 1) + ';');
  }

  // EXIT IF
  enterExitIf(ctx) {
    const condition = this.ifCondition(ctx.condition());
    const count = ctx.NUMBER() ? parseInt(ctx.NUMBER().getText(), 10) : 1; // Exit without a number is the same as Exit 1
    const depth = this.context.currentLoop;

    this.context.emit(`if (${condition}) { break loop${depth - count + 1}; }`);
  }

  // FN
  // FN is a Structure, but it returns a value inside an expression (Print Fn X(1,10,100)),
  // so it is translated by a translateX method.
  translateFnCall(ctx) {
    const name = ctx.IDENTIFIER().getText();
    const args = ctx
      .expression()
      .map((expression) => this.expressions.translate(expression))
      .join(',');

    return `${name}(${args})`;
  }

  // FOR ... NEXT (and STEP)
  // STEP is a Structure, but it is part of the forLoop rule (For I=1 To 9 Step 2),
  // so it is translated here.
  enterForLoop(ctx) {
    let variable = ctx.IDENTIFIER(0).getText();
    let start = this.expressions.translate(ctx.expression(0));
    let end = this.expressions.translate(ctx.expression(1));

    this.context.declareVariable(variable);

    if (!ctx.STEP()) {
      this.context.emit(`for (${variable} = ${start}; ${variable} <= ${end}; ${variable}++) {`);
      return;
    }

    const step = this.expressions.translate(ctx.expression(2));
    let condition;

    if (isNaN(Number(step))) {
      condition = `(${step}) >= 0 ? ${variable} <= ${end} : ${variable} >= ${end}`;
    } else if (Number(step) < 0) {
      condition = `${variable} >= ${end}`;
    } else {
      condition = `${variable} <= ${end}`;
    }

    this.context.emit(`for (${variable} = ${start}; ${condition}; ${variable} += ${step}) {`);
  }

  exitForLoop(ctx) {
    this.context.emit('}');
  }

  // GLOBAL
  enterGlobal(ctx) {
    for (let i = 0; i < ctx.IDENTIFIER().length; i++) {
      this.context.globalVariablesSet.add(ctx.IDENTIFIER(i).getText());
    }
    for (let i = 0; i < ctx.arrayStructure().length; i++) {
      this.context.globalVariablesSet.add(ctx.arrayStructure(i).IDENTIFIER(0).getText());
    }
  }

  // IF ... END IF
  enterIfStatement(ctx) {
    this.context.emit(`if (${this.ifCondition(ctx)}) {`);
  }

  exitIfStatement(ctx) {
    this.context.emit('}');
  }

  // IF KEY STATE(...) ... END IF
  // KEY STATE is a Function, but the grammar only accepts it as the condition of If / While,
  // so it is translated here.
  enterIfKeyStateStatement(ctx) {
    this.context.emit(`if (${this.keyStateCondition(ctx.keyStateFunction())}) {`);
  }

  exitIfKeyStateStatement(ctx) {
    this.context.emit('}');
  }

  // INPUT #
  enterInputVariable(ctx) {
    let channel = ctx.children[1]?.getText() || '';
    if (ctx.children[2]) channel += ctx.children[2].getText();

    let variable = ctx.children[4]?.getText() || '';
    if (ctx.children[5]) variable += ctx.children[5].getText();

    this.context.emit(
      `\nlet ${variable} = '';\nreadFromChannel(${channel}, (data) => {\n    ${variable} = data;\n});`,
    );
  }

  // LINE INPUT #
  enterLineInputFile(ctx) {
    console.log('To be implemented');
  }

  // NOT
  // NOT is a Structure, but it returns a value inside an expression (X = Not Y),
  // so it is translated by a translateX method.
  translateNotOperator(ctx) {
    const minus = ctx.SUBTRACT() ? '-' : '';
    const value = this.expressions.translate(ctx.factor());
    return `~(${minus}${value})`;
  }

  // ON BREAK PROC
  enterOnBreakProc(ctx) {
    console.log('To be implemented');
  }

  // ON ERROR
  enterOnError(ctx) {
    console.log('To be implemented');
  }

  // ON ERROR PROC
  enterOnErrorProc(ctx) {
    console.log('To be implemented');
  }

  // ON ... PROC
  enterOnProc = (ctx) => this.context.emit(`switch(${ctx.IDENTIFIER(0)}){${ctx.IDENTIFIER().slice(1).map((elt, idx) => `case ${idx+1}:${elt}();break;`).join('')}}`);

  // POP PROC
  enterPopProc(ctx) {
    console.log('To be implemented');
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
        .map((expr) => this.expressions.translate(expr))
        .join(', ');
      callCode = `${name}(${args});`;
    }

    this.context.emit(`${callCode}`);
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

    this.context.scopes.push({});
    for (const param of params) {
      // A procedure parameter is already a binding in the generated function scope
      this.context.currentScope[param] = this.context.defaultValueFor(param);
    }

    // Main-program variables that are not Global become locals of the procedure
    let localDeclarations = '';
    for (let varName of Object.keys(this.context.scopes[0])) {
      if (!this.context.globalVariablesSet.has(varName) && !params.includes(varName)) {
        let defaultValue = this.context.defaultValueFor(varName);
        localDeclarations += `\n  let ${varName} = ${defaultValue};`;
        this.context.currentScope[varName] = defaultValue;
      }
    }

    this.context.functionDeclarationSupport += `let lastTime${name} = 0; let timeoutId${name} = null;`;

    this.context.emit(`
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
    this.context.scopes.pop();
    this.context.emit('}');
  }

  // READ
  enterReadStatement(ctx) {
    for (const target of ctx.readTarget()) {
      const arrayTarget = target.arrayStructure();
      const targetCode = arrayTarget
        ? this.expressions.translate(arrayTarget)
        : target.IDENTIFIER().getText();

      // TODO: AMOS should report an error if dataMatrixPointer > dataMatrix.length
      this.context.emit(`${targetCode} = dataMatrix[dataMatrixPointer++];`);
    }
  }

  // REPEAT ... UNTIL
  enterRepeatUntil(ctx) {
    this.context.emit('setInterval(() => { currentTimer = Date.now(); Timer++;');
  }

  exitRepeatUntil(ctx) {
    this.context.emit('Timer = 9; }, 16);');
  }

  // RESTORE
  enterRestore(ctx) {
    console.log('To be implemented');
  }

  // RESUME
  enterResume(ctx) {
    console.log('To be implemented');
  }

  // RESUME LABEL
  enterResumeLabel(ctx) {
    console.log('To be implemented');
  }

  // SHARED
  enterShared(ctx) {
    console.log('To be implemented');
  }

  // SWAP
  enterSwap(ctx) {
    const first = ctx.IDENTIFIER(0).getText();
    const second = ctx.IDENTIFIER(1).getText();

    this.context.declareVariable(first);
    this.context.declareVariable(second);
    this.context.emit(`[${first}, ${second}] = [${second}, ${first}];`);
  }

  // THEN
  // Single-line If: If X=1 Then Print "A" Else Print "B"
  enterIfThenStatement(ctx) {
    this.context.emit(`if (${this.ifCondition(ctx.condition())}) {`);
  }

  exitIfThenStatement(ctx) {
    this.context.emit('}');
  }

  enterIfThenElse(ctx) {
    this.context.emit('} else {');
  }

  // WHILE ... WEND
  // KEY STATE is a Function, but the grammar only accepts it as the condition of If / While,
  // so it is translated here.
  enterWhileWend(ctx) {
    this.context.emit(`\nif (${this.keyStateCondition(ctx.keyStateFunction())}) {`);
  }

  exitWhileWend(ctx) {
    this.context.emit('}');
  }

  // Not in the command index: language syntax without a category.

  // Array assignment: A(1) = 2
  enterArrayAssignment(ctx) {
    const struct = ctx.arrayStructure();

    const arrayTarget = this.expressions.translate(struct);
    const arrayValue = this.expressions.translate(ctx.expression());
    this.context.emit(` ${arrayTarget} = ${arrayValue};`);
  }

  // Variable assignment: X = 1
  enterVariableAssignment(ctx) {
    let name = ctx.children[0].getText();
    let value = this.expressions.translate(ctx.children[2]);

    let lineNumber = ctx.start.line;
    if (name !== 'Timer') {
      if (value > 2147483647) {
        throw new Error(
          `ERROR: Amos code line ${lineNumber}: Value for variable "${name}" exceeds the allowed limit of 2,147,483,647.`,
        );
      }

      this.context.declareVariable(name);
      this.context.emit(`${name} = ${value};`);
    }
  }

  // Condition of IF ... END IF, or a `condition` node (ELSE IF, EXIT IF, THEN):
  // X = 1 and Y <> 2 → X == 1 && Y != 2, or Key State($10) → currentPressedKey === keyMapping[16]
  ifCondition(ctx) {
    let condition = '';

    for (const child of ctx.children) {
      const rule = getRuleName(child);
      if (rule === 'keyStateFunction') {
        condition += this.keyStateCondition(child);
      } else if (rule === 'expression') {
        condition += this.expressions.translate(child);
      } else if (rule === 'logicalOperator') {
        condition += child.AND() ? ' && ' : ' || ';
      } else if (rule === 'comparisonOperator') {
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
    const scanCode = this.expressions
      .translate(ctx.expression())
      .replace(/\$[0-9A-Fa-f]+/g, (hex) => parseInt(hex.substring(1), 16));
    return `currentPressedKey === keyMapping[${scanCode}]`;
  }
}
