import { getRuleName } from './handler-dispatcher.js';

// Functions whose result is a real number, even with integer arguments.
const REAL_FUNCTIONS = new Set([
  'acosFunction',
  'asinFunction',
  'atanFunction',
  'cosFunction',
  'expFunction',
  'hcosFunction',
  'hsinFunction',
  'htanFunction',
  'lnFunction',
  'logFunction',
  'piFunction',
  'sinFunction',
  'sqrFunction',
]);

// Functions whose result is always whole, whatever their arguments: Rnd(Sin(X)) is an integer.
const INTEGER_FUNCTIONS = new Set([
  'colourFunction',
  'falseFunction',
  'intFunction',
  'notOperator',
  'rndFunction',
  'spriteColFunction',
  'trueFunction',
  'xMouse',
  'xSpriteFunction',
  'yMouse',
  'ySpriteFunction',
]);

export default class ExpressionTranslator {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  translate(node) {
    if (!node) return '';
    if (Array.isArray(node)) return node.map((child) => this.translate(child));
    if (node.symbol) {
      const text = node.getText();
      return text === 'Timer' ? 'getTimer()' : text;
    }

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
        const handler = this.dispatcher.getExpressionHandler(node);
        if (!handler) throw new Error(`No expression handler for rule "${rule}"`);
        return handler(node);
      }
    }
  }

  // True when the expression can give a fraction: a decimal number (3.7), a division, a float
  // variable or array (X#, A#(1)), a Fn call or a real function (Cos, Sqr, ...). An integer
  // variable stores such a value truncated toward zero, as AMOS does (X=3.7 → 3, X=-3.7 → -3).
  mayBeFractional(node) {
    if (!node) return false;
    if (node.symbol) {
      const text = node.getText();
      if (text === '/') return true;
      if (/^[0-9]+\.[0-9]+$/.test(text)) return true;
      return text.endsWith('_f');
    }

    const rule = getRuleName(node);
    if (REAL_FUNCTIONS.has(rule)) return true;
    if (INTEGER_FUNCTIONS.has(rule)) return false;
    // Even an integer Fn returns its expression as is: Def Fn A(X)=X/2 gives Fn A(7) = 3.5.
    if (rule === 'fnCall') return true;
    // The type of an array element comes from its name, not its indices.
    if (rule === 'arrayStructure') return node.IDENTIFIER().getText().endsWith('_f');
    return (node.children ?? []).some((child) => this.mayBeFractional(child));
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

    const hex = ctx.HEX_NUMBER();
    if (hex) return String(parseInt(hex.getText().slice(1), 16));

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
