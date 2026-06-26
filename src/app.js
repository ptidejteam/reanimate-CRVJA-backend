import express from 'express';
import cors from 'cors';
import transpilerRoutes from './routes/transpiler.routes.js'; 

const app = express();

// Standard middleware
app.use(express.json());

// process.env.FRONTEND_BASE_URL will be set in your production server's dashboard
const allowedOrigin = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
app.use(cors({ 
  origin: allowedOrigin,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));


app.get('/', (req, res) => {
  res.status(200).send('CRVJA 🍺');
});

app.get('/api', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is Live!',
  });
});

// Mount the transpiler routes
app.use('/api/transpile', transpilerRoutes); 

export default app;