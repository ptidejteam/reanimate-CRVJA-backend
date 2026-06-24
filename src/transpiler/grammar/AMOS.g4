grammar AMOS;

// Lexer rules
SCREENOPEN: 'Screen Open';

LOADIFF: 'Load Iff';

NUMBER: [0-9]+;
LOWRES: 'Lowres';
HIRES: 'Hires';

COMMA: ',';
COMMENT: '\'' ~[\n\r]* -> skip;
REM: 'Rem' ~[\n\r]* -> skip;
WS: [ \t\n\r]+ -> skip;
CURSOFF: 'Curs Off';
CURSON: 'Curs On';
INK: 'Ink';
TEXT: 'Text';
STRING: '"' (~["\r\n])* '"';

DO: 'Do';
LOOP: 'Loop';
FOR: 'For';
TO: 'To';
NEXT: 'Next';
IF: 'If';
ELSE: 'Else';
ENDIF: 'End If';
WHILE: 'While';
WEND: 'Wend';
PLAY: 'Play';
PROC: 'Procedure';
ENDPROC: 'End Proc';
BAR: 'Bar';
WAITKEY: 'Wait Key';
KEYSTATE: 'Key State';
IDENTIFIER: [a-zA-Z_] [a-zA-Z_0-9]* '$'?;
COMPARISON: '=' | '<>' | '>=' | '>' | '<=' | '<';
ROUND_BRACKET_OPEN: '(';
ROUND_BRACKET_CLOSE: ')';
SQUARE_BRACKET_OPEN: '[';
SQUARE_BRACKET_CLOSE: ']';
CURLY_BRACKET_OPEN: '{';
CURLY_BRACKET_CLOSE: '}';
HEX_NUMBER: '$' [0-9A-Fa-f]+;

// Operators for arithmetic
MULTIPLY: '*';
DIVIDE: '/';
ADD: '+';
SUBTRACT: '-';
STATEMENT_SEPARATOR: ':';
FINISH_AND_ADD_OTHER_STATEMENT: ';';
DOT: '.';
HASHTAG: '#';
PERCENT: '%';
QUESTION: '?';

// Expression captures more complex expressions
expression2:
    term ((ADD | SUBTRACT) term)* // Handle addition and subtraction
    ;

expression1:
    term ((ADD | SUBTRACT) term)* NUMBER? // Handle addition and subtraction
    ;

term:
    SUBTRACT? factor ((MULTIPLY | DIVIDE) factor)* // Handle multiplication and division
    ;

factor:
    NUMBER                     // A number
    | STRING
    | array_structure
    | sin_function
    | cos_function
    | qsin_function
    | qcos_function
    | rndFunction
    | IDENTIFIER                // A variable
    | '(' expression1 ')'        // Parentheses for grouping
    | HEX_NUMBER
    ;

// Parser rules

program:
    (statement)* EOF
    ;

statement:
    procedure
    | screen_open
    | curs_off
    | array_update
    | curs_on
    | ink
    | text
    | do_loop
    | for_loop
    | if_statement_key_state
    | if_statement
    | bar
    | procedure_call
    | variable_starter
    | while_wend
    | wait_key_break
    | play_sound
    | 'End'
    | STATEMENT_SEPARATOR
    | array_create
    | print_something
    | flash_off
    | flash_on
    | hide
    | degree
    | paper
    | cls
    | palette
    | pen
    | double_buffer
    | autoback
    | blitter_copy
    | blitter_fill
    | blitter_clear
    | add
    | locate
    | turbo_draw
    | global
    | set_buffer
    | repeat_key
    | btst
    | open_out_readfile
    | close_file
    | open_in_writefile
    | input_variable
    | loadBank
    | loadBankImgToSprite
    | led_off
    | sam_bank
    | sam_loop
    | key_speed
    | label_title
    | set_rainbow
    | use_rainbow
    | bob_off
    | clear_key
    | bob_update_on
    | gosub
    | goto_label
    | screen_offset
    | choose_Screen
    | on_gosub
    | data_statement
    | read_statement
    | box
    | circle
    | wait_vbl
    | wait_key
    | screen_swap
    ;

rndFunction:
    'Rnd' '(' expression1 ')'
    ;

screen_swap:
    'Screen' 'Swap'
    ;

wait_vbl:
    'Wait' 'Vbl'
    ;

wait_key:
    'Wait' NUMBER
    ;

box:
    'Box' expression1 COMMA expression1 'To' expression1 COMMA expression1
    ;

circle:
    'Circle' expression1 COMMA expression1 COMMA expression1
    ;

on_gosub:
    'On' IDENTIFIER ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression1) ROUND_BRACKET_CLOSE 'Gosub' IDENTIFIER (COMMA IDENTIFIER)*
    ;

screen_offset:
    'Screen' 'Offset' NUMBER COMMA NUMBER COMMA NUMBER
    ;

choose_Screen:
    'Screen' NUMBER
    ;

data_statement:
    'Data' expression1 (COMMA expression1)*
    ;

read_statement:
    'Read' read_target (COMMA read_target)*
    ;

read_target:
    array_structure
    | IDENTIFIER
    ;

goto_label:
    'Goto' IDENTIFIER
    ;

gosub:
    'Gosub' IDENTIFIER
    ;

bob_update_on:
    'Bob' 'Update' 'On'
    ;

clear_key:
    'Clear' 'Key'
    ;

bob_off:
    'Bob' 'Off'
    ;

value:
    expression1
    ;

set_rainbow:
    'Set' 'Rainbow' (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING)? COMMA? (expression1 | NUMBER | STRING)?
    ;

use_rainbow:
    'Rainbow' (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING) COMMA (expression1 | NUMBER | STRING) COMMA? (expression1 | NUMBER | STRING)? COMMA? (expression1 | NUMBER | STRING)?
    ;

label_title:
    IDENTIFIER ':'
    ;

key_speed:
    'Key' 'Speed' NUMBER COMMA NUMBER
    ;

sam_loop:
    'SAM' 'LOOP' 'OFF'
    ;

sam_bank:
    'SAM' 'BANK' NUMBER
    ;

led_off:
    'LED' 'OFF'
    ;

loadBank:
    'Load' STRING (COMMA (IDENTIFIER | NUMBER))?
    ;

loadBankImgToSprite:
    'Sprite' expression1 COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER) COMMA (IDENTIFIER | NUMBER) | 'Off'
    ;

expressions_comparators:
    '=' | '<>' | '>=' | '>' | '<=' | '<'
    ;

or_and:
    'or' | 'and'
    ;

//if_then:
//    IF expression1 expressions_comparators? expression2 (or_and expression1 expressions_comparators expression2)? 'then' statement
//    ;

open_out_readfile:
    'Open' 'Out' NUMBER COMMA IDENTIFIER
    ;

open_in_writefile:
    'Open' 'In' NUMBER COMMA IDENTIFIER
    ;

close_file:
    'Close' NUMBER
    ;

input_variable:
    'Input' HASHTAG NUMBER COMMA IDENTIFIER HEX_NUMBER?
    ;

btst:
    'Btst' ROUND_BRACKET_OPEN expression1 COMMA expression1 ROUND_BRACKET_CLOSE
    ;

repeat_key:
    'Repeat'
    (statement)*
    'Until' 'Mouse' 'Key' '=' NUMBER
    ;

set_buffer:
    'Set' 'Buffer' NUMBER
    ;

global:
    'Global' (array_structure | IDENTIFIER) (COMMA (array_structure | IDENTIFIER))*?
    ;

turbo_draw:
    'Turbo' 'Draw' expression1 COMMA expression1 'To' expression1 COMMA expression1 COMMA expression1 COMMA expression1
    ;

locate:
    'Locate' NUMBER COMMA? NUMBER?
    ;

add:
    'Add' IDENTIFIER COMMA expression1 (COMMA expression1 'To' expression1)?
    ;

blitter_copy:
    'Blitter' 'Copy' 'Limit'? NUMBER COMMA NUMBER 'To' NUMBER COMMA NUMBER
    ;

blitter_fill:
    'Blitter' 'Fill' NUMBER COMMA NUMBER (COMMA expression1 COMMA expression1 COMMA expression1 COMMA expression1)?
    ;

blitter_clear:
    'Blitter' 'Clear' NUMBER COMMA NUMBER (COMMA expression1 COMMA expression1 'To' expression1 COMMA expression1)?
    ;

autoback:
    'Autoback' NUMBER
    ;

palette:
    'Palette' (HEX_NUMBER COMMA?)*
    ;

double_buffer:
    'Double' 'Buffer'
    ;

pen:
    'Pen' expression1
    ;

cls:
    'Cls' (expression1 (COMMA expression1 COMMA expression1 'To' expression1 COMMA expression1)?)?
    ;

paper:
    'Paper' expression1
    ;

degree:
    'Degree'
    ;

hide:
    'Hide' 'On'?
    ;

flash_off:
    'Flash' 'Off'
    ;

flash_on:
    'Flash' 'On'
    ;

sin_function:
    'Sin' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression1) ROUND_BRACKET_CLOSE
    ;

cos_function:
    'Cos' ROUND_BRACKET_OPEN (NUMBER | IDENTIFIER | expression1) ROUND_BRACKET_CLOSE
    ;

qsin_function:
    'Qsin' ROUND_BRACKET_OPEN expression1 COMMA expression1 ROUND_BRACKET_CLOSE
    ;

qcos_function:
    'Qcos' ROUND_BRACKET_OPEN expression1 COMMA expression1 ROUND_BRACKET_CLOSE
    ;

play_sound:
    'Play' ((HEX_NUMBER NUMBER) | expression1 | IDENTIFIER) COMMA NUMBER
    ;

wait_key_break:
    WAITKEY
    ;

variable_starter:
    IDENTIFIER '=' (expression1 | btst) // Now captures only variable assignments
    ;

procedure_call:
    IDENTIFIER SQUARE_BRACKET_OPEN expression1 (COMMA expression1)* SQUARE_BRACKET_CLOSE
    | IDENTIFIER
    ;

array_structure:
    IDENTIFIER ROUND_BRACKET_OPEN expression1 (COMMA expression1)* ROUND_BRACKET_CLOSE
    ;

array_create:
    'Dim' array_structure (COMMA array_structure)*
    ;

array_update:
    array_structure '=' expression1
    ;

screen_open:
    SCREENOPEN NUMBER COMMA NUMBER COMMA NUMBER COMMA NUMBER COMMA (LOWRES | HIRES)
    ;

load_iff:
    LOADIFF IDENTIFIER expression1
    ;

curs_off:
    CURSOFF
    ;

curs_on:
    CURSON
    ;

ink:
    INK expression1
    ;

text:
    TEXT expression1 COMMA expression1 COMMA (STRING | IDENTIFIER)
    ;

do_loop:
    DO
    (statement)*
    LOOP
    ;

while_wend:
    WHILE current_Key_State
    (statement)*
    WEND
    ;

for_loop:
    FOR IDENTIFIER '=' expression1 TO expression1
    (statement)*
    (NEXT IDENTIFIER | NEXT)
    ;

if_statement:
    (IF expression1 | IF read_target) expressions_comparators expression2 (or_and expression1 expressions_comparators expression2)?
    (statement)*
    (('End' 'if') | else_statement | ENDIF)
    ;

else_statement:
    ELSE
    (statement)*
    ENDIF
    ;

if_statement_key_state:
    IF current_Key_State
    (statement)*
    (else_statement | ENDIF)
    ;

bar:
    BAR expression1 COMMA expression2 'To' expression1 COMMA expression2
    ;

procedure:
    PROC IDENTIFIER (SQUARE_BRACKET_OPEN IDENTIFIER (COMMA IDENTIFIER)* SQUARE_BRACKET_CLOSE)?
    (statement)*
    ENDPROC
    ;

current_Key_State:
    KEYSTATE ROUND_BRACKET_OPEN expression1 ROUND_BRACKET_CLOSE
    ;

print_options:
    expression1
    | HASHTAG NUMBER
    ;

print_something:
    'Print' print_options ((COMMA | FINISH_AND_ADD_OTHER_STATEMENT) print_options)*?
    ;
