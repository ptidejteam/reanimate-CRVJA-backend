import {
  AmosDecodeError,
  AmosDecoderConfigurationError,
  decodeAmosFile,
} from '../services/amos-decoder.service.js';

export function decodeAmosHandler(req, res) {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const sourceCode = decodeAmosFile(req.file.buffer);
    return res.status(200).json({ sourceCode });
  } catch (error) {
    if (error instanceof AmosDecodeError) {
      return res.status(400).json({ error: error.message });
    }

    if (!(error instanceof AmosDecoderConfigurationError)) {
      console.error('Unexpected AMOS decoding failure:', error);
    }
    return res.status(500).json({ error: 'AMOS decoder is unavailable.' });
  }
}
