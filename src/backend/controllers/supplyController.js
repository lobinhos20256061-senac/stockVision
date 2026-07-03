const Product = require('../models/Product');
const Partner = require('../models/Partner');

/**
 * 🔮 ALGORITMO PREDITIVO: PREVISÃO DE DEMANDA E GERAÇÃO DE ORDENS AUTOMÁTICAS
 * Aplica a fórmula: Previsão de Demanda = Soma das Vendas / Número de Períodos
 * E cruza com os melhores prazos e preços de fornecedores cadastrados.
 */
exports.generateAutomatedOrders = async (req, res) => {
    try {
        const companyName = req.user.company;

        // 1. Coleta todos os produtos cadastrados pela empresa
        const products = await Product.find({ company: companyName });
        
        if (products.length === 0) {
            return res.status(200).json({ message: 'Nenhum produto cadastrado para análise de demanda.', ordensGeradas: [] });
        }

        let automatedOrderList = [];

        for (let product of products) {
            // MOCK DE HISTÓRICO: Simula as saídas das últimas 4 semanas (Períodos analisados)
            // Em uma estrutura expandida, essas variáveis viriam de uma tabela de 'SalesHistory'
            const historicoSaidasSemanais = 0
            const somaVendas = historicoSaidasSemanais.reduce((acc, v) => acc + v, 0);
            
            // FÓRMULA LOGÍSTICA: Previsão de Demanda Simples
            const previsaoDemandaProximaSemana = somaVendas / historicoSaidasSemanais.length;

            // REGRA OPERACIONAL: O sistema calcula se o estoque atual cobre a demanda prevista + nível de segurança (Mínimo)
            if (product.quantityInStock <= product.minimumStock || product.quantityInStock < previsaoDemandaProximaSemana) {
                
                // FÓRMULA DE REPOSIÇÃO ALVO: Quantidade ideal para atingir o estoque máximo estipulado
                const quantidadeIdealCompra = product.maximumStock - product.quantityInStock;

                if (quantidadeIdealCompra <= 0) continue;

                // 2. MOTOR DE SELEÇÃO DE FORNECEDORES (IA DO ENUNCIADO)
                // Busca fornecedores homologados para a categoria específica deste produto
                const candidatePartners = await Partner.find({ categorySupplied: product.category });

                let selectedPartner = null;

                if (candidatePartners.length > 0) {
                    // Algoritmo de Triagem da IA: Ordena priorizando menor prazo de entrega e menor faixa de preço
                    candidatePartners.sort((a, b) => {
                        // Compara prazo de entrega (menor é melhor)
                        if (a.deliveryDays !== b.deliveryDays) {
                            return a.deliveryDays - b.deliveryDays;
                        }
                        // Se empatar no prazo, escolhe por nível de preço (Baixo > Médio > Alto)
                        const pesoPreco = { 'Baixo': 1, 'Médio': 2, 'Alto': 3 };
                        return pesoPreco[a.priceTier] - pesoPreco[b.priceTier];
                    });
                    
                    selectedPartner = candidatePartners; // Seleciona o melhor pontuado
                }

                // Determina datas com base nos prazos do fornecedor eleito
                const dataPedido = new Date();
                const dataEntregaEsperada = new Date();
                const prazosDias = selectedPartner ? selectedPartner.deliveryDays : 7; // Default 7 dias se não houver parceiro
                dataEntregaEsperada.setDate(dataPedido.getDate() + prazosDias);

                // 3. ESTRUTURAÇÃO DA ORDEM DE COMPRA AUTOMÁTICA
                automatedOrderList.push({
                    produto: product.name,
                    sku: product.sku,
                    quantidadeSugerida: quantidadeIdealCompra,
                    previsaoDemandaBase: previsaoDemandaProximaSemana,
                    estadoUrgencia: product.quantityInStock === 0 ? 'Sim' : 'Não',
                    dataPedido,
                    dataEntregaEsperada,
                    fornecedorSugerido: selectedPartner ? {
                        id: selectedPartner._id,
                        empresa: selectedPartner.companyName,
                        prazoDias: selectedPartner.deliveryDays,
                        faixaPreco: selectedPartner.priceTier,
                        condicaoPagamento: selectedPartner.paymentCondition
                    } : { empresa: 'Nenhum fornecedor homologado para esta categoria', prazoDias: 7, faixaPreco: 'Média' },
                    observacao: `Ordem gerada automaticamente por IA. Gatilho: Estoque atual (${product.quantityInStock} un) abaixo do nível crítico.`
                });
            }
        }

        return res.status(200).json({
            message: `Processamento de Supply Chain concluído. Foram geradas ${automatedOrderList.length} sugestões de ordens de compra automáticas.`,
            timestamp: new Date(),
            ordensGeradas: automatedOrderList
        });

    } catch (error) {
        return res.status(500).json({ message: 'Erro no motor preditivo de demanda.', error: error.message });
    }
};

/**
 * 🤝 CADASTRO MANUAL DE PARCEIROS (FORNECEDORES)
 */
exports.createPartner = async (req, res) => {
    try {
        const newPartner = await Partner.create(req.body);
        return res.status(201).json({ message: 'Fornecedor cadastrado com sucesso para cotações!', partner: newPartner });
    } catch (error) {
        return res.status(400).json({ message: 'Erro ao cadastrar fornecedor.', error: error.message });
    }
};