import express from 'express';
import { listVersions } from '../controllers/versions.controller.js';

const router = express.Router();

router.get('/', listVersions);

export default router;
