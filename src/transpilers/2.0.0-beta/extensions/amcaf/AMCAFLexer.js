// Generated from src/transpilers/2.0.0-beta/extensions/amcaf/AMCAF.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from 'antlr4';


const serializedATN = [4,0,1,9,6,-1,2,0,7,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,
1,1,1,1,0,0,8,0,1,1,0,0,0,1,3,1,0,0,0,3,4,5,97,0,0,4,5,5,109,0,0,5,6,5,99,
0,0,6,7,5,97,0,0,7,8,5,102,0,0,8,2,1,0,0,0,1,0,0];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

export default class AMCAFLexer extends antlr4.Lexer {

    static grammarFileName = "AMCAF.g4";
    static channelNames = [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ];
	static modeNames = [ "DEFAULT_MODE" ];
	static literalNames = [ null, "'amcaf'" ];
	static symbolicNames = [  ];
	static ruleNames = [ "T__0" ];

    constructor(input) {
        super(input)
        this._interp = new antlr4.atn.LexerATNSimulator(this, atn, decisionsToDFA, new antlr4.atn.PredictionContextCache());
    }
}

AMCAFLexer.EOF = antlr4.Token.EOF;
AMCAFLexer.T__0 = 1;



