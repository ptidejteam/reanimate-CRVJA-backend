import fs, { readFileSync } from 'fs';
import antlr4, { CommonTokenStream } from 'antlr4';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';
import CollectingErrorListener from '#root/src/transpilers/2.0.0-beta/error-listener.js';
import AMOSParser from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSParser.js';
import AMOSAnalyser from './amos-analyser.js';

let amosCode = '';

try {
  amosCode = readFileSync(
    './datasets/example_dataset/1_cool_amos_project/graphics/colours.asc',
    'utf8',
  );
  console.log(amosCode);
} catch (err) {
  console.log(err);
}

const chars = new antlr4.InputStream(amosCode);
const lexer = new AMOSLexer(chars);

const lexicalErrors = new CollectingErrorListener();
lexer.removeErrorListeners();
lexer.addErrorListener(lexicalErrors);

const tokens = new CommonTokenStream(lexer);
const parser = new AMOSParser(tokens);

const syntaxErrors = new CollectingErrorListener();
parser.removeErrorListeners();
parser.addErrorListener(syntaxErrors);

const tree = parser.program();

const amosAnalyser = new AMOSAnalyser();
const walker = new antlr4.tree.ParseTreeWalker();
walker.walk(amosAnalyser, tree);

console.log(amosAnalyser);
