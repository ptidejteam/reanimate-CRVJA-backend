import express from 'express';
import multer from 'multer';
import { parseBankHandler } from '../controllers/banks.controller.js';

const router = express.Router();

// Store uploaded file in memory as a Buffer (req.file.buffer)
const upload = multer({ storage: multer.memoryStorage() });

// 'file' matches the field name appended in FormData on the frontend
router.post('/', upload.single('file'), parseBankHandler);

export default router;
