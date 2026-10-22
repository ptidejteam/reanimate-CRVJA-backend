import antlr4 from 'antlr4';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';

function tokens(code) {
  const lexer = new AMOSLexer(new antlr4.InputStream(code));
  return lexer.getAllTokens().map((token) => {
    const name = AMOSLexer.symbolicNames[token.type];
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
  ['Curs Offset', ['IDENTIFIER Curs', 'IDENTIFIER Offset']],
  ['Wait Key', ['WAIT_KEY Wait Key']],
  ['Wait Keyboard', ['WAIT Wait', 'IDENTIFIER Keyboard']],
  ['sCrEeN sWaPped', ['SCREEN sCrEeN', 'IDENTIFIER sWaPped']],
  ['Remember', ['IDENTIFIER Remember']],
  ['reminder$', ['IDENTIFIER reminder$']],
  ['REM#', ['IDENTIFIER REM#']],
  ['rem a comment', []],
  ['rEm', []],
])('%j is lexed as %j', (code, expected) => {
  expect(tokens(code)).toEqual(expected);
});
