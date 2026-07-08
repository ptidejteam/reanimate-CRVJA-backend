import express from 'express';
import { handleVersions } from '../controllers/versions.controller.js';


const router = express.Router();
 
router.get('/', handleVersions);

export default router;