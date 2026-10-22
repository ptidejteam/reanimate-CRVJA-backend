import { getRuleName } from './handler-dispatcher.js';

/** Translates expression syntax and resolves function handlers from any owning parser. */
export default class ExpressionTranslator {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  translate(node) {
    if (!node) return '';
    if (Array.isArray(node)) return node.map((child) => this.translate(child));
    if (node.symbol) return node.getText();

    const rule = getRuleName(node);
    switch (rule) {
      case 'expression':
        return this.translateExpression(node);
      case 'term':
        return this.translateTerm(node);
      case 'factor':
        return this.translateFactor(node);
      case 'arrayStructure':
        return this.translateArray(node);
      default: {
        const handler = this.dispatcher.get('visit', node);
        if (!handler) throw new Error(`No expression handler for rule "${rule}"`);
        return handler(node);
      }
    }
  }

  // Addition and subtraction: a + b - c.
  translateExpression(ctx) {
    const terms = ctx.term();
    if (!terms.length) return '';

    let result = this.translate(terms[0]);
    // Children alternate between terms and operators.
    for (let i = 1; i < terms.length; i++) {
      const operator = ctx.children[2 * i - 1].getText();
      const rightTerm = this.translate(terms[i]);
      result += ` ${operator} ${rightTerm}`;
    }
    return result;
  }

  // Multiplication, division and unary minus: -a * b / c.
  translateTerm(ctx) {
    const hasUnaryMinus = Boolean(ctx.SUBTRACT());
    const prefix = hasUnaryMinus ? '-' : '';
    const childOffset = hasUnaryMinus ? 1 : 0;
    const factors = ctx.factor();
    if (!factors.length) return prefix;

    let result = prefix + this.translate(factors[0]);
    // Skip the optional unary minus, then alternate factors and operators.
    for (let i = 1; i < factors.length; i++) {
      const operator = ctx.children[childOffset + 2 * i - 1].getText();
      const rightFactor = this.translate(factors[i]);
      result += ` ${operator} ${rightFactor}`;
    }
    return result;
  }

  translateFactor(ctx) {
    const expression = ctx.expression();
    if (expression) return `(${this.translate(expression)})`;

    // Arrays, function calls and literal terminals all use the same entry point.
    return this.translate(ctx.getChild(0));
  }

  // Array access: A(I, J) -> A[Math.trunc(I)][Math.trunc(J)].
  translateArray(ctx) {
    const name = ctx.IDENTIFIER().getText();
    const indices = ctx
      .expression()
      .map((expression) => `[Math.trunc(${this.translate(expression)})]`);
    return `${name}${indices.join('')}`;
  }
}
