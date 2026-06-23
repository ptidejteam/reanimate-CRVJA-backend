import express from 'express';

const app = express();

// Standard middleware
app.use(express.json());

app.get('/api', (req, res) => {
  res.status(200).send('Hello, World!');
});

export default app;