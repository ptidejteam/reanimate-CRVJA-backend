grammar AMOS;

// ============================================================================
// Parser rules
// ============================================================================
// Rules are grouped by the CATEGORY of the AMOS command (tracking spreadsheet /
// https://amospromanual.dev/99-appendix-g-command-index.html) and sorted A-Z by
// AMOS command name: the same order as in amos-translator.js and commands/.

// ---- Program ---------------------------------------------------------------

program:
    statement* EOF
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
    | procedureCall
    | variableAssignment
    | whileWend
    | waitKey
    | playSound
    | 'End'
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
    | blitterCopy
    | blitterFill
    | blitterClear
    | add
    | locate
    | turboDraw
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
    | label
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
    ;

// ---- Instructions ----------------------------------------------------------

// ADD
add:
    'Add' IDENTIFIER COMMA expression (COMMA expression TO expression)?
    ;

// AUTOBACK
autoback:
    'Autoback' NUMBER
    ;

// BAR
bar:
    BAR expression COMMA expression TO expression COMMA expression
    ;

// BOB OFF
bobOff:
    'Bob' 'Off'
    ;

// BOB UPDATE ON
bobUpdateOn:
    'Bob' 'Update' 'On'
    ;

// BOX
box:
    'Box' expression COMMA expression TO expression COMMA expression
    ;

// CIRCLE
circle:
    'Circle' expression COMMA expression COMMA expression
    ;

// CLEAR KEY
clearKey:
    'Clear' 'Key'
    ;

// CLOSE
closeFile:
    'Close' NUMBER
    ;

// CLS
cls:
    'Cls' (expression (COMMA expression COMMA expression TO expression COMMA expression)?)?
    ;

// CURS OFF
cursOff:
    CURS_OFF
    ;

// CURS ON
cursOn:
    CURS_ON
    ;

// DEGREE
degree:
    'Degree'
    ;

// DIM
arrayDeclaration:
    'Dim' arrayStructure (COMMA arrayStructure)*
    ;

// DOUBLE BUFFER
doubleBuffer:
    'Double' 'Buffer'
    ;

// FLASH OFF
flashOff:
    'Flash' 'Off'
    ;

// FLASH ON
flashOn:
    'Flash' 'On'
    ;

// HIDE
hide:
    'Hide' 'On'?
    ;

// INK
ink:
    INK expression
    ;

// KEY SPEED
keySpeed:
    'Key' 'Speed' NUMBER COMMA NUMBER
    ;

// LED OFF
ledOff:
    'LED' 'OFF'
    ;

// LOAD
loadBank:
    'Load' STRING (COMMA (IDENTIFIER | NUMBER))?
    ;

// LOAD IFF
loadIff:
    LOAD_IFF IDENTIFIER expression
    ;

// LOCATE
locate:
    'Locate' NUMBER COMMA? NUMBER?
    ;

// OPEN IN
openIn:
    'Open' 'In' NUMBER COMMA IDENTIFIER
    ;

// OPEN OUT
openOut:
    'Open' 'Out' NUMBER COMMA IDENTIFIER
    ;

// PALETTE
palette:
    'Palette' (HEX_NUMBER COMMA?)*
    ;

// PAPER
paper:
    'Paper' expression
    ;

// PEN
pen:
    'Pen' expression
    ;

// PLAY
playSound:
    PLAY (HEX_NUMBER NUMBER | expression | IDENTIFIER) COMMA NUMBER
    ;

// PRINT (and PRINT #)
printStatement:
    'Print' printItem ((COMMA | SEMICOLON) printItem)*?
    ;

printItem:
    expression
    | HASH NUMBER
    ;

// RAINBOW
rainbow:
    'Rainbow' (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA? (expression | NUMBER | STRING)? COMMA? (expression | NUMBER | STRING)?
    ;

// SAM BANK
samBank:
    'SAM' 'BANK' NUMBER
    ;

// SAM LOOP OFF
samLoopOff:
    'SAM' 'LOOP' 'OFF'
    ;

// SCREEN
chooseScreen:
    'Screen' NUMBER
    ;

// SCREEN OFFSET
screenOffset:
    'Screen' 'Offset' NUMBER COMMA NUMBER COMMA NUMBER
    ;

// SCREEN OPEN
screenOpen:
    SCREEN_OPEN NUMBER COMMA NUMBER COMMA NUMBER COMMA NUMBER COMMA (LOWRES | HIRES)
    ;

// SCREEN SWAP
screenSwap:
    'Screen' 'Swap'
    ;

// SET BUFFER
setBuffer:
    'Set' 'Buffer' NUMBER
    ;

// SET RAINBOW
setRainbow:
    'Set' 'Rainbow' (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING)? COMMA? (expression | NUMBER | STRING)?
    ;

// SPRITE
sprite:
    'Sprite' expression COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER)
    | 'Off'
    ;

// TEXT
text:
    TEXT expression COMMA expression COMMA (STRING | IDENTIFIER)
    ;

// WAIT
wait:
    'Wait' NUMBER
    ;

// WAIT KEY
waitKey:
    WAIT_KEY
    ;

// WAIT VBL
waitVbl:
    'Wait' 'Vbl'
    ;

// ---- Structures ------------------------------------------------------------

// DATA
dataStatement:
    'Data' expression (COMMA expression)*
    ;

// DO ... LOOP
doLoop:
    DO
    statement*
    LOOP
    ;

// ELSE
elseStatement:
    ELSE
    statement*
    END_IF
    ;

// FOR ... NEXT
forLoop:
    FOR IDENTIFIER '=' expression TO expression
    statement*
    (NEXT IDENTIFIER | NEXT)
    ;

// GLOBAL
global:
    'Global' (arrayStructure | IDENTIFIER) (COMMA (arrayStructure | IDENTIFIER))*?
    ;

// GOSUB
gosub:
    'Gosub' IDENTIFIER
    ;

// GOTO
gotoLabel:
    'Goto' IDENTIFIER
    ;

// IF ... END IF
ifStatement:
    (IF expression | IF readTarget) comparisonOperator expression (logicalOperator expression comparisonOperator expression)*
    statement*
    ('End' 'if' | elseStatement | END_IF)
    ;

comparisonOperator:
    '=' | '<>' | '>=' | '>' | '<=' | '<'
    ;

logicalOperator:
    OR | AND
    ;

// IF KEY STATE(...) ... END IF
ifKeyStateStatement:
    IF keyStateFunction
    statement*
    (elseStatement | END_IF)
    ;

// INPUT #
inputVariable:
    'Input' HASH NUMBER COMMA IDENTIFIER HEX_NUMBER?
    ;

// ON ... GOSUB
onGosub:
    'On' IDENTIFIER ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE 'Gosub' IDENTIFIER (COMMA IDENTIFIER)*
    ;

// PROC (procedure call)
procedureCall:
    IDENTIFIER SQUARE_BRACKET_OPEN expression (COMMA expression)* SQUARE_BRACKET_CLOSE
    | IDENTIFIER
    ;

// PROCEDURE ... END PROC
procedure:
    PROCEDURE IDENTIFIER (SQUARE_BRACKET_OPEN IDENTIFIER (COMMA IDENTIFIER)* SQUARE_BRACKET_CLOSE)?
    statement*
    END_PROC
    ;

// READ
readStatement:
    'Read' readTarget (COMMA readTarget)*
    ;

readTarget:
    arrayStructure
    | IDENTIFIER
    ;

// REPEAT ... UNTIL
repeatUntil:
    'Repeat'
    statement*
    'Until' 'Mouse' 'Key' '=' NUMBER
    ;

// WHILE ... WEND
whileWend:
    WHILE keyStateFunction
    statement*
    WEND
    ;

// ---- Not in the command index ----------------------------------------------

// Array assignment: A(1) = 2
arrayAssignment:
    arrayStructure '=' expression
    ;

// Label: MyLabel:
label:
    IDENTIFIER COLON
    ;

// Variable assignment: X = 1
variableAssignment:
    IDENTIFIER '=' (expression | btstFunction)
    ;

// ---- Functions -------------------------------------------------------------

// BTST
btstFunction:
    'Btst' ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// COS
cosFunction:
    'Cos' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE
    ;

// KEY STATE
keyStateFunction:
    KEY_STATE ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

// RND
rndFunction:
    'Rnd' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE
    ;

// SIN
sinFunction:
    'Sin' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE
    ;

// ---- AMCAF extension -------------------------------------------------------

// BLITTER CLEAR
blitterClear:
    'Blitter' 'Clear' NUMBER COMMA NUMBER (COMMA expression COMMA expression TO expression COMMA expression)?
    ;

// BLITTER COPY
blitterCopy:
    'Blitter' 'Copy' 'Limit'? NUMBER COMMA NUMBER TO NUMBER COMMA NUMBER
    ;

// BLITTER FILL
blitterFill:
    'Blitter' 'Fill' NUMBER COMMA NUMBER (COMMA expression COMMA expression COMMA expression COMMA expression)?
    ;

// QCOS
qcosFunction:
    'Qcos' ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// QSIN
qsinFunction:
    'Qsin' ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// TURBO DRAW
turboDraw:
    'Turbo' 'Draw' expression COMMA expression TO expression COMMA expression COMMA expression COMMA expression
    ;

// ---- Expressions -----------------------------------------------------------

value:
    expression
    ;

expression:
    term ((ADD | SUBTRACT) term)* NUMBER? // Handle addition and subtraction
    ;

term:
    SUBTRACT? factor ((MULTIPLY | DIVIDE) factor)* // Handle multiplication and division
    ;

factor:
    NUMBER                                                  // A number
    | STRING
    | arrayStructure
    | sinFunction
    | cosFunction
    | qsinFunction
    | qcosFunction
    | rndFunction
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
// Multi-word keywords are single tokens. Every keyword (and REM below) must stay
// above IDENTIFIER: on equal-length matches the lexer picks the first rule.

SCREEN_OPEN: 'Screen Open';
LOAD_IFF: 'Load Iff';
LOWRES: 'Lowres';
HIRES: 'Hires';
CURS_OFF: 'Curs Off';
CURS_ON: 'Curs On';
INK: 'Ink';
TEXT: 'Text';
BAR: 'Bar';
PLAY: 'Play';
DO: 'Do';
LOOP: 'Loop';
FOR: 'For';
TO: 'To';
NEXT: 'Next';
IF: 'If';
ELSE: 'Else';
END_IF: 'End If';
WHILE: 'While';
WEND: 'Wend';
PROCEDURE: 'Procedure';
END_PROC: 'End Proc';
WAIT_KEY: 'Wait Key';
KEY_STATE: 'Key State';
AND: [aA][nN][dD]; // case-insensitive: and, And, AND
OR: [oO][rR]; // case-insensitive: or, Or, OR

// ---- Comments --------------------------------------------------------------

COMMENT: '\'' ~[\n\r]* -> skip;
REM: 'Rem' ~[\n\r]* -> skip;

// ---- Literals and identifiers ----------------------------------------------

NUMBER: [0-9]+;
HEX_NUMBER: '$' [0-9A-Fa-f]+;
STRING: '"' (~["\r\n])* '"';
IDENTIFIER: [a-zA-Z_] [a-zA-Z_0-9]* '$'?;

// ---- Operators -------------------------------------------------------------

COMPARISON: '=' | '<>' | '>=' | '>' | '<=' | '<';
ADD: '+';
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

WS: [ \t\n\r]+ -> skip;
