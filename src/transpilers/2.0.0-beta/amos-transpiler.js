import antlr4 from 'antlr4';
import AMOSTranslator from './amos-translator.js';
import AMOSParser from './grammar/generated/AMOSParser.js';
import AMOSLexer from './grammar/generated/AMOSLexer.js';
import AMOSErrorListener from './amos-error-listener.js';
import prettier from 'prettier';
import ExtensionLoader from './extensions/extension-loader.js';
import ExtensionStatements from './extensions/statements.js';
import ExtensionTokenSource from './extensions/extension-token-source.js';
import { normalizeFloatIdentifiers } from './grammar/normalize-float-identifiers.js';

export default class AMOSTranspiler {
  constructor({ extensionsDirectory } = {}) {
    this.extensionsDirectory = extensionsDirectory;
  }

  async transpile(amosCode) {
    const extensions = await new ExtensionLoader(this.extensionsDirectory).load();
    const prepared = new ExtensionStatements(amosCode, extensions).prepare();
    const chars = new antlr4.InputStream(prepared.source);
    const lexer = new AMOSLexer(chars);

    const amosErrorListener = new AMOSErrorListener(amosCode);
    lexer.removeErrorListeners();
    lexer.addErrorListener(amosErrorListener);

    const tokens = new antlr4.CommonTokenStream(
      new ExtensionTokenSource(lexer, prepared.statements, amosCode),
    );
    tokens.fill();
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

    normalizeFloatIdentifiers(tokens.tokens, AMOSLexer);

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
