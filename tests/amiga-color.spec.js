import {
  amiga12BitToCssRgb,
  amiga12BitToHex,
  amiga12BitToRgb,
  hexToAmiga12Bit,
} from '../src/utils/amiga-color.js';

describe('Amiga color conversion', () => {
  test.each([
    [0x000, '#000000'],
    [0xf80, '#FF8800'],
    [0xfff, '#FFFFFF'],
    [0x1f80, '#FF8800'],
  ])('converts 0x%s to web hex', (amigaColor, expected) => {
    expect(amiga12BitToHex(amigaColor)).toBe(expected);
  });

  test('returns reusable RGB channels and CSS formatting', () => {
    expect(amiga12BitToRgb(0xf80)).toEqual({ r: 255, g: 136, b: 0 });
    expect(amiga12BitToCssRgb(0xf80)).toBe('rgb(255, 136, 0)');
  });

  test('quantizes 24-bit colors using each channel high nibble', () => {
    expect(hexToAmiga12Bit('#1280f7')).toBe(0x18f);
    expect(amiga12BitToHex(hexToAmiga12Bit('#1280f7'))).toBe('#1188FF');
  });

  test.each(['fff', '#fff', '#GG0000', null])('rejects malformed web color %s', (color) => {
    expect(() => hexToAmiga12Bit(color)).toThrow('#RRGGBB');
  });

  test.each([-1, 0x10000, 1.5, '0xfff'])('rejects invalid Amiga color %s', (color) => {
    expect(() => amiga12BitToHex(color)).toThrow('Amiga color');
  });
});
