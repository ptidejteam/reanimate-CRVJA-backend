import { parseBankFile, generateBankFile } from '../src/services/banks.service.js';

describe('banks.service parseBankFile', () => {
  test('fails when no file is provided', async () => {
    await expect(parseBankFile(null)).rejects.toThrow('No file was selected');
  });

  test('fails when file header is invalid', async () => {
    const invalidData = Buffer.from([1, 2, 3, 4, 5, 6]);
    await expect(parseBankFile({ buffer: invalidData })).rejects.toThrow(
      'Invalid bank file format',
    );
  });

  test('fails when file is too small', async () => {
    const smallData = Buffer.from([1, 2, 3]);
    await expect(parseBankFile({ buffer: smallData })).rejects.toThrow(
      'File is too small to contain a header',
    );
  });

  test('fails when sprite header is truncated', async () => {
    const data = Buffer.from([
      0x41,
      0x6d,
      0x53,
      0x70, // AmSp
      0x00,
      0x01, // 1 sprite expected
      0x00,
      0x01, // width=1
      0x00,
      0x08, // height=8
      0x00,
      0x04, // depth=4. Missing hotspot and graphic data.
    ]);
    await expect(parseBankFile({ buffer: data })).rejects.toThrow(
      'Unexpected end of file while reading header',
    );
  });

  test('fails when sprite dimensions are invalid or excessive', async () => {
    const data = Buffer.from([
      0x41,
      0x6d,
      0x53,
      0x70, // AmSp
      0x00,
      0x01, // 1 sprite expected
      0xff,
      0xff, // width = 65535 (> 1000)
      0x00,
      0x08, // height = 8
      0x00,
      0x04, // depth = 4
      0x00,
      0x00, // hotspotX = 0
      0x00,
      0x00, // hotspotY = 0
    ]);
    await expect(parseBankFile({ buffer: data })).rejects.toThrow(
      'Invalid dimensions for sprite/icon 1',
    );
  });

  test('fails when color palette is truncated', async () => {
    // Valid 1 sprite (16x16, depth 1 = 32 bytes data), but missing full 64 byte palette
    const width = 1;
    const height = 16;
    const depth = 1;
    const dataSize = width * 2 * height * depth; // 32 bytes
    const spriteBytes = Buffer.alloc(10 + dataSize);
    spriteBytes.writeUInt16BE(width, 0);
    spriteBytes.writeUInt16BE(height, 2);
    spriteBytes.writeUInt16BE(depth, 4);
    spriteBytes.writeUInt16BE(0, 6); // hotspotX
    spriteBytes.writeUInt16BE(0, 8); // hotspotY

    const header = Buffer.from([0x41, 0x6d, 0x53, 0x70, 0x00, 0x01]);
    const palette = Buffer.alloc(30); // incomplete palette (needs 64)

    const fullData = Buffer.concat([header, spriteBytes, palette]);
    await expect(parseBankFile({ buffer: fullData })).rejects.toThrow(
      'Unexpected end of file while reading color palette',
    );
  });

  test('successfully parses a valid .abk sprite bank', async () => {
    const width = 1;
    const height = 16;
    const depth = 4;
    const dataSize = width * 2 * height * depth; // 128 bytes
    const spriteBytes = Buffer.alloc(10 + dataSize);
    spriteBytes.writeUInt16BE(width, 0);
    spriteBytes.writeUInt16BE(height, 2);
    spriteBytes.writeUInt16BE(depth, 4);
    spriteBytes.writeUInt16BE(5, 6); // hotspotX = 5
    spriteBytes.writeUInt16BE(7, 8); // hotspotY = 7
    // fill planar graphic data with dummy test pattern
    for (let i = 0; i < dataSize; i++) {
      spriteBytes[10 + i] = i % 256;
    }

    const header = Buffer.from([0x41, 0x6d, 0x53, 0x70, 0x00, 0x01]); // AmSp, 1 sprite
    const palette = Buffer.alloc(64);
    // Set color 0 to 0x0000 (#000000) and color 1 to 0x0F80 (#FF8800)
    palette.writeUInt16BE(0x0000, 0);
    palette.writeUInt16BE(0x0f80, 2);

    const fullData = Buffer.concat([header, spriteBytes, palette]);
    const result = await parseBankFile({ buffer: fullData });

    expect(result).toBeDefined();
    expect(result.sprites.length).toBe(1);
    expect(result.sprites[0].width).toBe(1);
    expect(result.sprites[0].height).toBe(16);
    expect(result.sprites[0].depth).toBe(4);
    expect(result.sprites[0].hotspotX).toBe(5);
    expect(result.sprites[0].hotspotY).toBe(7);
    expect(result.sprites[0].planarGraphicData.length).toBe(128);
    expect(result.palette.length).toBe(32);
    expect(result.palette[0]).toBe('#000000');
    expect(result.palette[1]).toBe('#FF8800');
  });

  test('successfully parses Icon bank (AmIc)', async () => {
    const header = Buffer.from([0x41, 0x6d, 0x49, 0x63, 0x00, 0x00]); // AmIc, 0 icons
    const palette = Buffer.alloc(64);
    const fullData = Buffer.concat([header, palette]);

    const result = await parseBankFile({ buffer: fullData });
    expect(result.sprites.length).toBe(0);
    expect(result.palette.length).toBe(32);
  });

  describe('generateBankFile', () => {
    test('fails when invalid data is provided', () => {
      expect(() => generateBankFile(null)).toThrow('Invalid bank data');
      expect(() => generateBankFile({ sprites: null, palette: [] })).toThrow('Invalid bank data');
    });

    test('generates valid binary buffer with AmSp header and correct size', () => {
      const bankData = {
        sprites: [
          {
            width: 1,
            height: 16,
            depth: 4,
            hotspotX: 2,
            hotspotY: 3,
            planarGraphicData: Array(128).fill(42),
          },
        ],
        palette: Array(32).fill('#000000'),
      };

      const buffer = generateBankFile(bankData);
      expect(Buffer.isBuffer(buffer)).toBe(true);

      // Expected size: 4 (AmSp) + 2 (count) + 10 (sprite header) + 128 (planar data) + 64 (palette) = 208
      expect(buffer.length).toBe(208);
      expect(buffer.subarray(0, 4).toString('ascii')).toBe('AmSp');
      expect(buffer.readUInt16BE(4)).toBe(1); // 1 sprite
    });

    test('round-trip test: generates buffer and parseBankFile reconstructs identical data', async () => {
      const originalPalette = Array(32).fill('#000000');
      originalPalette[0] = '#000000';
      originalPalette[1] = '#FF8800';
      originalPalette[2] = '#112233';

      const originalSprites = [
        {
          width: 1,
          height: 16,
          depth: 4,
          hotspotX: 5,
          hotspotY: 7,
          planarGraphicData: Array.from({ length: 128 }, (_, i) => i % 256),
        },
        {
          width: 2,
          height: 8,
          depth: 2,
          hotspotX: 0,
          hotspotY: 1,
          planarGraphicData: Array.from({ length: 2 * 2 * 8 * 2 }, (_, i) => (i * 3) % 256),
        },
      ];

      const generatedBuffer = generateBankFile({
        sprites: originalSprites,
        palette: originalPalette,
      });

      const parsed = await parseBankFile({ buffer: generatedBuffer });

      expect(parsed.sprites.length).toBe(2);

      // Verify sprite 0
      expect(parsed.sprites[0].width).toBe(1);
      expect(parsed.sprites[0].height).toBe(16);
      expect(parsed.sprites[0].depth).toBe(4);
      expect(parsed.sprites[0].hotspotX).toBe(5);
      expect(parsed.sprites[0].hotspotY).toBe(7);
      expect(parsed.sprites[0].planarGraphicData).toEqual(originalSprites[0].planarGraphicData);

      // Verify sprite 1
      expect(parsed.sprites[1].width).toBe(2);
      expect(parsed.sprites[1].height).toBe(8);
      expect(parsed.sprites[1].depth).toBe(2);
      expect(parsed.sprites[1].hotspotX).toBe(0);
      expect(parsed.sprites[1].hotspotY).toBe(1);
      expect(parsed.sprites[1].planarGraphicData).toEqual(originalSprites[1].planarGraphicData);

      // Verify palette
      expect(parsed.palette.length).toBe(32);
      expect(parsed.palette[0]).toBe('#000000');
      expect(parsed.palette[1]).toBe('#FF8800');
      expect(parsed.palette[2]).toBe('#112233');
    });
  });
});
