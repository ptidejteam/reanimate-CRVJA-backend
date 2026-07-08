import { transpileCode } from '../services/transpiler.service.js';

export async function handleTranspile(req, res) {
  const { code, version } = req.body;

  if (typeof code !== 'string') {      
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a valid string in the "code" field.' 
    });
  }

  const transpileResult = await transpileCode(code, version);

  return res.status(200).json({
    message: '(AMOS -> JavaScript) Successfully transpiled.',
    data: transpileResult
  });
};