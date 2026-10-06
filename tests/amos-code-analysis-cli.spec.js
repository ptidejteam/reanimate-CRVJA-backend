import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';

const script = fileURLToPath(new URL('../amos-code-analysis/main.js', import.meta.url));

describe('AMOS analysis directory input', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'amos-analysis-'));
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
      maxBuffer: 8 * 1024 * 1024,
    });
    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    return result;
  }

  function reports(stdout) {
    return stdout.split(/^File: /m).slice(1).map(block => {
      const endOfHeader = block.indexOf('\n');
      return { path: block.slice(0, endOfHeader), body: block.slice(endOfHeader + 1) };
    });
  }

  function expectSuccess(result) {
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  }

  test('loads root and nested sources once in sorted order, excluding other types and symlinks', () => {
    fixture('z.ASC');
    fixture('a/deep/second.TXT');
    const source = fixture('a/deep/first.asc');
    fixture('a/readme.md');
    fixture('a/image.png', Buffer.from([0, 255, 128]));
    fixture('a/source.amo');
    fixture('a/binary.amos', Buffer.from([0, 255, 128]));
    symlinkSync(directory, join(directory, 'cycle'));
    symlinkSync(source, join(directory, 'alias.asc'));

    const result = run(['--input', directory]);

    expectSuccess(result);
    expect(reports(result.stdout).map(report => report.path)).toEqual([
      join('a', 'deep', 'first.asc'),
      join('a', 'deep', 'second.TXT'),
      'z.ASC',
    ]);
  });

  test('preserves both arrays and starts each file with independent counts', () => {
    fixture('first.asc', 'Curs Off\nCurs Off\n');
    fixture('second.txt', 'Curs On\n');
    fixture('third.asc', '');

    const result = run(['--input', directory]);

    expectSuccess(result);
    const output = reports(result.stdout);
    expect(output).toHaveLength(3);
    for (const { body } of output) {
      expect(body.startsWith("[\n  { COMMAND: 'ADD', CATEGORY: 'Instruction', COUNT: 0 },")).toBe(true);
    }
    const filtered = output.map(({ body }) => body.split('\n]\n')[1].trim());
    expect(filtered).toEqual([
      inspect([{ COMMAND: 'CURS OFF', CATEGORY: 'Instruction', COUNT: 2 }]),
      inspect([{ COMMAND: 'CURS ON', CATEGORY: 'Instruction', COUNT: 1 }]),
      '[]',
    ]);
    expect(output[1].body).toContain("{ COMMAND: 'CURS OFF', CATEGORY: 'Instruction', COUNT: 0 }");
  });

  test.each(['separate', 'equals'])('accepts %s input syntax and relative paths with spaces from another working directory', syntax => {
    fixture('custom input/nested source.asc');
    const args = syntax === 'separate'
      ? ['--input', './custom input']
      : ['--input=./custom input'];

    const result = run(args);

    expectSuccess(result);
    expect(reports(result.stdout).map(report => report.path)).toEqual(['nested source.asc']);
  });

  test('uses the script-relative datasets default from another working directory', () => {
    const result = run();

    expectSuccess(result);
    const paths = reports(result.stdout).map(report => report.path);
    expect(paths).toContain(join('example_dataset', '1_cool_amos_project', 'graphics', 'colours.asc'));
    expect(paths).toContain(join('example_dataset', '2_nice_amos_game', 'utilities', 'score.txt'));
    expect(new Set(paths).size).toBe(paths.length);
  });

  test.each(['empty', 'excluded files only'])('reports no sources successfully for %s input', scenario => {
    if (scenario === 'excluded files only') fixture('nested/readme.md');

    const result = run(['--input', directory]);

    expectSuccess(result);
    expect(result.stdout).toBe('No .asc or .txt files found.\n');
  });

  test('rejects a missing directory', () => {
    const result = run(['--input', join(directory, 'missing')]);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/^Error: .*ENOENT/);
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
  });

  test('rejects a file as input', () => {
    const result = run(['--input', fixture('program.asc')]);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/^Error: Input must be a directory:/);
  });

  test.each([
    ['--input'],
    ['--input='],
    ['--unknown'],
    ['unexpected-positional-argument'],
  ])('rejects invalid arguments %j', (...args) => {
    const result = run(args);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/^Error: /);
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
  });
});
