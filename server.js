const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'Cardápio Digital API' });
});

// Rota de teste do banco
app.get('/test-db', (req, res) => {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test'
  });
  
  connection.connect(err => {
    if (err) {
      res.json({ erro: err.message });
    } else {
      res.json({ mensagem: 'Conectado ao banco!' });
      connection.end();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
