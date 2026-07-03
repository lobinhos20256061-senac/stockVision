require('dotenv').config();
 
const express = require('express');
const cors = require('cors');
const path = require('path'); // 📂 Módulo nativo para manipulação de caminhos de arquivos
const connectDB = require('./config/database.js');
 
// --- IMPORTAÇÃO DOS ROTEADORES DO ECOSSISTEMA ---
const authRoutes = require('./routes/authRoutes.js');
const stockRoutes = require('./routes/stockRoutes.js');
const esgRoutes = require('./routes/esgRoutes.js');
const supplyRoutes = require('./routes/supplyRoutes.js');
 
// 📈 NOVO ROTEADOR DA PARTE 3 ADICIONADO EXPLICITAMENTE
const salesRoutes = require('./routes/salesRoutes.js');
 
const app = express();
 
// Inicializa a conexão NoSQL com o banco de dados MongoDB
connectDB();
 
// Middlewares Globais de Compartilhamento e Payload JSON
app.use(cors());
app.use(express.json());
 
// --- INJEÇÃO E MAPEAMENTO DAS ROTAS DA API ---
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/esg', esgRoutes);
app.use('/api/supply', supplyRoutes);
 
// 🚀 REGISTRO CRÍTICO: Ativa as rotas de baixa e análise da Curva ABC
app.use('/api/sales', salesRoutes);
 
// --- Configuração do Roteamento Estático no Backend ---
// Define a pasta 'frontend' (que está um nível acima da pasta 'backend') para servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, '../frontend')));
 
// Rota curinga para servir o index.html como a página principal da aplicação
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
 
const PORT = process.env.PORT || 3000;
 
app.listen(PORT, () => {
    console.log(`[Servidor] StockVision operacional e sincronizado na porta ${PORT}`);
});