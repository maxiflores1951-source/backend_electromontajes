const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/login', (req, res) => {
  res.json({ mensaje: 'TEST: Login funcionando' });
});

const PORT = 3400;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TEST: Servidor en puerto ${PORT}`);
});