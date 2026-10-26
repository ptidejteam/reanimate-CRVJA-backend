import antlr4 from 'antlr4';
import AMCAFLexer from './generated/AMCAFLexer.js';
import AMCAFParser from './generated/AMCAFParser.js';
import AMOSErrorListener from '../../core/amos-error-listener.js';
import { normalizeIdentifiers } from '../../grammar/normalize-identifiers.js';
import Amcaf from './amcaf.js';
import HandlerDispatcher, { getRuleName } from '../../core/handler-dispatcher.js';

export default class AmcafTranspiler {
  /** Recognizes one complete statement; rejected trials return null without emitting code. */
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
    normalizeIdentifiers(tree);
    return tree.getChild(0);
  }

  /** Reuses local handlers with the current program's shared translation context. */
  translate(node, context) {
    this.dispatcher ??= new HandlerDispatcher([new Amcaf(context)]);
    const handler = this.dispatcher.get('enter', node);
    if (!handler) throw new Error(`No AMCAF statement translator for ${getRuleName(node)}`);
    handler(node);
  }
}
