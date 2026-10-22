import antlr4 from 'antlr4';
import AMCAFLexer from './generated/AMCAFLexer.js';
import AMCAFParser from './generated/AMCAFParser.js';
import AMOSErrorListener from '../../amos-error-listener.js';
import { normalizeFloatIdentifiers } from '../../grammar/normalize-float-identifiers.js';
import Amcaf from './amcaf.js';

export default class AmcafTranspiler {
  parse(source) {
    const lexer = new AMCAFLexer(new antlr4.InputStream(source));
    const diagnostics = new AMOSErrorListener(source);
    lexer.removeErrorListeners();
    lexer.addErrorListener(diagnostics);
    const tokens = new antlr4.CommonTokenStream(lexer);
    tokens.fill();
    const parser = new AMCAFParser(tokens);
    parser.removeErrorListeners();
    parser.addErrorListener(diagnostics);

    // The entry rule ends with EOF. Default recovery may return a tree, but any
    // diagnostic rejects the attempt; failed trials never reach the translator.
    const tree = parser.amcafStatement();
    if (diagnostics.lexicalErrors.errors.length || diagnostics.syntaxErrors.errors.length)
      return null;
    normalizeFloatIdentifiers(tokens.tokens, AMCAFLexer);
    return tree.getChild(0);
  }

  translate(node, host) {
    this.translator ??= new Amcaf(host);
    this.translator.emitStatement(node);
  }
}
