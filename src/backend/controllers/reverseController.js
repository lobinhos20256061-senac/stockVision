const Product = require('../models/Product');

// Simulação de uma coleção em memória para resíduos e devoluções ecológicas (Isolada por empresa)
let mockReverseDatabase = [];

/**
 * ♻️ BUSCAR MÉTRICAS E ITENS DA LOGÍSTICA REVERSA / ESG
 * GET -> /api/reverse/analytics
 */
exports.getReverseAnalytics = async (req, res) => {
    try {
        const userCompany = req.user.company;

        // Filtra os itens devolvidos atrelados à empresa logada
        const companyReturns = mockReverseDatabase.filter(item => item.company === userCompany);

        // Cálculos de Indicadores ESG baseados nos retornos
        let totalWeightRecycled = 0; // em kg
        let co2Mitigated = 0; // em kg de CO2
        let totalItemsProcessed = 0;

        companyReturns.forEach(item => {
            totalItemsProcessed += item.quantity;
            totalWeightRecycled += (item.quantity * 0.5); // Peso médio didático: 500g por item
        });

        // Fórmula ecológica didática: Cada kg reciclado evita 2.5kg de emissão de CO2 na atmosfera
        co2Mitigated = parseFloat((totalWeightRecycled * 2.5).toFixed(2));

        return res.status(200).json({
            metrics: {
                totalItemsProcessed,
                totalWeightRecycled: Math.ceil(totalWeightRecycled),
                co2Mitigated
            },
            items: companyReturns
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao consolidar balanço ESG.', error: error.message });
    }
};

/**
 * 📥 REGISTRAR RETORNO DE MATERIAL (POST -> /api/reverse/return)
 */
exports.registerReturnItem = async (req, res) => {
    try {
        const { productName, quantity, reason, destination } = req.body;

        if (!productName || !quantity || !reason || !destination) {
            return res.status(400).json({ message: 'Todos os campos ecológicos são obrigatórios.' });
        }

        const newReturn = {
            _id: `REV-${Date.now()}`,
            company: req.user.company,
            productName,
            quantity: parseInt(quantity, 10),
            reason, // Ex: "Vencimento Crítico", "Defeito de Fábrica", "Descarte de Resíduo"
            destination, // Ex: "Reciclagem Homologada", "Doação / Reuso", "Incuneração Ecológica"
            processedAt: new Date().toLocaleDateString('pt-BR')
        };

        mockReverseDatabase.push(newReturn);

        // Regra de Negócio WMS Reativa: Se o motivo for defeito ou vencimento, decrementa do estoque comercial
        const product = await Product.findOne({ name: productName, company: req.user.company });
        if (product) {
            product.quantityInStock -= parseInt(quantity, 10);
            if (product.quantityInStock < 0) product.quantityInStock = 0;
            await product.save();
        }

        return res.status(201).json({
            message: 'Fluxo de Logística Reversa aberto e registrado no balanço ESG!',
            item: newReturn
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};