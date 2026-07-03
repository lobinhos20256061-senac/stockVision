const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const inventoryController = require('../controllers/inventoryController');

// Importa o middleware de segurança e governança corporativa
const { protect } = require('../middlewares/authMiddleware');

// --- ROTAS DO CORE LOGÍSTICO (PROTEGIDAS POR TOKEN JWT) ---

router.post('/', protect, stockController.createProduct);
router.get('/', protect, stockController.listProducts);
router.get('/metrics', protect, stockController.getDashboardMetrics);

/**
 * @route   PUT /api/stock/:id
 * @desc    Atualizar parâmetros comerciais e reendereçamento WMS do material
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const Product = require('../models/Product');
        
        // Atualiza aplicando barreira estrita de empresa (Multitenancy)
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Material não localizado ou acesso não autorizado.' });
        }

        return res.status(200).json({ 
            message: 'Parâmetros logísticos consolidados com sucesso!', 
            product: updatedProduct 
        });
    } catch (error) {
        console.error('[Route Stock - Update Error]:', error.message);
        return res.status(400).json({ message: 'Divergência na validação dos campos.', error: error.message });
    }
});

/**
 * @route   DELETE /api/stock/:id
 * @desc    Remover permanentemente um lote ou insumo do inventário NoSQL
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const deletedProduct = await Product.findOneAndDelete({ _id: req.params.id, company: req.user.company });
        
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Produto não localizado para exclusão.' });
        }
        return res.status(200).json({ message: 'Material removido permanentemente do inventário NoSQL!' });
    } catch (error) {
        console.error('[Route Stock - Delete Error]:', error.message);
        return res.status(500).json({ message: 'Erro interno ao remover material.', error: error.message });
    }
});

// --- ⚖️ ROTAS DE AUDITORIA, INVENTÁRIO ROTATIVO E INGESTÃO DE NOTAS ---
router.get('/inventory/rotative', protect, inventoryController.getRotativeInventorySheet);
router.post('/inventory/general', protect, inventoryController.processGeneralInventory);
router.post('/invoice/xml', protect, stockController.importInvoiceXml);

module.exports = router;