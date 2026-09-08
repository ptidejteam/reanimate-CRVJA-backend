import express from 'express';
import multer from 'multer';
import { parseBankHandler, generateBankHandler } from '../controllers/banks.controller.js';

export const parseBankRouter = express.Router();
export const generateBankRouter = express.Router();

// Store uploaded file in memory as a Buffer (req.file.buffer)
const upload = multer({ storage: multer.memoryStorage() });

// 'file' matches the field name appended in FormData on the frontend
parseBankRouter.post('/', upload.single('file'), parseBankHandler);
generateBankRouter.post('/', generateBankHandler);

export default parseBankRouter;
