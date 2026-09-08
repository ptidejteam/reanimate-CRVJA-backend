import { parseBankFile, generateBankFile } from '../services/banks.service.js';

export async function parseBankHandler(req, res) {
  // Multer attaches the uploaded file object to req.file
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const bankData = await parseBankFile(file);

    return res.status(200).json({
      message: 'Bank File (.abk) obtained.',
      sprites: bankData.sprites,
      palette: bankData.palette,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export async function generateBankHandler(req, res) {
  const { sprites, palette, filename = 'AmosBank_test4.abk' } = req.body || {};

  if (!sprites || !palette) {
    return res.status(400).json({ error: 'Missing bank data: sprites and palette are required.' });
  }

  try {
    const buffer = generateBankFile({ sprites, palette });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
