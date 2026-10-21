grammar AMCAF;
import AMOS;

amcafStatement:
    blitterClear
    | blitterCopy
    | blitterFill
    | turboDraw
    ;

amcafFunction:
    qcosFunction
    | qsinFunction
    ;

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
