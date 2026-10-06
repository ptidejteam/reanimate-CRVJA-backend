import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import antlr4, { CommonTokenStream } from 'antlr4';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';
import CollectingErrorListener from '#root/src/transpilers/2.0.0-beta/error-listener.js';
import AMOSParser from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSParser.js';
import AMOSAnalyser from './amos-analyser.js';
import AMOSCommandsCatalog from './amos-commands-catalog.js';

function findSourceFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSourceFiles(path));
    } else if (entry.isFile() && ['.asc', '.txt'].includes(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }

  return files;
}

function analyseFile(file, catalogRows) {
  const amosCode = readFileSync(file, 'utf8');
  // The analyser updates rows in place, so each file needs independent counts.
  const summaryTable = catalogRows.map(row => ({ ...row, COUNT: 0 }));

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

  // Walking the parsed program counts instruction tokens through visitTerminal.
  const amosAnalyser = new AMOSAnalyser(summaryTable);
  const walker = new antlr4.tree.ParseTreeWalker();
  walker.walk(amosAnalyser, tree);

  return amosAnalyser.summaryTable;
}

function main() {
  const { values } = parseArgs({
    options: { input: { type: 'string' } },
    allowPositionals: false,
  });
  if (values.input === '') {
    throw new Error('--input must specify a directory.');
  }

  const inputDirectory = values.input === undefined
    ? fileURLToPath(new URL('./datasets/', import.meta.url))
    : resolve(values.input);
  if (!statSync(inputDirectory).isDirectory()) {
    throw new Error(`Input must be a directory: ${inputDirectory}`);
  }

  const files = findSourceFiles(inputDirectory);
  if (files.length === 0) {
    console.log('No .asc or .txt files found.');
    return;
  }

  const amosCommandsCatalog = readFileSync(
    new URL('./resources/AMOS-COMMANDS-CATALOG.csv', import.meta.url),
    'utf8',
  );
  const amosCatalog = new AMOSCommandsCatalog(amosCommandsCatalog);

  for (const file of files) {
    const summaryTable = analyseFile(file, amosCatalog.AMOSCatalog);
    console.log(`File: ${relative(inputDirectory, file)}`);
    console.log(summaryTable);
    console.log(summaryTable.filter(command => command.COUNT > 0));
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
}
