const express = require('express');
const router = express.Router();
const reverseController = require('../controllers/reverseController');
const { protect } = require('../middlewares/authMiddleware');

// GET -> Retorna o inventário de itens em quarentena/reversa e o balanço ESG
router.get('/analytics', protect, reverseController.getReverseAnalytics);

// POST -> Registra uma nova entrada de devolução/resíduo na logística reversa
router.post('/return', protect, reverseController.registerReturnItem);

module.exports = router;