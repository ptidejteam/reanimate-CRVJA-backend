import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import antlr4, { CommonTokenStream } from 'antlr4';
import AMOSLexer from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSLexer.js';
import CollectingErrorListener from '#root/src/transpilers/2.0.0-beta/error-listener.js';
import AMOSParser from '#root/src/transpilers/2.0.0-beta/grammar/generated/AMOSParser.js';
import AMOSAnalyser from './amos-analyser.js';
import AMOSCommandsCatalog from './amos-commands-catalog.js';
import { findDatasetFiles } from './amos-input.js';
import { serializeCsv } from './amos-csv.js';
import { aggregateRows } from './amos-aggregate.js';

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
    ? fileURLToPath(new URL('./datasets/example_dataset/', import.meta.url))
    : resolve(values.input);
  if (!statSync(inputDirectory).isDirectory()) {
    throw new Error(`Input must be a directory: ${inputDirectory}`);
  }

  const amosCommandsCatalog = readFileSync(
    new URL('./resources/AMOS-COMMANDS-CATALOG.csv', import.meta.url),
    'utf8',
  );
  const amosCatalog = new AMOSCommandsCatalog(amosCommandsCatalog);

  const rows = [];
  for (const file of findDatasetFiles(inputDirectory)) {
    const summaryTable = analyseFile(file.absolutePath, amosCatalog.AMOSCatalog);
    for (const command of summaryTable) {
      if (command.COUNT > 0) {
        rows.push({ ...command, PROJECT: file.project, FILE_PATH: file.filePath });
      }
    }
  }

  // Complete analysis and serialization before replacing the previous reports.
  const analysisCsv = serializeCsv(rows);
  const aggregateCsv = serializeCsv(aggregateRows(rows), [
    'COMMAND', 'CATEGORY', 'TOTAL_COUNT', 'PROJECT_COUNT', 'FILE_COUNT',
  ]);
  const outputDirectory = fileURLToPath(new URL('./output/', import.meta.url));
  const analysisFile = join(outputDirectory, 'analysis.csv');
  const aggregateFile = join(outputDirectory, 'aggregate.csv');
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(analysisFile, analysisCsv, 'utf8');
  writeFileSync(aggregateFile, aggregateCsv, 'utf8');
  console.log(`Saved CSV: ${analysisFile}`);
  console.log(`Saved CSV: ${aggregateFile}`);
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
}
