grammar AMOS;

// ============================================================================
// Parser rules
// ============================================================================

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

// ---- Procedures, variables and jumps ---------------------------------------

procedure:
    PROCEDURE IDENTIFIER (SQUARE_BRACKET_OPEN IDENTIFIER (COMMA IDENTIFIER)* SQUARE_BRACKET_CLOSE)?
    statement*
    END_PROC
    ;

procedureCall:
    IDENTIFIER SQUARE_BRACKET_OPEN expression (COMMA expression)* SQUARE_BRACKET_CLOSE
    | IDENTIFIER
    ;

global:
    'Global' (arrayStructure | IDENTIFIER) (COMMA (arrayStructure | IDENTIFIER))*?
    ;

variableAssignment:
    IDENTIFIER '=' (expression | btstFunction)
    ;

add:
    'Add' IDENTIFIER COMMA expression (COMMA expression TO expression)?
    ;

label:
    IDENTIFIER COLON
    ;

gosub:
    'Gosub' IDENTIFIER
    ;

gotoLabel:
    'Goto' IDENTIFIER
    ;

onGosub:
    'On' IDENTIFIER ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE 'Gosub' IDENTIFIER (COMMA IDENTIFIER)*
    ;

// ---- Control flow ----------------------------------------------------------

ifStatement:
    (IF expression | IF readTarget) comparisonOperator expression (logicalOperator expression comparisonOperator expression)*
    statement*
    ('End' 'if' | elseStatement | END_IF)
    ;

ifKeyStateStatement:
    IF keyStateFunction
    statement*
    (elseStatement | END_IF)
    ;

elseStatement:
    ELSE
    statement*
    END_IF
    ;

comparisonOperator:
    '=' | '<>' | '>=' | '>' | '<=' | '<'
    ;

logicalOperator:
    OR | AND
    ;

forLoop:
    FOR IDENTIFIER '=' expression TO expression
    statement*
    (NEXT IDENTIFIER | NEXT)
    ;

doLoop:
    DO
    statement*
    LOOP
    ;

whileWend:
    WHILE keyStateFunction
    statement*
    WEND
    ;

repeatUntil:
    'Repeat'
    statement*
    'Until' 'Mouse' 'Key' '=' NUMBER
    ;

wait:
    'Wait' NUMBER
    ;

waitKey:
    WAIT_KEY
    ;

waitVbl:
    'Wait' 'Vbl'
    ;

// ---- Screen ----------------------------------------------------------------

screenOpen:
    SCREEN_OPEN NUMBER COMMA NUMBER COMMA NUMBER COMMA NUMBER COMMA (LOWRES | HIRES)
    ;

chooseScreen:
    'Screen' NUMBER
    ;

screenOffset:
    'Screen' 'Offset' NUMBER COMMA NUMBER COMMA NUMBER
    ;

screenSwap:
    'Screen' 'Swap'
    ;

doubleBuffer:
    'Double' 'Buffer'
    ;

autoback:
    'Autoback' NUMBER
    ;

setBuffer:
    'Set' 'Buffer' NUMBER
    ;

loadIff:
    LOAD_IFF IDENTIFIER expression
    ;

cls:
    'Cls' (expression (COMMA expression COMMA expression TO expression COMMA expression)?)?
    ;

cursOff:
    CURS_OFF
    ;

cursOn:
    CURS_ON
    ;

palette:
    'Palette' (HEX_NUMBER COMMA?)*
    ;

ink:
    INK expression
    ;

pen:
    'Pen' expression
    ;

paper:
    'Paper' expression
    ;

flashOff:
    'Flash' 'Off'
    ;

flashOn:
    'Flash' 'On'
    ;

setRainbow:
    'Set' 'Rainbow' (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING)? COMMA? (expression | NUMBER | STRING)?
    ;

rainbow:
    'Rainbow' (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA (expression | NUMBER | STRING) COMMA? (expression | NUMBER | STRING)? COMMA? (expression | NUMBER | STRING)?
    ;

// ---- Drawing, sprites and bobs ---------------------------------------------

bar:
    BAR expression COMMA expression TO expression COMMA expression
    ;

box:
    'Box' expression COMMA expression TO expression COMMA expression
    ;

circle:
    'Circle' expression COMMA expression COMMA expression
    ;

text:
    TEXT expression COMMA expression COMMA (STRING | IDENTIFIER)
    ;

locate:
    'Locate' NUMBER COMMA? NUMBER?
    ;

turboDraw:
    'Turbo' 'Draw' expression COMMA expression TO expression COMMA expression COMMA expression COMMA expression
    ;

blitterCopy:
    'Blitter' 'Copy' 'Limit'? NUMBER COMMA NUMBER TO NUMBER COMMA NUMBER
    ;

blitterFill:
    'Blitter' 'Fill' NUMBER COMMA NUMBER (COMMA expression COMMA expression COMMA expression COMMA expression)?
    ;

blitterClear:
    'Blitter' 'Clear' NUMBER COMMA NUMBER (COMMA expression COMMA expression TO expression COMMA expression)?
    ;

loadBank:
    'Load' STRING (COMMA (IDENTIFIER | NUMBER))?
    ;

sprite:
    'Sprite' expression COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER)
    | 'Off'
    ;

bobOff:
    'Bob' 'Off'
    ;

bobUpdateOn:
    'Bob' 'Update' 'On'
    ;

// ---- Sound -----------------------------------------------------------------

playSound:
    PLAY (HEX_NUMBER NUMBER | expression | IDENTIFIER) COMMA NUMBER
    ;

samBank:
    'SAM' 'BANK' NUMBER
    ;

samLoopOff:
    'SAM' 'LOOP' 'OFF'
    ;

ledOff:
    'LED' 'OFF'
    ;

// ---- Keyboard and mouse ----------------------------------------------------

keySpeed:
    'Key' 'Speed' NUMBER COMMA NUMBER
    ;

clearKey:
    'Clear' 'Key'
    ;

hide:
    'Hide' 'On'?
    ;

// ---- Data, arrays and file I/O ---------------------------------------------

arrayDeclaration:
    'Dim' arrayStructure (COMMA arrayStructure)*
    ;

arrayAssignment:
    arrayStructure '=' expression
    ;

dataStatement:
    'Data' expression (COMMA expression)*
    ;

readStatement:
    'Read' readTarget (COMMA readTarget)*
    ;

readTarget:
    arrayStructure
    | IDENTIFIER
    ;

printStatement:
    'Print' printItem ((COMMA | SEMICOLON) printItem)*?
    ;

printItem:
    expression
    | HASH NUMBER
    ;

openOut:
    'Open' 'Out' NUMBER COMMA IDENTIFIER
    ;

openIn:
    'Open' 'In' NUMBER COMMA IDENTIFIER
    ;

closeFile:
    'Close' NUMBER
    ;

inputVariable:
    'Input' HASH NUMBER COMMA IDENTIFIER HEX_NUMBER?
    ;

// ---- Expressions and math --------------------------------------------------

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

sinFunction:
    'Sin' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE
    ;

cosFunction:
    'Cos' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE
    ;

qsinFunction:
    'Qsin' ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

qcosFunction:
    'Qcos' ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

rndFunction:
    'Rnd' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression) ROUND_BRACKET_CLOSE
    ;

btstFunction:
    'Btst' ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

keyStateFunction:
    KEY_STATE ROUND_BRACKET_OPEN expression ROUND_BRACKET_CLOSE
    ;

degree:
    'Degree'
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
