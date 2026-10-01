import { readFileSync } from 'fs';
import antlr4, { CommonTokenStream } from 'antlr4';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';
import CollectingErrorListener from '#root/src/transpilers/2.0.0-beta/error-listener.js';
import AMOSParser from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSParser.js';
import AMOSAnalyser from './amos-analyser.js';
import AMOSCommandsCatalog from './amos-commands-catalog.js';

let amosCode = '';
let amosCommandsCatalog = '';
const amosCodeFile = './datasets/example_dataset/1_cool_amos_project/graphics/colours.asc';
const amosCatalogFile = './resources/AMOS-COMMANDS-CATALOG.csv';

try {
  amosCommandsCatalog = readFileSync(amosCatalogFile, 'utf8');
} catch (err) {
  console.log(err);
}

const amosCatalog = new AMOSCommandsCatalog(amosCommandsCatalog);

try {
  amosCode = readFileSync(
    amosCodeFile,
    'utf8',
  );
} catch (err) {
  console.log(err);
}


let summaryTable = amosCatalog.AMOSCatalog
summaryTable.forEach(obj => obj.COUNT = 0);
// console.log(summaryTable);


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

const amosAnalyser = new AMOSAnalyser(summaryTable);
const walker = new antlr4.tree.ParseTreeWalker();
walker.walk(amosAnalyser, tree);

summaryTable = amosAnalyser.summaryTable


console.log(summaryTable);
console.log(summaryTable.filter((command) => command.COUNT > 0))