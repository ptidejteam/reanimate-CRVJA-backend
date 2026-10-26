grammar AMOS;

options { caseInsensitive = true; }

// Supplied by the extension statement bridge, never matched by the AMOS lexer.
tokens { EXTENSION_STATEMENT }

// ============================================================================
// Parser rules
// ============================================================================
// Rules are grouped by the CATEGORY of the AMOS command (tracking spreadsheet /
// https://amospromanual.dev/99-appendix-g-command-index.html) and sorted A-Z by
// AMOS command name: the same order as in commands/.

// ---- Program ---------------------------------------------------------------

program:
    statementList EOF
    ;

// ifThenStatement (THEN) is listed here and not in `statement:`: see THEN.
statementList:
    (statement | ifThenStatement | NEWLINE)*
    ;

// The order of the alternatives matters: ANTLR resolves ambiguities in favour
// of the alternative listed first.
statement:
    procedure
    | screenOpen
    | cursOff
    | arrayAssignment
    | cursOn
    | ink
    | text
    | doLoop
    | forLoop
    | ifKeyStateStatement
    | ifStatement
    | bar
    | label // A name followed by a colon is a label, before the bare-call alternative.
    | procedureCall
    | variableAssignment
    | whileWend
    | waitKey
    | playSound
    | END
    | COLON
    | arrayDeclaration
    | printStatement
    | flashOff
    | flashOn
    | hide
    | degree
    | paper
    | cls
    | palette
    | pen
    | doubleBuffer
    | autoback
    | add
    | locate
    | global
    | setBuffer
    | repeatUntil
    | btstFunction
    | openOut
    | closeFile
    | openIn
    | inputVariable
    | loadBank
    | sprite
    | ledOff
    | samBank
    | samLoopOff
    | keySpeed
    | setRainbow
    | rainbow
    | bobOff
    | clearKey
    | bobUpdateOn
    | gosub
    | gotoLabel
    | screenOffset
    | chooseScreen
    | onGosub
    | dataStatement
    | readStatement
    | box
    | circle
    | waitVbl
    | wait
    | screenSwap
    | exitLoop
    | plot
    | dec
    | inc
    | defFn
    | exitIf
    | swap
    | colour
    | colourBack
    | draw
    | drawTo
    | ellipse
    | sort
    | extensionStatement
    ;

extensionStatement:
    EXTENSION_STATEMENT
    ;

// ---- Instructions ----------------------------------------------------------

// ADD
add:
    ADD IDENTIFIER COMMA expression (COMMA expression TO expression)?
    ;

// AUTOBACK
autoback:
    AUTOBACK NUMBER
    ;

// BAR
bar:
    BAR expression COMMA expression TO expression COMMA expression
    ;

// BOB OFF
bobOff:
    BOB_OFF
    ;

// BOB UPDATE ON
bobUpdateOn:
    BOB_UPDATE_ON
    ;

// BOX
box:
    BOX expression COMMA expression TO expression COMMA expression
    ;

// CIRCLE
circle:
    CIRCLE expression COMMA expression COMMA expression
    ;

// CLEAR KEY
clearKey:
    CLEAR_KEY
    ;

// CLOSE
closeFile:
    CLOSE NUMBER
    ;

// CLS
cls:
    CLS (expression (COMMA expression COMMA expression TO expression COMMA expression)?)?
    ;

// COLOUR
colour:
    COLOUR expression COMMA expression
    ;

// COLOUR BACK
// Colour Back $RGB, or Colour Back (number) for the colour of an existing index.
colourBack:
    COLOUR_BACK expression
    ;

// CURS OFF
cursOff:
    CURS_OFF
    ;

// CURS ON
cursOn:
    CURS_ON
    ;

// DEC
dec:
    DEC IDENTIFIER
    ;

// DEGREE
degree:
    DEGREE
    ;

// DIM
arrayDeclaration:
    DIM arrayStructure (COMMA arrayStructure)*
    ;

// DOUBLE BUFFER
doubleBuffer:
    DOUBLE_BUFFER
    ;

// DRAW
draw:
    DRAW expression COMMA expression TO expression COMMA expression
    ;

// DRAW TO
drawTo:
    DRAW_TO expression COMMA expression
    ;

// ELLIPSE
ellipse:
    ELLIPSE expression COMMA expression COMMA expression COMMA expression
    ;

// FLASH OFF
flashOff:
    FLASH_OFF
    ;

// FLASH ON
flashOn:
    FLASH_ON
    ;

// HIDE
hide:
    HIDE ON?
    ;

// INC
inc:
    INC IDENTIFIER
    ;

// INK
ink:
    INK expression
    ;

// KEY SPEED
keySpeed:
    KEY_SPEED NUMBER COMMA NUMBER
    ;

// LED OFF
ledOff:
    LED_OFF
    ;

// LOAD
loadBank:
    LOAD STRING (COMMA (IDENTIFIER | NUMBER))?
    ;

// LOAD IFF
// TODO: not in `statement:` yet (`Load Iff` is a syntax error) and not translated. The manual's
// syntax is `Load Iff "filename"[,screen number]`. amos-code-analysis tests parse from this rule.
loadIff:
    LOAD_IFF IDENTIFIER expression
    ;

// LOCATE
locate:
    LOCATE NUMBER COMMA? NUMBER?
    ;

// OPEN IN
openIn:
    OPEN_IN NUMBER COMMA IDENTIFIER
    ;

// OPEN OUT
openOut:
    OPEN_OUT NUMBER COMMA IDENTIFIER
    ;

// PALETTE
palette:
    PALETTE (HEX_NUMBER COMMA?)*
    ;

// PAPER
paper:
    PAPER expression
    ;

// PEN
pen:
    PEN expression
    ;

// PLAY
playSound:
    PLAY expression COMMA NUMBER
    ;

// PLOT
plot:
    PLOT expression COMMA expression
    ;

// PRINT (and PRINT #)
printStatement:
    PRINT printItem ((COMMA | SEMICOLON) printItem)*?
    ;

printItem:
    expression
    | HASH NUMBER
    ;

// RAINBOW
rainbow:
    RAINBOW expression COMMA expression COMMA expression COMMA expression
    ;

// SAM BANK
samBank:
    SAM_BANK NUMBER
    ;

// SAM LOOP OFF
samLoopOff:
    SAM_LOOP_OFF
    ;

// SCREEN
chooseScreen:
    SCREEN NUMBER
    ;

// SCREEN OFFSET
screenOffset:
    SCREEN_OFFSET NUMBER COMMA NUMBER COMMA NUMBER
    ;

// SCREEN OPEN
screenOpen:
    SCREEN_OPEN NUMBER COMMA NUMBER COMMA NUMBER COMMA NUMBER COMMA (LOWRES | HIRES)
    ;

// SCREEN SWAP
screenSwap:
    SCREEN_SWAP
    ;

// SET BUFFER
setBuffer:
    SET_BUFFER NUMBER
    ;

// SET RAINBOW
setRainbow:
    SET_RAINBOW expression COMMA expression COMMA expression COMMA expression COMMA expression COMMA expression
    ;

// SORT
sort:
    SORT arrayStructure
    ;

// SPRITE
sprite:
    SPRITE expression COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER)
    | OFF
    ;

// TEXT
text:
    TEXT expression COMMA expression COMMA (STRING | IDENTIFIER)
    ;

// WAIT
wait:
    WAIT NUMBER
    ;

// WAIT KEY
waitKey:
    WAIT_KEY
    ;

// WAIT VBL
waitVbl:
    WAIT_VBL
    ;

// ---- Structures ------------------------------------------------------------

// DATA
dataStatement:
    DATA expression (COMMA expression)*
    ;

// DEF FN
defFn:
    DEF_FN IDENTIFIER ROUND_BRACKET_OPEN IDENTIFIER (COMMA IDENTIFIER)* ROUND_BRACKET_CLOSE EQUAL expression
    ;

// DO ... LOOP
doLoop:
    DO
    statementList
    LOOP
    ;

// ELSE
elseStatement:
    ELSE
    statementList
    END_IF
    ;

// ELSE IF
elseIfStatement:
    ELSE_IF condition
    statementList
    ;

// EXIT
exitLoop:
    EXIT NUMBER?
    ;

// EXIT IF
exitIf:
    EXIT_IF condition (COMMA NUMBER)?
    ;

// FN
// FN is a Structure, but it returns a value, so it is listed in `factor:`.
fnCall:
    FN IDENTIFIER ROUND_BRACKET_OPEN expression (COMMA expression)* ROUND_BRACKET_CLOSE
    ;

// FOR ... NEXT (and STEP)
forLoop:
    FOR IDENTIFIER EQUAL expression TO expression (STEP expression)?
    statementList
    (NEXT IDENTIFIER | NEXT)
    ;

// GLOBAL
global:
    GLOBAL (arrayStructure | IDENTIFIER) (COMMA (arrayStructure | IDENTIFIER))*?
    ;

// GOSUB
gosub:
    GOSUB IDENTIFIER
    ;

// GOTO
gotoLabel:
    GOTO IDENTIFIER
    ;

// IF ... END IF
ifStatement:
    IF expression comparisonOperator expression (logicalOperator expression comparisonOperator expression)*
    statementList
    elseIfStatement*
    (elseStatement | END_IF)
    ;

comparisonOperator:
    EQUAL | NOT_EQUAL | GREATER_EQUAL | GREATER | LESS_EQUAL | LESS
    ;

logicalOperator:
    OR | AND
    ;

// Condition of ELSE IF, EXIT IF and THEN: the conditions that IF ... END IF and IF KEY STATE accept.
condition:
    expression comparisonOperator expression (logicalOperator expression comparisonOperator expression)*
    | keyStateFunction
    ;

// IF KEY STATE(...) ... END IF
ifKeyStateStatement:
    IF keyStateFunction
    statementList
    elseIfStatement*
    (elseStatement | END_IF)
    ;

// INPUT #
inputVariable:
    INPUT HASH NUMBER COMMA IDENTIFIER HEX_NUMBER?
    ;

// LINE INPUT #
lineInputFile:
    LINE_INPUT HASH expression COMMA readTarget (COMMA readTarget)*
    ;

// NOT
// NOT is a Structure, but it returns a value, so it is listed in `factor:`. It applies to the
// operand that follows it (`Not X+1` is `(Not X)+1`), like a unary minus.
notOperator:
    NOT SUBTRACT? factor
    ;

// ON BREAK PROC
onBreakProc:
    ON_BREAK_PROC IDENTIFIER
    ;

// ON ERROR
onError:
    ON_ERROR (GOTO (IDENTIFIER | NUMBER))?
    ;

// ON ERROR PROC
onErrorProc:
    ON_ERROR_PROC IDENTIFIER
    ;

// ON ... GOSUB
onGosub:
    ON IDENTIFIER ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE GOSUB IDENTIFIER (COMMA IDENTIFIER)*
    ;

// ON ... PROC
onProc:
    ON IDENTIFIER PROC IDENTIFIER (COMMA IDENTIFIER)*
    ;

// POP PROC
popProc:
    POP_PROC
    ;

// PROC (procedure call)
procedureCall:
    IDENTIFIER SQUARE_BRACKET_OPEN expression (COMMA expression)* SQUARE_BRACKET_CLOSE
    // A following colon belongs to a label, rather than a bare call + separator.
    | { this._input.LA(2) !== this.constructor.COLON }? IDENTIFIER
    ;

// PROCEDURE ... END PROC
procedure:
    PROCEDURE IDENTIFIER (SQUARE_BRACKET_OPEN IDENTIFIER (COMMA IDENTIFIER)* SQUARE_BRACKET_CLOSE)?
    statementList
    END_PROC
    ;

// READ
readStatement:
    READ readTarget (COMMA readTarget)*
    ;

readTarget:
    arrayStructure
    | IDENTIFIER
    ;

// REPEAT ... UNTIL
repeatUntil:
    REPEAT
    statementList
    UNTIL MOUSE_KEY EQUAL NUMBER
    ;

// RESTORE
restore:
    RESTORE expression
    ;

// RESUME
resume:
    RESUME (NEXT | IDENTIFIER | NUMBER)?
    ;

// RESUME LABEL
resumeLabel:
    RESUME_LABEL IDENTIFIER?
    ;

// SHARED
shared:
    SHARED sharedItem (COMMA sharedItem)*
    ;

sharedItem:
    IDENTIFIER (ROUND_BRACKET_OPEN ROUND_BRACKET_CLOSE)?
    | STRING
    ;

// SWAP
swap:
    SWAP IDENTIFIER COMMA IDENTIFIER
    ;

// THEN
// Single-line If: If condition Then statements [Else statements], all on one line. It is listed
// in `statementList:` and not in `statement:`, so the statements of a Then can't be another
// single-line If: it would take the end of the line, and this Then would go on to the next line.
ifThenStatement:
    IF condition THEN statement+ ifThenElse? (NEWLINE | EOF)
    ;

ifThenElse:
    ELSE statement+
    ;

// WHILE ... WEND
whileWend:
    WHILE keyStateFunction
    statementList
    WEND
    ;

// ---- Not in the command index ----------------------------------------------

// Array assignment: A(1) = 2
arrayAssignment:
    arrayStructure EQUAL expression
    ;

// Label: MyLabel:
label:
    IDENTIFIER COLON
    ;

// Variable assignment: X = 1
variableAssignment:
    IDENTIFIER EQUAL (expression | btstFunction)
    ;

// ---- Functions -------------------------------------------------------------

// ABS
absFunction:
    ABS ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// ACOS
acosFunction:
    ACOS ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// ASIN
asinFunction:
    ASIN ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// ATAN
atanFunction:
    ATAN ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// BTST
btstFunction:
    BTST ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// COLOUR
colourFunction:
    COLOUR ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// COS
cosFunction:
    COS ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// EXP
expFunction:
    EXP ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// FALSE
falseFunction:
    FALSE
    ;

// HCOS
hcosFunction:
    HCOS ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// HSIN
hsinFunction:
    HSIN ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// HTAN
htanFunction:
    HTAN ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// INT
intFunction:
    INT ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// KEY STATE
keyStateFunction:
    KEY_STATE ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// LN
lnFunction:
    LN ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// LOG
logFunction:
    LOG ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// MAX
maxFunction:
    MAX ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// MIN
minFunction:
    MIN ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// PI#
piFunction:
    PI
    ;

// RND
rndFunction:
    RND ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// SIN
sinFunction:
    SIN ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// SQR
sqrFunction:
    SQR ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// TRUE
trueFunction:
    TRUE
    ;

// ---- Expressions -----------------------------------------------------------

expression:
    term ((PLUS | SUBTRACT) term)* // Handle addition and subtraction
    ;

term:
    SUBTRACT? factor ((MULTIPLY | DIVIDE) factor)* // Handle multiplication and division
    ;

factor:
    NUMBER                                                  // A number
    | STRING
    | arrayStructure
    | absFunction
    | acosFunction
    | asinFunction
    | atanFunction
    | colourFunction
    | cosFunction
    | expFunction
    | falseFunction
    | fnCall
    | hcosFunction
    | hsinFunction
    | htanFunction
    | intFunction
    | lnFunction
    | logFunction
    | maxFunction
    | minFunction
    | notOperator
    | piFunction
    | rndFunction
    | sinFunction
    | sqrFunction
    | trueFunction
    | IDENTIFIER                                            // A variable
    | ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE     // Parentheses for grouping
    | HEX_NUMBER
    ;

arrayStructure:
    IDENTIFIER ROUND_BRACKET_OPEN expression (COMMA expression)* ROUND_BRACKET_CLOSE
    ;

// ============================================================================
// Lexer rules
// ============================================================================

// ---- Keywords --------------------------------------------------------------
// Parser rules use named tokens only. Keywords are UPPER_SNAKE_CASE, sorted A-Z,
// and precede IDENTIFIER so equal-length matches prefer the keyword.
// Fixed multi-word commands are one token, separated by HSPACE (never a newline).
// Their trailing boundary prevents prefixes such as Resume Labelled from matching
// RESUME_LABEL. One-word keywords rely on the longer IDENTIFIER match instead.
// caseInsensitive changes matching only: token text and string contents stay intact.

ABS: 'Abs';
ACOS: 'Acos';
ADD: 'Add';
AND: 'And';
ASIN: 'Asin';
ATAN: 'Atan';
AUTOBACK: 'Autoback';
BAR: 'Bar';
BOB_OFF: 'Bob' HSPACE 'Off' KEYWORD_BOUNDARY;
BOB_UPDATE_ON: 'Bob' HSPACE 'Update' HSPACE 'On' KEYWORD_BOUNDARY;
BOX: 'Box';
BTST: 'Btst';
CIRCLE: 'Circle';
CLEAR_KEY: 'Clear' HSPACE 'Key' KEYWORD_BOUNDARY;
CLOSE: 'Close';
CLS: 'Cls';
COLOUR: 'Colour';
COLOUR_BACK: 'Colour' HSPACE 'Back' KEYWORD_BOUNDARY;
COS: 'Cos';
CURS_OFF: 'Curs' HSPACE 'Off' KEYWORD_BOUNDARY;
CURS_ON: 'Curs' HSPACE 'On' KEYWORD_BOUNDARY;
DATA: 'Data';
DEC: 'Dec';
DEF_FN: 'Def' HSPACE 'Fn' KEYWORD_BOUNDARY;
DEGREE: 'Degree';
DIM: 'Dim';
DO: 'Do';
DOUBLE_BUFFER: 'Double' HSPACE 'Buffer' KEYWORD_BOUNDARY;
DRAW: 'Draw';
DRAW_TO: 'Draw' HSPACE 'To' KEYWORD_BOUNDARY;
ELLIPSE: 'Ellipse';
ELSE: 'Else';
ELSE_IF: 'Else' HSPACE 'If' KEYWORD_BOUNDARY;
END: 'End';
END_IF: 'End' HSPACE 'If' KEYWORD_BOUNDARY;
END_PROC: 'End' HSPACE 'Proc' KEYWORD_BOUNDARY;
EXIT: 'Exit';
EXIT_IF: 'Exit' HSPACE 'If' KEYWORD_BOUNDARY;
EXP: 'Exp';
FALSE: 'False';
FLASH_OFF: 'Flash' HSPACE 'Off' KEYWORD_BOUNDARY;
FLASH_ON: 'Flash' HSPACE 'On' KEYWORD_BOUNDARY;
FN: 'Fn';
FOR: 'For';
GLOBAL: 'Global';
GOSUB: 'Gosub';
GOTO: 'Goto';
HCOS: 'Hcos';
HIDE: 'Hide';
HIRES: 'Hires';
HSIN: 'Hsin';
HTAN: 'Htan';
IF: 'If';
INC: 'Inc';
INK: 'Ink';
INPUT: 'Input';
INT: 'Int';
KEY_SPEED: 'Key' HSPACE 'Speed' KEYWORD_BOUNDARY;
KEY_STATE: 'Key' HSPACE 'State' KEYWORD_BOUNDARY;
LED_OFF: 'LED' HSPACE 'OFF' KEYWORD_BOUNDARY;
LINE_INPUT: 'Line' HSPACE 'Input' FILE_CHANNEL_BOUNDARY;
LN: 'Ln';
LOAD: 'Load';
LOAD_IFF: 'Load' HSPACE 'Iff' KEYWORD_BOUNDARY;
LOCATE: 'Locate';
LOG: 'Log';
LOOP: 'Loop';
LOWRES: 'Lowres';
MAX: 'Max';
MIN: 'Min';
MOUSE_KEY: 'Mouse' HSPACE 'Key' KEYWORD_BOUNDARY;
NEXT: 'Next';
NOT: 'Not';
OFF: 'Off';
ON: 'On';
ON_BREAK_PROC: 'On' HSPACE 'Break' HSPACE 'Proc' KEYWORD_BOUNDARY;
ON_ERROR: 'On' HSPACE 'Error' KEYWORD_BOUNDARY;
ON_ERROR_PROC: 'On' HSPACE 'Error' HSPACE 'Proc' KEYWORD_BOUNDARY;
OPEN_IN: 'Open' HSPACE 'In' KEYWORD_BOUNDARY;
OPEN_OUT: 'Open' HSPACE 'Out' KEYWORD_BOUNDARY;
OR: 'Or';
PALETTE: 'Palette';
PAPER: 'Paper';
PEN: 'Pen';
PI: 'Pi#';
PLAY: 'Play';
PLOT: 'Plot';
POP_PROC: 'Pop' HSPACE 'Proc' KEYWORD_BOUNDARY;
PRINT: 'Print';
PROC: 'Proc';
PROCEDURE: 'Procedure';
RAINBOW: 'Rainbow';
READ: 'Read';
REPEAT: 'Repeat';
RESTORE: 'Restore';
RESUME: 'Resume';
RESUME_LABEL: 'Resume' HSPACE 'Label' KEYWORD_BOUNDARY;
RND: 'Rnd';
SAM_BANK: 'SAM' HSPACE 'BANK' KEYWORD_BOUNDARY;
SAM_LOOP_OFF: 'SAM' HSPACE 'LOOP' HSPACE 'OFF' KEYWORD_BOUNDARY;
SCREEN: 'Screen';
SCREEN_OFFSET: 'Screen' HSPACE 'Offset' KEYWORD_BOUNDARY;
SCREEN_OPEN: 'Screen' HSPACE 'Open' KEYWORD_BOUNDARY;
SCREEN_SWAP: 'Screen' HSPACE 'Swap' KEYWORD_BOUNDARY;
SET_BUFFER: 'Set' HSPACE 'Buffer' KEYWORD_BOUNDARY;
SET_RAINBOW: 'Set' HSPACE 'Rainbow' KEYWORD_BOUNDARY;
SHARED: 'Shared';
SIN: 'Sin';
SORT: 'Sort';
SPRITE: 'Sprite';
SQR: 'Sqr';
STEP: 'Step';
SWAP: 'Swap';
TEXT: 'Text';
THEN: 'Then';
TO: 'To';
TRUE: 'True';
UNTIL: 'Until';
WAIT: 'Wait';
WAIT_KEY: 'Wait' HSPACE 'Key' KEYWORD_BOUNDARY;
WAIT_VBL: 'Wait' HSPACE 'Vbl' KEYWORD_BOUNDARY;
WEND: 'Wend';
WHILE: 'While';

// Fragments are reusable grammar pieces, not tokens. These inspect the next
// character without consuming it; each boundary check is defined only once.
fragment KEYWORD_BOUNDARY:
    { !/[a-zA-Z_0-9$#]/.test(String.fromCharCode(this._input.LA(1))) }?
    ;

// LINE INPUT allows # immediately after its name: Line Input#1,A$.
fragment FILE_CHANNEL_BOUNDARY:
    { !/[a-zA-Z_0-9$]/.test(String.fromCharCode(this._input.LA(1))) }?
    ;

// ---- Comments --------------------------------------------------------------

COMMENT: '\'' ~[\n\r]* -> skip;
REM: 'Rem' KEYWORD_BOUNDARY ~[\n\r]* -> skip;

// ---- Literals and identifiers ----------------------------------------------

NUMBER: [0-9]+ ('.' [0-9]+)?; // 42 or 3.14
HEX_NUMBER: '$' [0-9a-f]+;
STRING: '"' (~["\r\n])* '"';
IDENTIFIER: [a-z_] [a-z_0-9]* [$#]?; // A, A$ (string) or A# (float)

// ---- Operators -------------------------------------------------------------

EQUAL: '=';
NOT_EQUAL: '<>';
GREATER_EQUAL: '>=';
GREATER: '>';
LESS_EQUAL: '<=';
LESS: '<';
PLUS: '+';
SUBTRACT: '-';
MULTIPLY: '*';
DIVIDE: '/';

// ---- Punctuation -----------------------------------------------------------

COMMA: ',';
COLON: ':';
SEMICOLON: ';';
DOT: '.';
HASH: '#';
PERCENT: '%';
QUESTION: '?';
ROUND_BRACKET_OPEN: '(';
ROUND_BRACKET_CLOSE: ')';
SQUARE_BRACKET_OPEN: '[';
SQUARE_BRACKET_CLOSE: ']';
CURLY_BRACKET_OPEN: '{';
CURLY_BRACKET_CLOSE: '}';

// ---- Whitespace ------------------------------------------------------------

NEWLINE:
    '\r\n'
    | '\n'
    | '\r'
    ;

fragment HSPACE:
    [ \t]+
    ;

WS:
    HSPACE -> skip
    ;
