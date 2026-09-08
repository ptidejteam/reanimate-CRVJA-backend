import {
  AmosDecodeError,
  AmosDecoderConfigurationError,
  createTokenTable,
  decodeAmosFile,
} from '../src/services/amos-decoder.service.js';
import { printAMOSSource, TokenTable } from '../src/utils/amos-binary-parser.js';

function createAmosFile(code) {
  const file = Buffer.alloc(20 + code.length);
  file.write('AMOS Basic v134 ', 0, 'latin1');
  file.writeUInt32BE(code.length, 16);
  Buffer.from(code).copy(file, 20);
  return file;
}

describe('AMOS decoder service', () => {
  test('loads built-in and AMCAF extension tokens once per table', () => {
    const table = createTokenTable();

    expect(table.get(0x0476)?.name).toBe('Print');
    expect(table.map.size).toBeGreaterThan(40);
  });

  test('decodes a tokenized AMOS program', () => {
    const code = [
      6,
      1, // line length in words, indentation
      0x04,
      0x76, // Print
      0x00,
      0x26, // double-quoted string
      0x00,
      0x02,
      0x48,
      0x69, // "Hi"
      0x00,
      0x00, // end of line
    ];

    expect(decodeAmosFile(createAmosFile(code))).toBe('Print "Hi"\n');
  });

  test.each([
    [Buffer.alloc(19), 'header is truncated'],
    [Buffer.alloc(20), 'signature'],
  ])('rejects an invalid container', (file, message) => {
    expect(() => decodeAmosFile(file)).toThrow(message);
    expect(() => decodeAmosFile(file)).toThrow(AmosDecodeError);
  });

  test('rejects a truncated tokenized program', () => {
    const file = createAmosFile([]);
    file.writeUInt32BE(8, 16);

    expect(() => decodeAmosFile(file)).toThrow('tokenized program is truncated');
  });

  test('rejects a line that extends beyond the tokenized section', () => {
    const file = createAmosFile([10, 1, 0, 0]);

    expect(() => decodeAmosFile(file)).toThrow('truncated line');
  });

  test('reports an invalid packaged extension as configuration failure', () => {
    expect(() => createTokenTable(() => Buffer.alloc(8))).toThrow(AmosDecoderConfigurationError);
  });

  test('handles compiled procedures without reading an undeclared line length', () => {
    const table = new TokenTable();
    table.set(0x0376, 'I', 'Procedure');
    const code = Uint8Array.from([
      7, 1, 0x03, 0x76, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    expect(printAMOSSource(code, table)).toContain("COMPILED PROCEDURE -- can't convert");
  });
});
