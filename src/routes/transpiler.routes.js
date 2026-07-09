import express from 'express';
import { transpileHandler } from '../controllers/transpiler.controller.js';

const router = express.Router();

// The base path (e.g., /api/transpile) is defined in app.js
router.post('/', transpileHandler);

export default router;
