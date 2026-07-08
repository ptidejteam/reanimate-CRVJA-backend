import express from 'express';
import cors from 'cors';
import transpilerRoutes from './routes/transpiler.routes.js';
import versionRoutes from './routes/versions.routes.js';

const app = express();

app.use(express.json());

// process.env.FRONTEND_BASE_URL will be set in your production server's dashboard
const allowedOrigin = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
app.use(cors({ 
  origin: allowedOrigin,
  optionsSuccessStatus: 200
}));


app.get('/', (req, res) => {
  res.status(200).send('CRVJA 🍺');
});


app.use('/api/transpile', transpilerRoutes); 

app.use('/api/versions', versionRoutes);


export default app;