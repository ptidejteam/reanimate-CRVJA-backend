export default class ScopeHandler {
  constructor(translator) {
    this.translator = translator;
  }

  // Scope management
  enterNewScope() {
    this.translator.scopes.push({});
  }

  exitCurrentScope() {
    this.translator.scopes.pop();
  }

  get currentScope() {
    return this.translator.scopes[this.translator.scopes.length - 1];
  }

  get isRootScope() {
    return this.translator.scopes.length === 1;
  }

  isVariableDeclared(name) {
    const isLocal = this.currentScope[name] !== undefined;
    const isGlobal = this.translator.globalVariablesSet.has(name);

    return isLocal || isGlobal;
  }

  enterGlobal(ctx) {
    for (let i = 0; i < ctx.IDENTIFIER().length; i++) {
      this.translator.globalVariablesSet.add(ctx.IDENTIFIER(i).getText());
    }
    for (let i = 0; i < ctx.array_structure().length; i++) {
      this.translator.globalVariablesSet.add(ctx.array_structure(i).IDENTIFIER(0).getText());
    }
  }

  enterVariable_starter(ctx) {
    let name = ctx.children[0].getText();
    let value = this.translator.handleExpression(ctx.children[2]);

    let lineNumber = ctx.start.line;
    if (name !== 'Timer') {
      if (value > 2147483647) {
        throw new Error(
          `ERROR: Amos code line ${lineNumber}: Value for variable "${name}" exceeds the allowed limit of 2,147,483,647.`,
        );
      }

      // TODO: use a Set tracking would be O(1)
      if (this.isVariableDeclared(name)) {
        // Variable already exists at this level
        this.translator.output += `${name} = ${value};`;
      } else {
        // Variable doesn't exist at this level, so create it
        let defaultValue = name.endsWith('$') ? '""' : 0;
        if (this.isRootScope) {
          this.translator.globalVariables += `let ${name} = ${defaultValue};\n`;
          this.translator.output += `${name} = ${value};`;
        } else {
          this.translator.output += `let ${name} = ${defaultValue};${name} = ${value};`;
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
        this.translator.globalVariables += `let ${variable} = ${defaultValue};`;
      } else {
        this.translator.output += `let ${variable} = ${defaultValue};`;
      }
      this.currentScope[variable] = defaultValue;
    }

    let valueStarter;
    let valueEndIteration;

    if (ctx.expression().length > 1) {
      valueStarter = ctx.expression(1)?.getText();
      valueEndIteration = ctx.expression(2)?.getText();

      this.translator.output += `
${variable} = (${variable} + ${valueExpression}) % ${valueEndIteration};
if (${variable} < ${valueStarter}) {
    ${variable} += ${valueEndIteration};
}`;
    } else {
      this.translator.output += `${variable} = ${variable} + ${valueExpression};`;
    }
  }

  enterProcedure(ctx) {
    this.translator.id++;
    let name = ctx.children[1]?.getText();

    let params = [];
    // Collect all IDENTIFIER tokens after the procedure name (which is index 0 in the parser context)
    for (let i = 1; i < ctx.IDENTIFIER().length; i++) {
      params.push(ctx.IDENTIFIER(i).getText());
    }
    let props = params.join(', ');

    this.enterNewScope();
    let localDeclarations = '';
    for (let varName of Object.keys(this.translator.scopes[0])) {
      if (!this.translator.globalVariablesSet.has(varName) && !params.includes(varName)) {
        let defaultValue = varName.endsWith('$') ? '""' : 0;
        localDeclarations += `\n  let ${varName} = ${defaultValue};`;
        this.currentScope[varName] = defaultValue;
      }
    }

    this.translator.functionDeclarationSupport += `let lastTime${name} = 0; let timeoutId${name} = null;`;

    this.translator.output += `
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
    this.translator.output += '}';
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
        .expression()
        .map((expr) => expr.getText())
        .join(', ');
      callCode = `${name}(${args});`;
    }

    this.translator.output += `${callCode}`;
  }
}
