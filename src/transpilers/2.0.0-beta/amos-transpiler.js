import antlr4 from 'antlr4';
import AmosTranslator from './amos-translator.js';
import AMOSParser from './grammar/generated/AMOSParser.js';
import AMOSLexer from './grammar/generated/AMOSLexer.js';
import CollectingErrorListener from './error-listener.js';
import prettier from 'prettier';

export default class AMOSTranspiler {
  async transpile(amosCode) {
    const chars = new antlr4.InputStream(amosCode);
    const lexer = new AMOSLexer(chars);

    const lexicalErrors = new CollectingErrorListener();
    lexer.removeErrorListeners();
    lexer.addErrorListener(lexicalErrors);

    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new AMOSParser(tokens);

    const syntaxErrors = new CollectingErrorListener();
    parser.removeErrorListeners();
    parser.addErrorListener(syntaxErrors);

    const tree = parser.program();

    if (lexicalErrors.errors.length || syntaxErrors.errors.length) {
      return {
        lexicalErrors,
        syntaxErrors,
        translatedCode: '',
      };
    }

    // A float variable (A#) is not a valid JavaScript name: rename it A_f. The commands read
    // names from these tokens, so they all get the JavaScript name.
    for (const token of tokens.tokens) {
      if (token.type === AMOSLexer.IDENTIFIER && token.text.endsWith('#')) {
        token.text = `${token.text.slice(0, -1)}_f`;
      }
    }

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
