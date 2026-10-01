import AMOSVisitor from '../grammar/generated/AMOSVisitor.js';

/**
 * ExpressionVisitor transpiles AMOS expression AST nodes into JavaScript
 * expression strings using ANTLR's standard Visitor pattern.
 */
export default class ExpressionVisitor extends AMOSVisitor {
  constructor(translator) {
    super();
    this.translator = translator;
  }

  /**
   * Grammar Rule:
   * expression: term ((ADD | SUBTRACT) term)* NUMBER?
   * Evaluates addition / subtraction chains.
   */
  visitExpression(ctx) {
    if (!ctx) return '';

    const terms = ctx.term();
    if (!terms || terms.length === 0) return '';

    // Evaluate initial term
    let result = this.visit(terms[0]);

    // Evaluate subsequent operator-term pairs: e.g. + term(1) - term(2)
    for (let i = 1; i < terms.length; i++) {
      // The operator token sits between term(i-1) and term(i) in the children array.
      // children layout: term0, op1, term1, op2, term2, ...
      // operator at children index (2*i - 1)
      const operator = ctx.children[2 * i - 1].getText();
      const rightTerm = this.visit(terms[i]);
      result += ` ${operator} ${rightTerm}`;
    }

    // Handle trailing NUMBER (e.g. "expression: term ... NUMBER?")
    if (ctx.NUMBER()) {
      result += ctx.NUMBER().getText();
    }

    return result;
  }

  /**
   * Grammar Rule:
   * term: SUBTRACT? factor ((MULTIPLY | DIVIDE) factor)*
   * Evaluates multiplication / division chains and unary minus.
   */
  visitTerm(ctx) {
    if (!ctx) return '';

    let prefix = '';
    let childOffset = 0;

    // Handle leading unary minus
    if (ctx.SUBTRACT()) {
      prefix = '-';
      childOffset = 1; // skip the SUBTRACT token in children indexing
    }

    const factors = ctx.factor();
    if (!factors || factors.length === 0) return prefix;

    let result = prefix + this.visit(factors[0]);

    for (let i = 1; i < factors.length; i++) {
      // children layout (with optional SUBTRACT prefix):
      //   [SUBTRACT?] factor0, op1, factor1, op2, factor2, ...
      // operator at children index: childOffset + (2*i - 1)
      const operator = ctx.children[childOffset + 2 * i - 1].getText();
      const rightFactor = this.visit(factors[i]);
      result += ` ${operator} ${rightFactor}`;
    }

    return result;
  }

  /**
   * Grammar Rule:
   * factor: NUMBER | STRING | arrayStructure | sinFunction | cosFunction
   *       | qsinFunction | qcosFunction | rndFunction | IDENTIFIER
   *       | '(' expression ')' | HEX_NUMBER
   */
  visitFactor(ctx) {
    if (!ctx) return '';

    // Case 1: Parenthesised expression: '(' expression ')'
    if (ctx.expression()) {
      const innerExpr = this.visit(ctx.expression());
      return `(${innerExpr})`;
    }

    // Case 2: Array access (e.g. Arr(1, 2))
    if (ctx.arrayStructure()) {
      return this.visit(ctx.arrayStructure());
    }

    // Case 3: Math / trig functions
    if (ctx.sinFunction()) return this.visit(ctx.sinFunction());
    if (ctx.cosFunction()) return this.visit(ctx.cosFunction());
    if (ctx.qsinFunction()) return this.visit(ctx.qsinFunction());
    if (ctx.qcosFunction()) return this.visit(ctx.qcosFunction());
    if (ctx.rndFunction()) return this.visit(ctx.rndFunction());

    // Case 4: Terminal literal (NUMBER, STRING, IDENTIFIER, HEX_NUMBER)
    return ctx.getText();
  }

  /**
   * Grammar Rule:
   * arrayStructure: IDENTIFIER '(' expression (',' expression)* ')'
   * Transpiles AMOS array accesses to JavaScript bracket notation with Math.trunc.
   */
  visitArrayStructure(ctx) {
    const arrayName = ctx.IDENTIFIER().getText();
    const expressions = ctx.expression();

    const formattedIndices = expressions
      .map((exprCtx) => `[Math.trunc(${this.visit(exprCtx)})]`)
      .join('');

    return `${arrayName}${formattedIndices}`;
  }

  /**
   * Grammar Rule:
   * sinFunction: 'Sin' '(' (NUMBER | IDENTIFIER | expression) ')'
   */
  visitSinFunction(ctx) {
    const arg = this._extractFunctionArg(ctx);
    return `Math.sin(${arg})`;
  }

  /**
   * Grammar Rule:
   * cosFunction: 'Cos' '(' (NUMBER | IDENTIFIER | expression) ')'
   */
  visitCosFunction(ctx) {
    const arg = this._extractFunctionArg(ctx);
    return `Math.cos(${arg})`;
  }

  /**
   * Grammar Rule:
   * qsinFunction: 'Qsin' '(' expression ',' expression ')'
   */
  visitQsinFunction(ctx) {
    const expressions = ctx.expression();
    const arg1 = this.visit(expressions[0]);
    const arg2 = this.visit(expressions[1]);
    return `Math.sin(${arg1}, ${arg2})`;
  }

  /**
   * Grammar Rule:
   * qcosFunction: 'Qcos' '(' expression ',' expression ')'
   */
  visitQcosFunction(ctx) {
    const expressions = ctx.expression();
    const arg1 = this.visit(expressions[0]);
    const arg2 = this.visit(expressions[1]);
    return `Math.cos(${arg1}, ${arg2})`;
  }

  /**
   * Grammar Rule:
   * rndFunction: 'Rnd' '(' (NUMBER | IDENTIFIER | expression) ')'
   */
  visitRndFunction(ctx) {
    const arg = this._extractFunctionArg(ctx);
    return `Math.floor(Math.random() * (${arg} + 1))`;
  }

  /**
   * Extracts the argument from math function rules that use
   * (NUMBER | IDENTIFIER | expression) — prefers `expression()` if present,
   * otherwise falls back to the raw token text (NUMBER or IDENTIFIER).
   */
  _extractFunctionArg(ctx) {
    if (ctx.expression()) {
      return this.visit(ctx.expression());
    }
    // Fallback for bare NUMBER or IDENTIFIER alternatives
    if (ctx.NUMBER()) return ctx.NUMBER().getText();
    if (ctx.IDENTIFIER()) return ctx.IDENTIFIER().getText();
    return ctx.getText();
  }
}
