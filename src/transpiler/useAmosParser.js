import antlr4 from "antlr4";
import AmosTranspiler from "./AmosTranspiler.js";
import AMOSParser from "./grammar/generated/AMOSParser.js";
import AMOSLexer from "./grammar/generated/AMOSLexer.js";
// import prettier from "prettier/standalone";
// import babelPlugin from "prettier/plugins/babel";
// import estreePlugin from "prettier/plugins/estree";
import CollectingErrorListener from "./ErrorListener.js";

export default function useAMOSParser(amosCode) {
  const chars = new antlr4.InputStream(amosCode);
  const lexer = new AMOSLexer(chars);

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new AMOSParser(tokens);
  
  const tree = parser.program();

  const translator = new AmosTranspiler();
  const walker = new antlr4.tree.ParseTreeWalker();
  walker.walk(translator, tree);

  const translatedJsCode = translator.getJavaScript();

  return translatedJsCode;
}
