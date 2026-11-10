grammar AMCAF;

options { caseInsensitive = true; }

import AMOS;

amcafStatement:
    (blitterClear | turboDraw) EOF
    ;

amcafFunction:
    qcosFunction
    | qsinFunction
    ;

// BLITTER CLEAR
blitterClear:
    BLITTER_CLEAR NUMBER COMMA NUMBER COMMA expression COMMA expression TO expression COMMA expression
    ;

// BLITTER COPY
blitterCopy:
    BLITTER_COPY LIMIT? NUMBER COMMA NUMBER TO NUMBER COMMA NUMBER
    ;

// BLITTER FILL
blitterFill:
    BLITTER_FILL NUMBER COMMA NUMBER (COMMA expression COMMA expression COMMA expression COMMA expression)?
    ;

// QCOS
qcosFunction:
    QCOS ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// QSIN
qsinFunction:
    QSIN ROUND_BRACKET_OPEN expression COMMA expression ROUND_BRACKET_CLOSE
    ;

// TURBO DRAW
turboDraw:
    TURBO_DRAW expression COMMA expression TO expression COMMA expression COMMA expression COMMA expression
    ;

// Same token convention as AMOS; HSPACE and boundaries come from the import.
BLITTER_CLEAR: 'Blitter' HSPACE 'Clear' KEYWORD_BOUNDARY;
BLITTER_COPY: 'Blitter' HSPACE 'Copy' KEYWORD_BOUNDARY;
BLITTER_FILL: 'Blitter' HSPACE 'Fill' KEYWORD_BOUNDARY;
LIMIT: 'Limit';
QCOS: 'Qcos';
QSIN: 'Qsin';
TURBO_DRAW: 'Turbo' HSPACE 'Draw' KEYWORD_BOUNDARY;
