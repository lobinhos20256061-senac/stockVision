 const Product = require('../models/Product');

/**
 * 📋 GERAR FOLHA DE CONTAGEM PARA INVENTÁRIO ROTATIVO (CONTAGEM CEGA)
 * GET -> /api/stock/inventory/rotative
 */
exports.getRotativeInventorySheet = async (req, res) => {
    try {
        const { category, sector } = req.query;
        let filter = { company: req.user.company };

        if (category) filter.category = category;
        if (sector) filter['location.sector'] = sector.toUpperCase();

        const products = await Product.find(filter);

        // Mapeamento para a equipe de conferência de Doca (Sem expor a quantidade do sistema)
        const sheet = products.map(p => ({
            _id: p._id,
            sku: p.sku || 'N/A',
            name: p.name,
            category: p.category,
            location: `${p.location.sector}-R${p.location.row}-Vão${p.location.apartment}`
        }));

        return res.status(200).json(sheet);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao gerar folha de contagem rotativa.', error: error.message });
    }
};

/**
 * ⚖️ PROCESSAR E AUDITAR INVENTÁRIO (CONFRONTO DE SALDOS E AJUSTE NOSQL)
 * POST -> /api/stock/inventory/general
 */
exports.processGeneralInventory = async (req, res) => {
    try {
        const { countedItems } = req.body; // Array de objetos: [{ productId, physicalQty }]

        if (!countedItems || !Array.isArray(countedItems)) {
            return res.status(400).json({ message: 'Dados de contagem física malformatados ou vazios.' });
        }

        const auditReport = [];

        for (const item of countedItems) {
            const product = await Product.findOne({ _id: item.productId, company: req.user.company });
            
            if (product) {
                const systemQty = product.quantityInStock;
                const physicalQty = parseInt(item.physicalQty, 10);
                const divergenceQty = physicalQty - systemQty; // Negativo = Perda, Positivo = Sobra
                const financialImpact = divergenceQty * product.acquisitionCost;

                // REATIVIDADE NOSQL: Ajusta e calibra o saldo físico real do banco de dados imediatamente
                product.quantityInStock = physicalQty;
                await product.save();

                auditReport.push({
                    productId: product._id,
                    name: product.name,
                    sku: product.sku,
                    systemQty,
                    physicalQty,
                    divergenceQty,
                    financialImpact: parseFloat(financialImpact.toFixed(2)),
                    status: divergenceQty === 0 ? "Conforme" : (divergenceQty < 0 ? "Quebra/Perda" : "Sobra")
                });
            }
        }

        return res.status(200).json({
            message: "Auditoria de inventário processada! Saldos NoSQL sincronizados com a realidade física.",
            report: auditReport
        });
    } catch (error) {
        console.error('[Controller Inventory - Audit Error]:', error.message);
        return res.status(500).json({ message: 'Erro ao processar conciliação do inventário.', error: error.message });
    }
};