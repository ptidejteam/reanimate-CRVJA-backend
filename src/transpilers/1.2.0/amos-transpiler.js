import antlr4 from 'antlr4';
import AmosTranslator from './amos-translator.js';
import AMOSParser from './grammar/generated/AMOSParser.js';
import AMOSLexer from './grammar/generated/AMOSLexer.js';
import AmosErrorListener from './amos-error-listener.js';
import prettier from 'prettier';

export default class AMOSTranspiler {
  async transpile(amosCode) {
    const chars = new antlr4.InputStream(amosCode);
    const lexer = new AMOSLexer(chars);

    const amosErrorListener = new AmosErrorListener();
    lexer.removeErrorListeners();
    lexer.addErrorListener(amosErrorListener);

    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new AMOSParser(tokens);

    parser.removeErrorListeners();
    parser.addErrorListener(amosErrorListener);

    const tree = parser.program();
    const { lexicalErrors, syntaxErrors } = amosErrorListener;

    const translator = new AmosTranslator();
    const walker = new antlr4.tree.ParseTreeWalker();
    walker.walk(translator, tree);

    const translatedCode = await prettier.format(translator.getJavaScript(), {
      parser: 'babel',
      singleQuote: true,
    });

    const response = {
      lexicalErrors: lexicalErrors,
      syntaxErrors: syntaxErrors,
      translatedCode: translatedCode,
    };

    return response;
  }
}
