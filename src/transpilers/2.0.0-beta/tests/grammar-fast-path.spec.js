import antlr4 from 'antlr4';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';
import AMOSParser from '../grammar/generated/AMOSParser.js';

// When grammar rules overlap (an alternative that `expression` already covers, or an optional
// comma between two arguments), ANTLR falls back to a much slower "full-context" prediction,
// even in other statements (see Pitfalls in TRANSPILER.md). Common statements must not need it.
test.each([
  'Dim A(9)\nX=A(1)',
  'X=Y-1',
  'X=Sin(5)',
  'If X>1\nY=1\nEnd If',
  'If X=1\nY=1\nElse If X=2\nY=2\nEnd If',
  'If X=1\nY=1\nElse If Key State($45)\nY=2\nEnd If',
  'If Key State($45)\nY=1\nElse If X=2\nY=2\nEnd If',
  'Play X,2',
  'Rainbow 1,2,3,4',
  'X#=Y#*2.5',
])('%j parses without full-context prediction', (code) => {
  const parser = new AMOSParser(
    new antlr4.CommonTokenStream(new AMOSLexer(new antlr4.InputStream(code))),
  );
  const errors = [];
  const slowRules = [];
  parser.removeErrorListeners();
  parser.addErrorListener({
    syntaxError: (recognizer, symbol, line, column, msg) => errors.push(msg),
    reportAttemptingFullContext: (recognizer, dfa) =>
      slowRules.push(parser.ruleNames[dfa.atnStartState.ruleIndex]),
    reportAmbiguity: () => {},
    reportContextSensitivity: () => {},
  });

  parser.program();

  expect(errors).toEqual([]);
  expect(slowRules).toEqual([]);
});
