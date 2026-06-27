import antlr4 from "antlr4";
import AmosTranslator from "#root/src/transpilers/transpiler_v2.0.0/AmosTranslator.js";
import AMOSParser from "#root/src/transpilers/transpiler_v2.0.0/grammar/generated/AMOSParser.js";
import AMOSLexer from "#root/src/transpilers/transpiler_v2.0.0/grammar/generated/AMOSLexer.js";
import CollectingErrorListener from "#root/src/transpilers/transpiler_v2.0.0/ErrorListener.js";

// import prettier from "prettier/standalone";
// import babelPlugin from "prettier/plugins/babel";
// import estreePlugin from "prettier/plugins/estree";

export default function transpileAmosToJS(amosCode) {
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
