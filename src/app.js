import express from 'express';
import cors from 'cors';
import transpilerRoutes from './routes/transpiler.routes.js';
import versionsRoutes from './routes/versions.routes.js';
import { parseBankRouter, generateBankRouter } from './routes/banks.routes.js';
import amosDecoderRoutes from './routes/amos-decoder.routes.js';

const app = express();

app.use(express.json());

// process.env.FRONTEND_BASE_URL will be set in your production server's dashboard
const allowedOrigin = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    optionsSuccessStatus: 200,
  }),
);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CRVJA 🍺',
  });
});

app.use('/api/transpile', transpilerRoutes);

app.use('/api/versions', versionsRoutes);

app.use('/api/parse-bank-file', parseBankRouter);

app.use('/api/generate-bank-file', generateBankRouter);

app.use('/api/decode-amos', amosDecoderRoutes);

export default app;
