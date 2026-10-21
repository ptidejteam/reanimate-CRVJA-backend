grammar CRVJA;

import AMOS, AMCAF;

statement:
    coreStatement
    | amcafStatement
    ;

factor:
    coreFactor
    | amcafFunction
    ;
