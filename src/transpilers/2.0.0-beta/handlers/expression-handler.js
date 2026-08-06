export default class ExpressionHandler {
  constructor(translator) {
    this.translator = translator;
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
      | '(' expression ')'
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
      } else if (childName === 'ExpressionContext') {
        this.handleExpr(accumulator, child);
      } else if (factorContext.expression()) {
        accumulator.push('(');
        const innerResult = this.handleExpression(factorContext.expression());
        accumulator.push(innerResult);
        accumulator.push(')');
      } else {
        // console.warn(`handleFactor: unhandled child type "${childName}"`);
        accumulator.push(child.getText());
      }
    }
  }

  handleArrayAccess(accumulator, arrayStructure) {
    const name = arrayStructure.IDENTIFIER(0)?.getText();

    const firstIndex = arrayStructure.expression(0).getText();
    accumulator.push(`${name}[Math.trunc(${firstIndex})]`);

    const numberOfDimensions = arrayStructure.expression().length;
    for (let j = 1; j < numberOfDimensions; j++) {
      const indexValue = arrayStructure.expression(j).getText();
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
          console.warn(`handleTerm: unhandled child type "${childName}"`);
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
}
