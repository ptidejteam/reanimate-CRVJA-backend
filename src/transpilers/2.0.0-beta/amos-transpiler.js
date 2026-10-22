import antlr4 from 'antlr4';
import AMOSTranslator from './core/amos-translator.js';
import TranslationContext from './core/translation-context.js';
import ExpressionTranslator from './core/expression-translator.js';
import HandlerDispatcher from './core/handler-dispatcher.js';
import Instructions from './commands/instructions.js';
import Structures from './commands/structures.js';
import Functions from './commands/functions.js';
import AMOSParser from './grammar/generated/AMOSParser.js';
import AMOSLexer from './grammar/generated/AMOSLexer.js';
import AMOSErrorListener from './core/amos-error-listener.js';
import prettier from 'prettier';
import ExtensionLoader from './extensions/extension-loader.js';
import ExtensionStatements from './extensions/statements.js';
import ExtensionTokenSource from './extensions/extension-token-source.js';
import { normalizeIdentifiers } from './grammar/normalize-identifiers.js';

export default class AMOSTranspiler {
  constructor({ extensionsDirectory } = {}) {
    this.extensionsDirectory = extensionsDirectory;
  }

  async transpile(amosCode) {
    const extensions = await new ExtensionLoader(this.extensionsDirectory).loadExtensions();
    const prepared = new ExtensionStatements(amosCode, extensions).prepareStatements();
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

    normalizeIdentifiers(tree);

    const dispatcher = new HandlerDispatcher();
    const expressions = new ExpressionTranslator(dispatcher);
    const context = new TranslationContext(expressions);
    dispatcher.register([
      new Instructions(context),
      new Structures(context),
      new Functions(context),
    ]);
    const translator = new AMOSTranslator(context, dispatcher);
    const walker = new antlr4.tree.ParseTreeWalker();
    walker.walk(translator, tree);

    const translatedCode = await prettier.format(context.getJavaScript(), {
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
