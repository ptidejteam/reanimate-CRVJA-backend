import { processCode } from '../services/transpiler.service.js';

export const transpileCode = (req, res) => {
  // 1. Extract data from the request body
  const { code } = req.body;

  // 2. Validate input
  if (typeof code !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a valid string in the "code" field.' 
    });
  }

  // 3. Call the service to do the actual work
  const jsTranspiledCode = processCode(code);

  // 4. Send the successful HTTP response
  return res.status(200).json({
    success: true,
    message: '(AMOS -> JavaScript) Successfully transpiled.',
    data: {
      jsTranspiledCode: jsTranspiledCode
    }
  });
};