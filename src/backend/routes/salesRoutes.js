const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Importação do middleware de barreira e segurança de sessão JWT
const { protect } = require('../middlewares/authMiddleware');

/**
 * --- 📈 ROTAS DE MOVIMENTAÇÃO E CURVA ABC (PROTEGIDAS) ---
 */

// GET -> Retorna o ranking analítico de giro, produtos mais vendidos e obsoletos
router.get('/analytics', protect, salesController.getSalesAnalytics);

// POST -> Registra uma nova baixa física de saída/venda de um material do estoque
router.post('/checkout', protect, salesController.registerProductOutput);

module.exports = router;