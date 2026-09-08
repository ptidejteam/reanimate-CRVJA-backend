/**
 * Parses an AMOS .abk sprite or icon bank file.
 * Accepts a Multer file object, Buffer, or Uint8Array.
 *
 * @param {Object|Buffer|Uint8Array} file - The file object or buffer containing .abk binary data.
 * @returns {Promise<{ sprites: Array<Object>, palette: Array<string> }>} Parsed sprites and 32-color palette.
 */
export async function parseBankFile(file) {
  if (!file) {
    throw new Error('No file was selected');
  }

  let buffer;
  if (file.buffer) {
    buffer = new Uint8Array(file.buffer);
  } else if (file instanceof Uint8Array || Buffer.isBuffer(file)) {
    buffer = new Uint8Array(file);
  } else if (file instanceof ArrayBuffer) {
    buffer = new Uint8Array(file);
  } else {
    throw new Error('Invalid file input provided');
  }

  if (buffer.length < 6) {
    throw new Error('Invalid bank file: File is too small to contain a header.');
  }

  const header = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  if (header !== 'AmSp' && header !== 'AmIc') {
    throw new Error(
      `Invalid bank file format: "${header}". Expected a Sprite bank (AmSp) or Icon bank (AmIc).`,
    );
  }

  let offset = 6;
  const numberExpected = (buffer[4] << 8) | buffer[5];
  const objectsArray = [];

  for (let i = 0; i < numberExpected; i++) {
    if (offset + 10 > buffer.length) {
      throw new Error(
        `Corrupted bank file: Unexpected end of file while reading header for sprite/icon ${i + 1}.`,
      );
    }

    const width = (buffer[offset] << 8) | buffer[offset + 1];
    const height = (buffer[offset + 2] << 8) | buffer[offset + 3];
    const depth = (buffer[offset + 4] << 8) | buffer[offset + 5];
    const hotspotX = (buffer[offset + 6] << 8) | buffer[offset + 7];
    const hotspotY = (buffer[offset + 8] << 8) | buffer[offset + 9];

    // Sanity check dimensions to prevent malicious/corrupted files allocating too much memory
    if (width < 0 || height < 0 || depth < 0 || depth > 8 || width > 1000 || height > 1000) {
      throw new Error(
        `Corrupted bank file: Invalid dimensions for sprite/icon ${i + 1} (width: ${width}, height: ${height}, depth: ${depth}).`,
      );
    }

    const dataSize = width * 2 * height * depth;

    if (offset + 10 + dataSize > buffer.length) {
      throw new Error(
        `Corrupted bank file: Sprite/icon ${i + 1} data extends beyond the file boundary (needs ${dataSize} bytes, but only ${buffer.length - offset - 10} bytes remain).`,
      );
    }

    const planarGraphicData = [];
    for (let j = 0; j < dataSize; j++) {
      planarGraphicData.push(buffer[offset + 10 + j]);
    }

    const objectBuilder = {
      width,
      height,
      depth,
      hotspotX,
      hotspotY,
      planarGraphicData,
    };

    objectsArray.push(objectBuilder);
    offset += 10 + dataSize;
  }

  if (offset + 64 > buffer.length) {
    throw new Error(
      `Corrupted bank file: Unexpected end of file while reading color palette (needs 64 bytes, but only ${buffer.length - offset} bytes remain).`,
    );
  }

  // Initialize colorPalette to hold 32 colors (64 bytes in total)
  const colorPalette = [];

  // Loop through each pair of bytes in the color palette section (32 colors x 2 bytes)
  for (let k = offset; k < offset + 64; k += 2) {
    const byte1 = buffer[k];
    const byte2 = buffer[k + 1];

    const color1 = (byte1 << 8) | byte2;

    // Extract the red, green, and blue components (4 bits each)
    const red = (color1 >> 8) & 0xf;
    const green = (color1 >> 4) & 0xf;
    const blue = color1 & 0xf;

    // Convert 4-bit values (0-15) to 8-bit values (0-255) by multiplying by 17
    const red8 = (red * 17).toString(16).padStart(2, '0');
    const green8 = (green * 17).toString(16).padStart(2, '0');
    const blue8 = (blue * 17).toString(16).padStart(2, '0');

    // Format as HTML color code #RRGGBB
    const color = '#' + red8 + green8 + blue8;
    colorPalette.push(color.toUpperCase());
  }

  return { sprites: objectsArray, palette: colorPalette };
}

/**
 * Generates an AMOS .abk sprite bank binary buffer.
 *
 * @param {Object} bankCreator - Object containing sprites array and palette array.
 * @returns {Buffer} Node.js Buffer containing binary .abk data.
 */
export function generateBankFile(bankCreator) {
  if (!bankCreator || !Array.isArray(bankCreator.sprites) || !Array.isArray(bankCreator.palette)) {
    throw new Error('Invalid bank data: sprites and palette must be provided as arrays.');
  }

  const { sprites, palette } = bankCreator;
  const identifier = 'AmSp'; // 4-byte identifier for sprites

  // Create an array to hold the binary data
  let binaryData = [];

  // Add the 4-byte identifier
  for (let i = 0; i < identifier.length; i++) {
    binaryData.push(identifier.charCodeAt(i));
  }

  // Add the 2-byte number of sprites
  const spriteCount = sprites.length;
  binaryData.push((spriteCount >> 8) & 0xff); // High byte
  binaryData.push(spriteCount & 0xff); // Low byte

  // Add each sprite's data
  sprites.forEach((sprite) => {
    const { width, height, depth, hotspotX = 0, hotspotY = 0, planarGraphicData } = sprite;

    let object = [];
    // Width and height are each 2 bytes
    object.push((width >> 8) & 0xff);
    object.push(width & 0xff);
    object.push((height >> 8) & 0xff);
    object.push(height & 0xff);

    // Depth, hotspot X, and hotspot Y are each 2 bytes
    object.push((depth >> 8) & 0xff);
    object.push(depth & 0xff);
    object.push((hotspotX >> 8) & 0xff);
    object.push(hotspotX & 0xff);
    object.push((hotspotY >> 8) & 0xff);
    object.push(hotspotY & 0xff);
    if (Array.isArray(planarGraphicData)) {
      object.push(...planarGraphicData);
    } else {
      console.error('planarGraphicData is not an array', planarGraphicData);
    }

    binaryData.push(...object);
  });

  let newPalette = [...palette];
  function rgbTo16Bit(rgbColor) {
    // Extract the red, green, and blue components from the hex color
    const red = parseInt(rgbColor.slice(1, 3), 16) >> 4; // Red channel (top 4 bits)
    const green = parseInt(rgbColor.slice(3, 5), 16) >> 4; // Green channel (middle 4 bits)
    const blue = parseInt(rgbColor.slice(5, 7), 16) >> 4; // Blue channel (bottom 4 bits)

    // Combine red, green, and blue components into a 16-bit color value
    const color16Bit = (red << 8) | (green << 4) | blue;

    return color16Bit;
  }

  // Convert the palette into 16-bit color values and then add to binaryData
  newPalette.forEach((color) => {
    const rgb = rgbTo16Bit(color); // Convert to 16-bit color
    binaryData.push((rgb >> 8) & 0xff); // High byte
    binaryData.push(rgb & 0xff); // Low byte
  });

  return Buffer.from(binaryData);
}
