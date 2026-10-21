// Generated from src/transpilers/2.0.0-beta/extensions/amcaf/AMCAF.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from 'antlr4';
import AMCAFListener from './AMCAFListener.js';
const serializedATN = [4,1,1,5,2,0,7,0,1,0,1,0,1,0,0,0,1,0,0,0,3,0,2,1,0,
0,0,2,3,5,1,0,0,3,1,1,0,0,0,0];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class AMCAFParser extends antlr4.Parser {

    static grammarFileName = "AMCAF.g4";
    static literalNames = [ null, "'amcaf'" ];
    static symbolicNames = [  ];
    static ruleNames = [ "amcaf" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = AMCAFParser.ruleNames;
        this.literalNames = AMCAFParser.literalNames;
        this.symbolicNames = AMCAFParser.symbolicNames;
    }



	amcaf() {
	    let localctx = new AmcafContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, AMCAFParser.RULE_amcaf);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 2;
	        this.match(AMCAFParser.T__0);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

AMCAFParser.EOF = antlr4.Token.EOF;
AMCAFParser.T__0 = 1;

AMCAFParser.RULE_amcaf = 0;

class AmcafContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = AMCAFParser.RULE_amcaf;
    }


	enterRule(listener) {
	    if(listener instanceof AMCAFListener ) {
	        listener.enterAmcaf(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof AMCAFListener ) {
	        listener.exitAmcaf(this);
		}
	}


}




AMCAFParser.AmcafContext = AmcafContext; 
