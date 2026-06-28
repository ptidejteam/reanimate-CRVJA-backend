import express from 'express';
import { handleTranspile } from '../controllers/transpiler.controller.js';

const router = express.Router();
 
// The base path (e.g., /api/transpile) is defined in app.js
router.post('/', handleTranspile);

export default router;