import { transpileCode } from '#root/src/services/transpiler.service.js';

export const handleTranspile = (req, res) => {
  // 1. Extract data from the request body
  const { code, version } = req.body;

  // 2. Validate input
  if (typeof code !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a valid string in the "code" field.' 
    });
  }

  // 3. Call the service to do the actual work
  const transpileResult = transpileCode(code, version);

  // 4. Send the successful HTTP response
  return res.status(200).json({
    message: '(AMOS -> JavaScript) Successfully transpiled.',
    version: version || '2.0.0',
    data: transpileResult
  });
};