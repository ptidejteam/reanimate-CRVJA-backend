import antlr4 from "antlr4";
import AmosTranslator from "./amos-translator.js";
import AMOSParser from "./grammar/generated/AMOSParser.js";
import AMOSLexer from "./grammar/generated/AMOSLexer.js";
import CollectingErrorListener from "./error-listener.js";


export default function transpileAmosToJS_v1_1_0(amosCode) {
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

  const translator = new AmosTranslator();
  const walker = new antlr4.tree.ParseTreeWalker();
  walker.walk(translator, tree);

  const translatedCode = translator.getJavaScript();

  const response = {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  };


  return response;
}
