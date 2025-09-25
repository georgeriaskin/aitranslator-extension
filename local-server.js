const express = require('express');
const handlerImport = require('./api/translate.js');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API server running' });
});

app.post('/api/translate', async (req, res) => {
  const handler = handlerImport.default;
  await handler(req, res);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
});