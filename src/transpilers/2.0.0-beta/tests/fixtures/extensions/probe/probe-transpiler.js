// Test-only mini-transpiler: handwritten command syntax plus AMOS expressions.
import antlr4 from 'antlr4';
import AMOSLexer from '../../../../grammar/generated/AMOSLexer.js';
import AMOSParser from '../../../../grammar/generated/AMOSParser.js';
import AMOSErrorListener from '../../../../amos-error-listener.js';
import { normalizeFloatIdentifiers } from '../../../../grammar/normalize-float-identifiers.js';

export default class ProbeTranspiler {
  runtimeSource = 'function recordProbe(id, value) { globalThis.probeTrace.push([id, value]); }';
  sequence = 0;

  parse(source) {
    const head = /^Probe[ \t]+Trace[ \t]+@[ \t]*/.exec(source);
    if (!head) return null;
    const expression = source.slice(head[0].length);
    const diagnostics = new AMOSErrorListener(expression);
    const lexer = new AMOSLexer(new antlr4.InputStream(expression));
    lexer.removeErrorListeners();
    lexer.addErrorListener(diagnostics);
    const tokens = new antlr4.CommonTokenStream(lexer);
    tokens.fill();
    const parser = new AMOSParser(tokens);
    parser.removeErrorListeners();
    parser.addErrorListener(diagnostics);
    const node = parser.expression();
    if (
      diagnostics.lexicalErrors.errors.length ||
      diagnostics.syntaxErrors.errors.length ||
      tokens.LA(1) !== antlr4.Token.EOF
    )
      return null;
    normalizeFloatIdentifiers(tokens.tokens, AMOSLexer);
    return node;
  }

  translate(node, host) {
    host.output += `recordProbe(${this.sequence++}, ${host.handleExpression(node)});\n`;
  }
}
