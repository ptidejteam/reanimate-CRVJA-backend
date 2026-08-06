const keyMapping = {
  1: 'Escape',
  2: 'Digit1',
  3: 'Digit2',
  4: 'Digit3',
  5: 'Digit4',
  6: 'Digit5',
  7: 'Digit6',
  8: 'Digit7',
  9: 'Digit8',
  10: 'Digit9',
  11: 'Digit0',
  12: 'Minus',
  13: 'Equal',
  14: 'Backspace',
  15: 'Tab',
  16: 'KeyQ',
  17: 'KeyW',
  18: 'KeyE',
  19: 'KeyR',
  20: 'KeyT',
  21: 'KeyY',
  22: 'KeyU',
  23: 'KeyI',
  24: 'KeyO',
  25: 'KeyP',
  26: 'BracketLeft',
  27: 'BracketRight',
  28: 'Enter',
  29: 'ControlLeft',
  30: 'KeyA',
  31: 'KeyS',
  32: 'KeyD',
  33: 'KeyF',
  34: 'KeyG',
  35: 'KeyH',
  36: 'KeyJ',
  37: 'KeyK',
  38: 'KeyL',
  39: 'Semicolon',
  40: 'Quote',
  41: 'Backquote',
  42: 'ShiftLeft',
  43: 'Backslash',
  44: 'KeyZ',
  45: 'KeyX',
  46: 'KeyC',
  47: 'KeyV',
  48: 'KeyB',
  49: 'KeyN',
  50: 'KeyM',
  51: 'Comma',
  52: 'Period',
  53: 'Slash',
  54: 'ShiftRight',
  55: 'NumpadMultiply',
  56: 'AltLeft',
  57: 'Space',
  58: 'CapsLock',
  59: 'F1',
  60: 'F2',
  61: 'F3',
  62: 'F4',
  63: 'F5',
  64: 'F6',
  65: 'F7',
  66: 'F8',
  67: 'F9',
  68: 'F10',
  69: 'Pause',
  70: 'ScrollLock',
  71: 'Numpad7',
  72: 'Numpad8',
  73: 'Numpad9',
  74: 'NumpadSubtract',
  75: 'Numpad4',
  76: 'Numpad5',
  77: 'Numpad6',
  78: 'NumpadAdd',
  79: 'Numpad1',
  80: 'Numpad2',
  81: 'Numpad3',
  82: 'Numpad0',
  83: 'NumpadDecimal',
  84: 'IntlBackslash',
  85: 'F11',
  86: 'F12',
  87: 'NumpadEqual',
  88: 'F13',
  89: 'F14',
  90: 'F15',
  91: 'F16',
  92: 'F17',
  93: 'F18',
  94: 'F19',
  95: 'F20',
  96: 'F21',
  97: 'F22',
  98: 'F23',
  99: 'F24',
  100: 'NumpadComma',
  101: 'Lang1',
  102: 'Lang2',
  103: 'NumpadEnter',
  104: 'ControlRight',
  105: 'NumpadDivide',
  106: 'PrintScreen',
  107: 'AltRight',
  108: 'NumLock',
  109: 'Home',
  110: 'ArrowUp',
  111: 'PageUp',
  112: 'ArrowLeft',
  113: 'ArrowRight',
  114: 'End',
  115: 'ArrowDown',
  116: 'PageDown',
  117: 'Insert',
  118: 'Delete',
  119: 'MetaLeft',
  120: 'MetaRight',
  121: 'ContextMenu',
  122: 'Power',
  123: 'AudioVolumeMute',
  124: 'AudioVolumeDown',
  125: 'AudioVolumeUp',
  126: 'MediaTrackNext',
  127: 'MediaTrackPrevious',
  128: 'MediaStop',
  129: 'MediaPlayPause',
  130: 'LaunchMail',
  131: 'MediaSelect',
  132: 'LaunchApp1',
  133: 'LaunchApp2',
  134: 'LaunchApp3',
  135: 'LaunchApp4',
  136: 'BrowserSearch',
  137: 'BrowserHome',
  138: 'BrowserBack',
  139: 'BrowserForward',
  140: 'BrowserStop',
  141: 'BrowserRefresh',
  142: 'BrowserFavorites',
  143: 'Lang3',
  144: 'Lang4',
  145: 'Lang5',
  146: 'Lang6',
  147: 'Lang7',
  148: 'Lang8',
  149: 'Lang9',
  150: 'Lang10',
  151: 'BrightnessDown',
  152: 'BrightnessUp',
  153: 'Eject',
  154: 'Sleep',
  155: 'WakeUp',
  156: 'ScreenLock',
  157: 'DisplaySwitch',
  158: 'KbdIllumToggle',
  159: 'KbdIllumDown',
  160: 'KbdIllumUp',
  161: 'SendMessage',
  162: 'Reply',
  163: 'Forward',
  164: 'Save',
  165: 'Documents',
  166: 'Pictures',
  167: 'Music',
  168: 'Movies',
  169: 'Calendar',
  170: 'Calculator',
  171: 'Memo',
  172: 'ToDoList',
  173: 'Phone',
  174: 'Voicemail',
  175: 'Contacts',
  176: 'Mail',
  177: 'MediaLibrary',
  178: 'Search',
  179: 'HomePage',
  180: 'LogOff',
  181: 'LockScreen',
  182: 'TaskManager',
  183: 'Next',
  184: 'Previous',
  185: 'EndCall',
  186: 'AnswerCall',
  187: 'MuteCall',
  188: 'HoldCall',
  189: 'ConferenceCall',
  190: 'VolumeUp',
  191: 'VolumeDown',
  192: 'ZoomIn',
  193: 'ZoomOut',
  194: 'ScrollUp',
  195: 'ScrollDown',
  196: 'RotateLeft',
  197: 'RotateRight',
  198: 'FlipHorizontal',
  199: 'FlipVertical',
  200: 'Mirror',
  201: 'PictureInPicture',
  202: 'PictureMode',
  203: 'ScreenShare',
  204: 'VideoCall',
  205: 'VoiceSearch',
  206: 'AssistiveTouch',
  207: 'Dictate',
  208: 'LanguageSwitch',
  209: 'Accessibility',
  210: 'InputMethod',
  211: 'EmojiPicker',
  212: 'Camera',
  213: 'PhotoLibrary',
  214: 'FaceUnlock',
  215: 'FingerprintScan',
  216: 'IrisScan',
  217: 'SmartLock',
  218: 'DoNotDisturb',
  219: 'NightMode',
  220: 'PrivacyMode',
  221: 'FlightMode',
  222: 'PowerOff',
  223: 'Restart',
  224: 'Shutdown',
  225: 'Hibernate',
  226: 'RestartToBootloader',
  227: 'SafeMode',
  228: 'DeveloperOptions',
  229: 'TakeScreenshot',
  230: 'RecordScreen',
  231: 'VideoPlayback',
  232: 'MediaPause',
  233: 'MediaRewind',
  234: 'MediaFastForward',
  235: 'MediaPlay',
  236: 'MediaStop',
  237: 'MediaRecord',
  238: 'PlayPause',
  239: 'PlayStop',
  240: 'MediaNext',
};

let dataMatrixPointer = 0;
let currentTimer = Date.now();
let Ink = 1;
let Paper = 0;
let Timer = 0;
let currentPressedKey = null;
let isPressed = false;
const keyCodes = () => {
  document.addEventListener('keydown', function (e) {
    isPressed = true;
    currentPressedKey = e.code;
  });
  document.addEventListener('keyup', function (e) {
    isPressed = false;
    currentPressedKey = null;
  });
};
keyCodes();

function clearDivs(idtarget) {
  const screenDiv = document.getElementById(idtarget);
  if (screenDiv) {
    screenDiv.remove();
  }
}
let soundPlayerTimeTracker = 0;
const pitchToFrequency = {
  1: 16.35, // C0
  2: 17.32, // C#0
  3: 18.35, // D0
  4: 19.45, // D#0
  5: 20.6, // E0
  6: 21.83, // F0
  7: 23.12, // F#0
  8: 24.5, // G0
  9: 25.96, // G#0
  10: 27.5, // A0
  11: 29.14, // A#0
  12: 30.87, // B0
  13: 32.7, // C1
  14: 34.65, // C#1
  15: 36.71, // D1
  16: 38.89, // D#1
  17: 41.2, // E1
  18: 43.65, // F1
  19: 46.25, // F#1
  20: 49.0, // G1
  21: 51.91, // G#1
  22: 55.0, // A1
  23: 58.27, // A#1
  24: 61.74, // B1
  25: 65.41, // C2
  26: 69.3, // C#2
  27: 73.42, // D2
  28: 77.78, // D#2
  29: 82.41, // E2
  30: 87.31, // F2
  31: 92.5, // F#2
  32: 98.0, // G2
  33: 103.83, // G#2
  34: 110.0, // A2
  35: 116.54, // A#2
  36: 123.47, // B2
  37: 130.81, // C3
  38: 138.59, // C#3
  39: 146.83, // D3
  40: 155.56, // D#3
  41: 164.81, // E3
  42: 174.61, // F3
  43: 185.0, // F#3
  44: 196.0, // G3
  45: 207.65, // G#3
  46: 220.0, // A3
  47: 233.08, // A#3
  48: 246.94, // B3
  49: 261.63, // C4
  50: 277.18, // C#4
  51: 293.66, // D4
  52: 311.13, // D#4
  53: 329.63, // E4
  54: 349.23, // F4
  55: 369.99, // F#4
  56: 392.0, // G4
  57: 415.3, // G#4
  58: 440.0, // A4
  59: 466.16, // A#4
  60: 493.88, // B4
  61: 523.25, // C5
  62: 554.37, // C#5
  63: 587.33, // D5
  64: 622.25, // D#5
  65: 659.25, // E5
  66: 698.46, // F5
  67: 739.99, // F#5
  68: 783.99, // G5
  69: 830.61, // G#5
  70: 880.0, // A5
  71: 932.33, // A#5
  72: 987.77, // B5
  73: 1046.5, // C6
  74: 1108.73, // C#6
  75: 1174.66, // D6
  76: 1244.51, // D#6
  77: 1318.51, // E6
  78: 1396.91, // F6
  79: 1479.98, // F#6
  80: 1567.98, // G6
  81: 1661.22, // G#6
  82: 1760.0, // A6
  83: 1864.66, // A#6
  84: 1975.53, // B6
  85: 2093.0, // C7
  86: 2217.46, // C#7
  87: 2349.32, // D7
  88: 2489.02, // D#7
  89: 2637.02, // E7
  90: 2793.83, // F7
  91: 2959.96, // F#7
  92: 3135.96, // G7
  93: 3322.44, // G#7
  94: 3520.0, // A7
  95: 3729.31, // A#7
  96: 3951.07, // B7
};

let activeOscillators = {}; // Object to store active oscillators keyed by noteId

function soundPlayer(noteId, cooldown) {
  let currentTime = Date.now();

  if (currentTime - soundPlayerTimeTracker > cooldown / 2) {
    soundPlayerTimeTracker = currentTime;

    const frequency = pitchToFrequency[noteId];

    // Check if there's already an oscillator for this noteId
    if (activeOscillators[noteId]) {
      // Stop the existing oscillator
      activeOscillators[noteId].stop();
      activeOscillators[noteId].disconnect(); // Disconnect it from the audio context
    }

    // Create a new AudioContext for the new oscillator
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create a GainNode for controlling volume
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start at zero gain (silent)

    // Create a new oscillator
    const oscillator = audioCtx.createOscillator();

    // Set the frequency of the oscillator
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Create a custom waveform using PeriodicWave
    const real = new Float32Array([0, 1, 0.5, 0.25, 0.125]); // Amplitude of harmonics
    const imag = new Float32Array(real.length); // Zero phase shift
    const customWave = audioCtx.createPeriodicWave(real, imag);

    // Set the custom waveform to the oscillator
    oscillator.setPeriodicWave(customWave);

    // Connect the oscillator to the gain node, then to the audio context's destination (the speakers)
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Resume the AudioContext and start the oscillator
    audioCtx.resume().then(() => {
      // Apply fade-in (linear ramp to full volume over 50ms)
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);

      // Start the oscillator
      oscillator.start();

      // Schedule the fade-out (linear ramp to zero gain 50ms before the sound stops)
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.95);

      // Store the oscillator in the activeOscillators object
      activeOscillators[noteId] = oscillator;

      // Stop the oscillator after 1 second and remove it from the activeOscillators object
      oscillator.stop(audioCtx.currentTime + 1);
      oscillator.onended = () => {
        delete activeOscillators[noteId];
      };
    });
  }
}

// Dictionary to hold file streams based on channels (0-10)
const channels = {};

// Function to open a file and assign it to a channel
function openFile(fileName, channel, mode = 'w') {
  if (channel < 0 || channel > 10) {
    throw new Error('Channel must be between 0 and 10');
  }
  const stream = fs.createWriteStream(fileName, {
    flags: mode,
  });
  channels[channel] = stream;
}

// Function to write to a file based on the assigned channel
function writeToChannel(channel, data) {
  const stream = channels[channel];
  if (!stream) {
    throw new Error('No file opened on channel');
  }
  stream.write(data + '\\n', 'utf8', (err) => {
    if (err) throw err;
  });
}

// Function to read from a file based on the assigned channel
function readFromChannel(channel, callback) {
  const stream = channels[channel];
  if (!stream || !stream.readable) {
    throw new Error('No readable file opened on channel');
  }
  let data = '';
  stream.on('data', (chunk) => (data += chunk));
  stream.on('end', () => {
    callback(data.trim()); // Callback to return the read data
  });
}

// Function to close a file channel
function closeChannel(channel) {
  const stream = channels[channel];
  if (!stream) {
    throw new Error('No file opened on channel');
  }
  delete channels[channel];
}

function Cos(angle) {
  return Math.cos((angle * Math.PI) / 180);
}

function Sin(angle) {
  return Math.sin((angle * Math.PI) / 180);
}

function Tan(angle) {
  return Math.tan((angle * Math.PI) / 180);
}

function Qsin(angle, radius) {
  return Math.round(radius * Math.sin((angle * Math.PI) / 512));
}

function Qcos(angle, radius) {
  return Math.round(radius * Math.cos((angle * Math.PI) / 512));
}

function Rnd(maxValue) {
  return Math.floor(Math.random() * maxValue);
}

let bankData = {
  1: {
    sprites: [],
    processing: false,
    palette: [],
  },
  2: {
    sprites: [],
    processing: false,
    palette: [],
  },
  3: {
    sprites: [],
    processing: false,
    palette: [],
  },
  4: {
    sprites: [],
    processing: false,
    palette: [],
  },
  5: {
    sprites: [],
    processing: false,
    palette: [],
  },
};

function loadBank(bankName, bank) {
  let bankFileType = bankName.split('.').pop().toLowerCase();
  bankFileType = bankFileType.replace('"', ''); // Remove any non-alphanumeric characters

  if (bankFileType !== 'abk') {
    console.error('Invalid file type. Please select a .abk file.');
    return;
  }

  if (bankData[bank].processing === true) {
    for (let i = 0; i < 5; i++) {
      if (bankData[i + 1].processing == false) {
        console.log('Bank', i + 1, ' is free');
        bank = i + 1; // Set the bank to the first available slot with sprites
        bankData[bank].processing = true;
        break;
      }
    }
    // TODO: this only works if orinal bank was 1
    if (bank == 1) {
      console.log('Bank slots are full');
      return;
    }
  } else {
    bankData[bank].processing = true;
  }

  // 1) Try the posted bytes (by id or by a name match)
  let file = (window.__getBankFile && window.__getBankFile(bank, bankName)) || null;

  // 2) Fallback to legacy input (only if you also render inputs inside the iframe)
  if (!file) {
    const findElementId = 'bankStored' + bank;
    const inputElement = document.getElementById(findElementId);
    file = inputElement?.files?.[0];
    console.log('Storing bank (legacy input):', inputElement?.id);
  }

  if (!file) {
    console.log('Bank failed to be loaded: No file was selected or posted');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const arrayBuffer = e.target.result; // The result is now an ArrayBuffer
    const buffer = new Uint8Array(arrayBuffer); // Convert to Uint8Array for easier byte manipulation

    let offset = 6; // Adjust the starting offset as per the file format
    const numberExpected = (buffer[4] << 8) | buffer[5]; // Check this is correct

    let objectsArray = [];

    for (let i = 0; i < numberExpected; i++) {
      const width = (buffer[offset] << 8) | buffer[offset + 1];
      const height = (buffer[offset + 2] << 8) | buffer[offset + 3];
      const depth = (buffer[offset + 4] << 8) | buffer[offset + 5];
      const hotspotX = (buffer[offset + 6] << 8) | buffer[offset + 7];
      const hotspotY = (buffer[offset + 8] << 8) | buffer[offset + 9];

      const planarGraphicData = [];
      const dataSize = width * 2 * height * depth; // Ensure this calculation is correct

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

    // Initialize colorPalette to hold 32 colors (64 bytes in total)
    let colorPalette = [];

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

    // TODO: loadBank always merges into bank 1 regardless of target bank
    if (bankData[1].sprites.length > 0) {
      // Merge the new sprites and palette with the existing ones
      bankData[1].sprites = [...bankData[1].sprites, ...objectsArray];
      bankData[1].palette = [...bankData[1].palette, ...colorPalette];
    } else {
      console.log('Bank 1 does not exist, creating new bank slot');

      bankData[bank].sprites = objectsArray;
      bankData[bank].palette = colorPalette;
      if (bankData[bank].sprites.length > 0) {
        console.log(
          'Loaded bank slot:',
          bank,
          'with',
          bankData[bank].sprites.length,
          'sprites',
          'and color palette: ',
          bankData[bank].palette,
        );
      } else {
        console.log('Bank', bank, 'failed to be loaded', ' on bank slot:', bank);
      }
      console.log('Bank data updated:', bankData[bank]);
    }
  };

  reader.readAsArrayBuffer(file); // Use readAsArrayBuffer for binary data
}

let tries = 0;

function renderSprite(spriteNumber, x, y, bankImgIndex) {
  if (tries > 40) {
    console.error('Bank not found or could not be loaded');
    // TODO: force reload
    location.reload();
    return;
  }
  if (!bankData[1].sprites[bankImgIndex]) {
    tries++;
    setTimeout(() => {
      renderSprite(spriteNumber, x, y, bankImgIndex);
    }, 200);

    return;
  }

  let { width, height, depth, planarGraphicData } = bankData[1].sprites[bankImgIndex];
  let colorPalette = bankData[1].palette;
  width = width * 16; // Convert width in 16-bit words to pixels

  const pixels = [];
  const bytesPerRow = width / 8;
  const rowSize = bytesPerRow * depth;

  // Build pixels array with hex color values based on the planar graphic data
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      let colorIndex = 0;

      // Build colorIndex by combining bits across planes
      for (let plane = 0; plane < depth; plane++) {
        const byteIndex = row * bytesPerRow + plane * (height * bytesPerRow) + Math.floor(col / 8);
        const bitPos = 7 - (col % 8);
        const bit = (planarGraphicData[byteIndex] >> bitPos) & 1;

        colorIndex |= bit << plane;
      }

      const hexColor = colorPalette[colorIndex];
      pixels.push(hexColor);
    }
  }
  let spriteContainerCheck = document.getElementById('sprite' + spriteNumber);

  // If the sprite container already exists, remove it from the DOM
  if (spriteContainerCheck) {
    spriteContainerCheck.remove();
  }

  // Create a container div for the new sprite
  const spriteContainer = document.createElement('div');
  spriteContainer.style.display = 'grid';
  spriteContainer.style.gridTemplateColumns = 'repeat(' + width + ', 1fr)';
  spriteContainer.style.position = 'absolute';
  spriteContainer.style.left = x + 'px';
  spriteContainer.style.top = y + 'px';
  spriteContainer.id = 'sprite' + spriteNumber; // Assign the ID for future reference
  spriteContainer.style.zIndex = 99999;

  // TODO: Sprite rendering creates one <div> per pixel -> DOM bloat
  // Continue rendering the sprite's pixels
  pixels.forEach((color) => {
    if (color === colorPalette[0]) {
      const pixel = document.createElement('div');
      pixel.style.width = '1px';
      pixel.style.height = '1px';
      pixel.style.backgroundColor = 'transparent';
      spriteContainer.appendChild(pixel);
    } else {
      const pixel = document.createElement('div');
      pixel.style.width = '1px';
      pixel.style.height = '1px';
      pixel.style.backgroundColor = color;
      spriteContainer.appendChild(pixel);
    }
  });

  // Append the container to the document body or a specific container element
  document.getElementById('amos-screen').appendChild(spriteContainer);
}

function getColour(expression) {
  return colorMapping[expression];
}
