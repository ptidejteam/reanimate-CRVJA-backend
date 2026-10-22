import antlr4 from 'antlr4';
import AMOSVisitor from './grammar/generated/AMOSVisitor.js';

/**
 * Translates AMOS expressions (operators, parentheses, arrays) into JavaScript.
 * AMOS functions (Abs, Sin...) are translated in commands/, like the other commands.
 */
export default class ExpressionVisitor extends AMOSVisitor {
  constructor(translator) {
    super();
    this.translator = translator;
  }

  // Imported AMOS rules in another generated parser have different context classes.
  // Dispatch by their shared rule names instead of generated accept()/instanceof checks.
  visit(ctx) {
    if (!ctx) return '';
    if (Array.isArray(ctx)) return ctx.map((child) => this.visit(child));
    if (!(ctx instanceof antlr4.ParserRuleContext)) return this.visitTerminal(ctx);
    const rule = ctx.parser.ruleNames[ctx.ruleIndex];
    const method = `visit${rule[0].toUpperCase()}${rule.slice(1)}`;
    return this[method] ? this[method](ctx) : this.visitChildren(ctx);
  }

  // Addition and subtraction: a + b - c
  visitExpression(ctx) {
    if (!ctx) return '';

    const terms = ctx.term();
    if (!terms || terms.length === 0) return '';

    let result = this.visit(terms[0]);

    // children: term0, op1, term1, op2, term2... so the operator before term(i) is children[2*i - 1]
    for (let i = 1; i < terms.length; i++) {
      const operator = ctx.children[2 * i - 1].getText();
      const rightTerm = this.visit(terms[i]);
      result += ` ${operator} ${rightTerm}`;
    }

    return result;
  }

  // Multiplication, division and unary minus: -a * b / c
  visitTerm(ctx) {
    if (!ctx) return '';

    let prefix = '';
    let childOffset = 0;

    if (ctx.SUBTRACT()) {
      prefix = '-';
      childOffset = 1; // skip the SUBTRACT token in children
    }

    const factors = ctx.factor();
    if (!factors || factors.length === 0) return prefix;

    let result = prefix + this.visit(factors[0]);

    // children: [SUBTRACT], factor0, op1, factor1... so the operator before factor(i) is
    // children[childOffset + 2*i - 1]
    for (let i = 1; i < factors.length; i++) {
      const operator = ctx.children[childOffset + 2 * i - 1].getText();
      const rightFactor = this.visit(factors[i]);
      result += ` ${operator} ${rightFactor}`;
    }

    return result;
  }

  visitFactor(ctx) {
    if (!ctx) return '';
    return this.visit(ctx.getChild(0));
  }

  visitCoreFactor(ctx) {
    if (!ctx) return '';

    // Parentheses: (a + b)
    if (ctx.expression()) return `(${this.visit(ctx.expression())})`;

    // Array access: A(1, 2)
    if (ctx.arrayStructure()) return this.visit(ctx.arrayStructure());

    // AMOS function, e.g. Abs(X) -> visitAbsFunction(ctx) in commands/functions.js
    const child = ctx.getChild(0);
    if (child instanceof antlr4.ParserRuleContext) {
      return this.translator.forwardToCommands('visit', child);
    }

    // NUMBER, STRING, IDENTIFIER or HEX_NUMBER
    return ctx.getText();
  }

  // Array access: A(I, J) -> A[Math.trunc(I)][Math.trunc(J)]
  visitArrayStructure(ctx) {
    const arrayName = ctx.IDENTIFIER().getText();
    const expressions = ctx.expression();

    const formattedIndices = expressions
      .map((exprCtx) => `[Math.trunc(${this.visit(exprCtx)})]`)
      .join('');

    return `${arrayName}${formattedIndices}`;
  }
}
