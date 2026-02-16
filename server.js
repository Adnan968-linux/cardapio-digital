const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: '✅ API funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rota principal
app.get('/', (req, res) => {
    res.json({ 
        nome: 'Cardápio Digital API',
        status: 'online',
        rotas: ['/api/test']
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🔧 Teste: /api/test`);
});