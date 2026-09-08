export function validateAmigaColor(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
    throw new TypeError('Amiga color must be an integer between 0x0000 and 0xFFFF.');
  }
}

export function amiga12BitToRgb(value) {
  validateAmigaColor(value);
  const color = value & 0x0fff;

  return {
    r: ((color >> 8) & 0x0f) * 17,
    g: ((color >> 4) & 0x0f) * 17,
    b: (color & 0x0f) * 17,
  };
}

export function amiga12BitToHex(value) {
  const { r, g, b } = amiga12BitToRgb(value);
  const channelToHex = (channel) => channel.toString(16).padStart(2, '0');

  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`.toUpperCase();
}

export function amiga12BitToCssRgb(value) {
  const { r, g, b } = amiga12BitToRgb(value);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToAmiga12Bit(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new TypeError('RGB color must use the #RRGGBB format.');
  }

  const r = parseInt(hex.slice(1, 3), 16) >> 4;
  const g = parseInt(hex.slice(3, 5), 16) >> 4;
  const b = parseInt(hex.slice(5, 7), 16) >> 4;
  return (r << 8) | (g << 4) | b;
}
