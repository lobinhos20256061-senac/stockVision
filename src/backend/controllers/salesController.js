const Product = require('../models/Product');

// Banco de dados em memória simulado para armazenar as saídas de forma isolada por empresa
let mockSalesDatabase = [];

/**
 * 📥 REGISTRAR BAIXA / SAÍDA DE PRODUTO
 * POST -> /api/sales/checkout
 */
exports.registerProductOutput = async (req, res) => {
    try {
        const { productId, quantitySold } = req.body;

        if (!productId || !quantitySold) {
            return res.status(400).json({ 
                message: 'O ID do produto e a quantidade de saída são obrigatórios.' 
            });
        }

        const qty = parseInt(quantitySold, 10);

        // Localiza o produto aplicando a trava de isolamento corporativo
        const product = await Product.findOne({ 
            _id: productId, 
            company: req.user.company 
        });

        if (!product) {
            return res.status(404).json({ 
                message: 'Insumo não localizado no inventário desta organização.' 
            });
        }

        // Regra de Negócio: Impede a saída se o volume gerar saldo negativo (Barreira de Ruptura)
        if (product.quantityInStock < qty) {
            return res.status(400).json({ 
                message: `Operação negada. Saldo insuficiente para baixa. Quantidade atual: ${product.quantityInStock} un.` 
            });
        }

        // REATIVIDADE NOSQL: Decrementa fisicamente o estoque comercial do MongoDB
        product.quantityInStock -= qty;
        await product.save();

        // Salva a movimentação no histórico analítico de saídas
        const newSaleRecord = {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            company: req.user.company,
            quantitySold: qty,
            unitCost: product.acquisitionCost,
            unitPrice: product.sellingPrice,
            totalRevenue: qty * product.sellingPrice,
            timestamp: new Date()
        };

        mockSalesDatabase.push(newSaleRecord);

        return res.status(201).json({
            message: 'Baixa de estoque processada e contabilizada no histórico de saídas!',
            record: newSaleRecord
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Erro interno ao processar saída física.', 
            error: error.message 
        });
    }
};

/**
 * 📊 CONSOLIDAR MÉTRICAS DA CURVA ABC, RANKING E ALERTAS DE BAIXO GIRO
 * GET -> /api/sales/analytics
 */
exports.getSalesAnalytics = async (req, res) => {
    try {
        const userCompany = req.user.company;

        // Filtra o histórico de saídas pertencentes à empresa logada
        const companySales = mockSalesDatabase.filter(
            sale => sale.company === userCompany
        );

        // Busca todos os produtos ativos para cruzar dados e encontrar itens parados
        const allProducts = await Product.find({ 
            company: userCompany 
        });

        // Consolida o volume total vendido agrupado por ID de produto
        const productVolumeMap = {};

        companySales.forEach(sale => {
            if (!productVolumeMap[sale.productId]) {
                productVolumeMap[sale.productId] = 0;
            }
            productVolumeMap[sale.productId] += sale.quantitySold;
        });

        // Monta a lista analítica cruzando com os saldos atuais
        const compiledRanking = allProducts.map(product => {
            const totalQtySold = productVolumeMap[product._id] || 0;
            
            // Cálculo do Giro de Estoque Didático: (Quantidade Vendida / Estoque Atual Máximo)
            const baseGiro = product.maximumStock > 0 ? product.maximumStock : 100;
            const giroCalculated = parseFloat(((totalQtySold / baseGiro) * 5).toFixed(2));

            // Classificação Semântica da Velocidade de Giro
            let giroStatus = "Giro Normal";
            let alertColor = "green";

            if (totalQtySold === 0) {
                giroStatus = "🚨 Alerta: Sem Giro (Produto Parado)";
                alertColor = "red";
            } else if (giroCalculated < 1.2) {
                giroStatus = "⚠️ Baixo Giro";
                alertColor = "orange";
            } else if (giroCalculated > 3.5) {
                giroStatus = "🔥 Alto Giro (Mais Vendido)";
                alertColor = "green";
            }

            return {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                supplier: product.supplier || "Não Informado",
                quantityInStock: product.quantityInStock,
                totalSold: totalQtySold,
                giroIndex: giroCalculated,
                giroStatus: giroStatus,
                alertColor: alertColor
            };
        });

        // Ordena o Ranking do mais vendido para o menos vendido (Ordem Decrescente de Saídas)
        compiledRanking.sort((a, b) => b.totalSold - a.totalSold);

        return res.status(200).json(compiledRanking);

    } catch (error) {
        return res.status(500).json({ 
            message: 'Erro ao consolidar relatórios comerciais da Curva ABC.', 
            error: error.message 
        });
    }
};