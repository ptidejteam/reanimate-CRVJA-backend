import { readFileSync } from 'node:fs';
import {
  AmosBinaryParseError,
  parseExtensionToTable,
  printAMOSSource,
  TokenTable,
} from '../utils/amos-binary-parser.js';

const AMOS_HEADER_SIZE = 20;
const AMOS_SIGNATURE = 'AMOS Basic v';
const textDecoder = new TextDecoder('latin1');

const BUILTIN_TOKENS = [
  [0x005c, ','],
  [0x0054, ':'],
  [0x0064, ';'],
  [0x0074, '('],
  [0x007c, ')'],
  [0x0094, 'To'],
  [0x0246, 'Next'],
  [0x0476, 'Print'],
  [0x0640, 'Dim'],
  [0x09ea, 'Screen Open'],
  [0x0c90, 'Lowres'],
  [0x0d34, 'Flash Off'],
  [0x1446, 'Curs Off'],
  [0x1de0, 'Hide'],
  [0x06ca, 'Degree'],
  [0x13dc, 'Paper'],
  [0x0bae, 'Cls'],
  [0x0cfc, 'Palette'],
  [0x13d2, 'Pen'],
  [0x012c, 'Double Buffer'],
  [0x0e2c, 'Autoback'],
  [0xffa2, '='],
  [0xffca, '-'],
  [0xffc0, '+'],
  [0xffe2, '*'],
  [0xffec, '/'],
  [0x0652, "'"],
  [0x023c, 'For'],
  [0x027e, 'Do'],
  [0x0286, 'Loop'],
  [0x0458, 'Add'],
  [0x02be, 'If'],
  [0x02da, 'End If'],
  [0x1378, 'Locate'],
  [0x12ce, 'Timer'],
  [0x0462, 'Add'],
  [0x0ae2, 'Screen Swap'],
  [0x0cca, 'Wait Vbl'],
  [0x070c, 'Cos'],
  [0x0702, 'Sin'],
];

const EXTENSIONS = [
  {
    slot: 8,
    url: new URL('../resources/extensions/AMOSPro_AMCAF.Lib', import.meta.url),
  },
];

export class AmosDecodeError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'AmosDecodeError';
  }
}

export class AmosDecoderConfigurationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'AmosDecoderConfigurationError';
  }
}

function toUint8Array(input) {
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    return Uint8Array.from(input);
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input.slice(0));
  }

  throw new AmosDecodeError('Invalid AMOS file input. Expected binary data.');
}

function readUint32BE(bytes, offset) {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

export function createTokenTable(extensionLoader = (url) => readFileSync(url)) {
  const table = new TokenTable();

  for (const [token, name] of BUILTIN_TOKENS) {
    table.set(token, 'I', name);
  }

  for (const extension of EXTENSIONS) {
    let extensionBytes;
    try {
      extensionBytes = new Uint8Array(extensionLoader(extension.url));
    } catch (error) {
      throw new AmosDecoderConfigurationError(
        `Unable to load AMOS extension library for slot ${extension.slot}.`,
        { cause: error },
      );
    }

    const parsedAtSix = parseExtensionToTable(extensionBytes, extension.slot, 6, table);
    const parsed = parsedAtSix || parseExtensionToTable(extensionBytes, extension.slot, 0, table);
    if (!parsed) {
      throw new AmosDecoderConfigurationError(
        `Invalid AMOS extension library for slot ${extension.slot}.`,
      );
    }
  }

  return table;
}

let tokenTable;

function getTokenTable() {
  tokenTable ??= createTokenTable();
  return tokenTable;
}

export function decodeAmosFile(input, table) {
  const bytes = toUint8Array(input);
  if (bytes.length < AMOS_HEADER_SIZE) {
    throw new AmosDecodeError('Invalid AMOS file: the 20-byte header is truncated.');
  }

  const signature = textDecoder.decode(bytes.subarray(0, AMOS_SIGNATURE.length));
  if (signature !== AMOS_SIGNATURE) {
    throw new AmosDecodeError('Invalid AMOS file signature.');
  }

  const tokenizedLength = readUint32BE(bytes, 16);
  if (tokenizedLength > bytes.length - AMOS_HEADER_SIZE) {
    throw new AmosDecodeError('Invalid AMOS file: the tokenized program is truncated.');
  }

  const code = bytes.slice(AMOS_HEADER_SIZE, AMOS_HEADER_SIZE + tokenizedLength);
  try {
    return printAMOSSource(code, table ?? getTokenTable());
  } catch (error) {
    if (error instanceof AmosBinaryParseError) {
      throw new AmosDecodeError(error.message, { cause: error });
    }
    throw error;
  }
}
