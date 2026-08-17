import { parseBankFile } from '../services/banks.service.js';

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
