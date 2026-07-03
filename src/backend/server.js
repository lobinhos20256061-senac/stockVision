require('dotenv').config();

const express = require('express');
const cors = require('cors');
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Servidor] StockVision operacional e sincronizado na porta ${PORT}`);
});