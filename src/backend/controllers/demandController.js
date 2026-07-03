const Product = require('../models/Product');

/**
 * 🔮 MOTOR DE PREVISÃO DE DEMANDA (Média Móvel Ponderada + Giro de Estoque)
 * GET -> /api/demand/forecast
 */
exports.getDemandForecast = async (req, res) => {
    try {
        const products = await Product.find({ company: req.user.company });
        
        const forecastReport = products.map(p => {
            const history = p.salesHistory || [0, 0, 0];
            
            // 1. Algoritmo MMP (Pesos dinâmicos para simular IA de tendência)
            // Peso 3 para o mês passado (mais recente), Peso 2 para dois meses atrás, Peso 1 para três meses atrás
            const weight3 = history[2] || 0; 
            const weight2 = history[1] || 0;
            const weight1 = history[0] || 0;
            
            const totalWeights = 1 + 2 + 3;
            const predictedDemandNextMonth = Math.ceil(((weight1 * 1) + (weight2 * 2) + (weight3 * 3)) / totalWeights);

            // 2. Cálculo do Consumo Diário Previsto
            const dailyConsumptionPrevisto = predictedDemandNextMonth / 30;

            // 3. Ponto de Pedido (PP = Consumo Diário * Lead Time + Estoque Mínimo de Segurança)
            const leadTime = p.leadTimeDays || 7;
            const pontoDePedido = Math.ceil((dailyConsumptionPrevisto * leadTime) + p.minimumStock);

            // 4. Giro de Estoque Estimado (Vendas / Estoque Médio)
            const estoqueMedio = (p.maximumStock + p.minimumStock) / 2 || 1;
            const giroEstoque = parseFloat((predictedDemandNextMonth / estoqueMedio).toFixed(2));

            // 5. Decisão de Compra Automatizada (Gatilho Preditivo)
            const statusCritico = p.quantityInStock <= pontoDePedido;
            let sugestaoCompraQtd = 0;
            let acaoRecomendada = "Estoque Calibrado";

            if (statusCritico) {
                // Sugere comprar o suficiente para atingir o Estoque Máximo de segurança
                sugestaoCompraQtd = p.maximumStock - p.quantityInStock;
                if (sugestaoCompraQtd < 0) sugestaoCompraQtd = 0;
                acaoRecomendada = "🚨 Emitir Ordem de Compra Urgente";
            } else if (p.quantityInStock < pontoDePedido * 1.2) {
                acaoRecomendada = "⚠️ Atenção: Monitorar Próxima Semana";
            }

            // Estimativa Financeira do Pedido de Compra
            const investimentoEstimado = sugestaoCompraQtd * p.acquisitionCost;

            return {
                _id: p._id,
                name: p.name,
                sku: p.sku || 'N/A',
                supplier: p.supplier || 'Não Mapeado',
                quantityInStock: p.quantityInStock,
                minimumStock: p.minimumStock,
                pontoDePedido: pontoDePedido,
                giroEstoque: giroEstoque,
                predictedDemand: predictedDemandNextMonth,
                sugestaoCompra: sugestaoCompraQtd,
                investimentoEstimado: investimentoEstimado,
                acao: acaoRecomendada,
                criticidade: statusCritico ? "danger" : (p.quantityInStock < pontoDePedido * 1.2 ? "warning" : "success")
            };
        });

        return res.status(200).json(forecastReport);
    } catch (error) {
        console.error('[Controller Demand - Forecast Error]:', error.message);
        return res.status(500).json({ message: 'Erro ao processar modelo preditivo.', error: error.message });
    }
};

/**
 * 🛠️ INJETAR DADOS DE SUCESSO (STUB DIDÁTICO PARA OS ALUNOS TESTAREM)
 * POST -> /api/demand/mock-history/:id
 */
exports.injectMockHistory = async (req, res) => {
    try {
        const { salesHistory, leadTimeDays } = req.body;
        const updated = await Product.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            { $set: { salesHistory, leadTimeDays } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Produto não encontrado.' });
        return res.status(200).json({ message: 'Dados de IA injetados com sucesso para o produto!', product: updated });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};