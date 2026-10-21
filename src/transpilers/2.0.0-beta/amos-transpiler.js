import antlr4 from 'antlr4';
import AMOSTranslator from './amos-translator.js';
import AMOSParser from './grammar/generated/AMOSParser.js';
import AMOSLexer from './grammar/generated/AMOSLexer.js';
import AMOSErrorListener from './amos-error-listener.js';
import prettier from 'prettier';

import AMCAFParser from './extensions/amcaf/AMCAFParser.js'
import AMCAFLexer from './extensions/amcaf/AMCAFLexer.js';
import AMCAFTranslator from './extensions/amcaf/AMCAFTranslator.js'

export default class AMOSTranspiler {
  async transpile(amosCode) {
    // Begin of PoC AMCAF extension

    const amcafChars = new antlr4.InputStream(amosCode);
    const amcafLexer = new AMCAFLexer(amcafChars);
    const amcafTokens = new antlr4.CommonTokenStream(amcafLexer);
    const amcafParser = new AMCAFParser(amcafTokens)
    const amcafTree = amcafParser.amcaf();


    const amcafTranslator = new AMCAFTranslator();
    const amcafWalker = new antlr4.tree.ParseTreeWalker();
    amcafWalker.walk(amcafTranslator, amcafTree);


    // End of PoC AMCAF extension

    const chars = new antlr4.InputStream(amosCode);
    const lexer = new AMOSLexer(chars);

    const amosErrorListener = new AMOSErrorListener();
    lexer.removeErrorListeners();
    lexer.addErrorListener(amosErrorListener);

    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new AMOSParser(tokens);

    parser.removeErrorListeners();
    parser.addErrorListener(amosErrorListener);

    const tree = parser.program();
    const { lexicalErrors, syntaxErrors } = amosErrorListener;

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

    const translator = new AMOSTranslator();
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
