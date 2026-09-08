import express from 'express';
import multer from 'multer';
import { decodeAmosHandler } from '../controllers/amos-decoder.controller.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function uploadAmosFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'AMOS file exceeds the 5 MB upload limit.' });
    }
    if (error) return next(error);
    return next();
  });
}

router.post('/', uploadAmosFile, decodeAmosHandler);

export default router;
