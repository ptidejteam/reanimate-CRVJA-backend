import antlr4 from 'antlr4';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';

// Keywords written only as literals in parser rules ('Wait') have no symbolic name
function tokens(code) {
  const lexer = new AMOSLexer(new antlr4.InputStream(code));
  return lexer.getAllTokens().map((token) => {
    const name = AMOSLexer.symbolicNames[token.type] ?? AMOSLexer.literalNames[token.type];
    return `${name} ${token.text}`;
  });
}

// A multi-word keyword only matches when the next character can't continue a name
// (see KEYWORD_BOUNDARY in AMOS.g4): otherwise the lexer falls back to shorter tokens.
test.each([
  ['Resume Label', ['RESUME_LABEL Resume Label']],
  ['Resume Label MyLabel', ['RESUME_LABEL Resume Label', 'IDENTIFIER MyLabel']],
  ['Resume Labelled', ['RESUME Resume', 'IDENTIFIER Labelled']],
  ['Resume Label$', ['RESUME Resume', 'IDENTIFIER Label$']],
  ['On Error Proc P', ['ON_ERROR_PROC On Error Proc', 'IDENTIFIER P']],
  ['On Error Procs', ['ON_ERROR On Error', 'IDENTIFIER Procs']],
  ['Line Input#1', ['LINE_INPUT Line Input', 'HASH #', 'NUMBER 1']],
  ['Else If', ['ELSE_IF Else If']],
  ['Else Ifx', ['ELSE Else', 'IDENTIFIER Ifx']],
  ['Curs Off', ['CURS_OFF Curs Off']],
  ['Curs Offset', ['IDENTIFIER Curs', "'Offset' Offset"]],
  ['Wait Key', ['WAIT_KEY Wait Key']],
  ['Wait Keyboard', ["'Wait' Wait", 'IDENTIFIER Keyboard']],
])('%j is lexed as %j', (code, expected) => {
  expect(tokens(code)).toEqual(expected);
});
