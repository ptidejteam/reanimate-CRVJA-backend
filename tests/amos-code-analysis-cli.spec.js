import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  renameSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../amos-code-analysis/main.js', import.meta.url));
const outputDirectory = join(dirname(script), 'output');
const outputFile = join(outputDirectory, 'analysis.csv');
const aggregateFile = join(outputDirectory, 'aggregate.csv');
const header = 'COMMAND,CATEGORY,COUNT,PROJECT,FILE_PATH\n';
const aggregateHeader = 'COMMAND,CATEGORY,TOTAL_COUNT,PROJECT_COUNT,FILE_COUNT\n';

describe('AMOS dataset analysis and CSV output', () => {
  let suiteDirectory;
  let directory;
  let outputIsolated = false;

  beforeAll(() => {
    suiteDirectory = mkdtempSync(join(tmpdir(), 'amos-analysis-tests-'));
    // Preserve the entire existing output directory while the CLI tests run.
    if (existsSync(outputDirectory)) {
      renameSync(outputDirectory, join(suiteDirectory, 'original-output'));
    }
    outputIsolated = true;
  });

  afterAll(() => {
    if (outputIsolated) {
      rmSync(outputDirectory, { recursive: true, force: true });
      const backup = join(suiteDirectory, 'original-output');
      if (existsSync(backup)) renameSync(backup, outputDirectory);
    }
    rmSync(suiteDirectory, { recursive: true, force: true });
  });

  beforeEach(() => {
    directory = mkdtempSync(join(suiteDirectory, 'dataset-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function fixture(path, contents = 'Curs Off\n') {
    const file = join(directory, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
    return file;
  }

  function run(args = [], cwd = directory) {
    const result = spawnSync(process.execPath, [script, ...args], {
      cwd,
      encoding: 'utf8',
      timeout: 10000,
    });
    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    return result;
  }

  function report() {
    return readFileSync(outputFile, 'utf8');
  }

  function aggregateReport() {
    return readFileSync(aggregateFile, 'utf8');
  }

  function expectSuccess(result) {
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(`Saved CSV: ${outputFile}\nSaved CSV: ${aggregateFile}\n`);
  }

  function existingReport() {
    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(outputFile, 'previous report\n');
    writeFileSync(aggregateFile, 'previous aggregate\n');
  }

  function expectFailure(result) {
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/^Error: /);
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
    expect(report()).toBe('previous report\n');
    expect(aggregateReport()).toBe('previous aggregate\n');
  }

  test('creates the output directory and both CSVs', () => {
    expect(existsSync(outputDirectory)).toBe(false);
    fixture('project/program.asc');

    expectSuccess(run(['--input', directory]));
    expect(report()).toBe(`${header}CURS OFF,Instruction,1,project,program.asc\n`);
    expect(aggregateReport()).toBe(`${aggregateHeader}CURS OFF,Instruction,1,1,1\n`);
  });

  test('loads projects and nested sources once in sorted order, excluding other types and symlinks', () => {
    fixture('z-project/root.ASC');
    fixture('a-project/deep/second.TXT');
    const source = fixture('a-project/deep/first.asc');
    fixture('root.asc');
    fixture('a-project/readme.md');
    fixture('a-project/image.png', Buffer.from([0, 255, 128]));
    fixture('a-project/source.amo');
    fixture('a-project/binary.amos', Buffer.from([0, 255, 128]));
    symlinkSync(directory, join(directory, 'a-project', 'cycle'));
    symlinkSync(source, join(directory, 'a-project', 'alias.asc'));
    symlinkSync(join(directory, 'a-project'), join(directory, 'alias-project'));

    expectSuccess(run(['--input', directory]));
    expect(report()).toBe(header + [
      'CURS OFF,Instruction,1,a-project,deep/first.asc',
      'CURS OFF,Instruction,1,a-project,deep/second.TXT',
      'CURS OFF,Instruction,1,z-project,root.ASC',
      '',
    ].join('\n'));
    expect(aggregateReport()).toBe(`${aggregateHeader}CURS OFF,Instruction,3,2,3\n`);
  });

  test('exports used commands once per file, preserving catalog order and independent counts', () => {
    fixture('project/first.asc', 'Curs On\nCurs Off\nCurs Off\n');
    fixture('project/second.txt', 'Curs On\n');
    fixture('project/third.asc', '');
    fixture('second-project/first.asc');

    expectSuccess(run(['--input', directory]));
    expect(report()).toBe(header + [
      'CURS OFF,Instruction,2,project,first.asc',
      'CURS ON,Instruction,1,project,first.asc',
      'CURS ON,Instruction,1,project,second.txt',
      'CURS OFF,Instruction,1,second-project,first.asc',
      '',
    ].join('\n'));
    expect(aggregateReport()).toBe(aggregateHeader + [
      'CURS OFF,Instruction,3,2,2',
      'CURS ON,Instruction,2,1,2',
      '',
    ].join('\n'));
  });

  test.each(['separate', 'equals'])('accepts %s input syntax and relative dataset paths with spaces from another working directory', syntax => {
    fixture('custom input/my project/nested source.asc');
    const args = syntax === 'separate'
      ? ['--input', './custom input']
      : ['--input=./custom input'];

    expectSuccess(run(args));
    expect(report()).toBe(`${header}CURS OFF,Instruction,1,my project,nested source.asc\n`);
    expect(aggregateReport()).toBe(`${aggregateHeader}CURS OFF,Instruction,1,1,1\n`);
  });

  test('defaults to example_dataset from another working directory', () => {
    expectSuccess(run());

    const csv = report();
    expect(csv.startsWith(header)).toBe(true);
    expect(csv).toContain('CURS OFF,Instruction,1,1_cool_amos_project,graphics/colours.asc\n');
    expect(csv).toContain('SCREEN OPEN,Instruction,1,2_nice_amos_game,game.asc\n');
    const projects = new Set(csv.trim().split('\n').slice(1).map(row => row.split(',')[3]));
    expect([...projects]).toEqual(['1_cool_amos_project', '2_nice_amos_game', '3_another_amos_repo']);
    expect(aggregateReport()).toBe(aggregateHeader + [
      'BAR,Instruction,1,1,1',
      'CURS OFF,Instruction,1,1,1',
      'INK,Instruction,1,1,1',
      'SCREEN OPEN,Instruction,5,3,5',
      'TEXT,Instruction,1,1,1',
      'WAIT KEY,Instruction,1,1,1',
      '',
    ].join('\n'));
  });

  test('escapes special characters in project and file names and preserves UTF-8', () => {
    fixture('proj,"é\nnext/source,"file\r\n.asc');

    expectSuccess(run(['--input', directory]));
    expect(report()).toBe(`${header}CURS OFF,Instruction,1,"proj,""é\nnext","source,""file\r\n.asc"\n`);
    expect(aggregateReport()).toBe(`${aggregateHeader}CURS OFF,Instruction,1,1,1\n`);
  });

  test('replaces both reports instead of appending', () => {
    fixture('project/first.asc');
    expectSuccess(run(['--input', directory]));
    fixture('project/first.asc', 'Curs On\n');

    expectSuccess(run(['--input', directory]));
    expect(report()).toBe(`${header}CURS ON,Instruction,1,project,first.asc\n`);
    expect(aggregateReport()).toBe(`${aggregateHeader}CURS ON,Instruction,1,1,1\n`);
  });

  test.each(['empty dataset', 'excluded files only', 'dataset-root source only', 'no counted commands'])('writes two header-only CSVs for %s', scenario => {
    if (scenario === 'excluded files only') fixture('project/readme.md');
    if (scenario === 'dataset-root source only') fixture('root.asc');
    if (scenario === 'no counted commands') fixture('project/empty.asc', '');
    existingReport();

    expectSuccess(run(['--input', directory]));
    expect(report()).toBe(header);
    expect(aggregateReport()).toBe(aggregateHeader);
  });

  test('rejects a missing dataset without replacing the report', () => {
    existingReport();
    const result = run(['--input', join(directory, 'missing')]);

    expectFailure(result);
    expect(result.stderr).toContain('ENOENT');
  });

  test('rejects a file as input without replacing the report', () => {
    existingReport();
    const result = run(['--input', fixture('program.asc')]);

    expectFailure(result);
    expect(result.stderr).toMatch(/^Error: Input must be a directory:/);
  });

  const permissionTest = process.getuid?.() === 0 ? test.skip : test;
  permissionTest('leaves the previous report intact when a later source cannot be read', () => {
    existingReport();
    fixture('project/a.asc');
    const unreadable = fixture('project/z.asc');
    chmodSync(unreadable, 0);

    expectFailure(run(['--input', directory]));
  });

  test('reports output filesystem failures without printing success', () => {
    fixture('project/program.asc');
    rmSync(outputDirectory, { recursive: true });
    writeFileSync(outputDirectory, 'blocked directory');
    try {
      const result = run(['--input', directory]);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toMatch(/^Error: /);
      expect(result.stderr.trim().split('\n')).toHaveLength(1);
    } finally {
      rmSync(outputDirectory);
      mkdirSync(outputDirectory);
    }
  });

  test('prints no save confirmations if writing the aggregate report fails', () => {
    fixture('project/program.asc');
    mkdirSync(outputDirectory, { recursive: true });
    rmSync(aggregateFile, { force: true });
    mkdirSync(aggregateFile);
    try {
      const result = run(['--input', directory]);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toMatch(/^Error: /);
      expect(result.stderr.trim().split('\n')).toHaveLength(1);
    } finally {
      rmSync(aggregateFile, { recursive: true });
    }
  });

  test.each([
    ['--input'],
    ['--input='],
    ['--unknown'],
    ['unexpected-positional-argument'],
  ])('rejects invalid arguments %j without replacing the report', (...args) => {
    existingReport();
    expectFailure(run(args));
  });
});
