const Product = require('../models/Product');

/**
 * 📊 MOTOR DE CÁLCULO LOGÍSTICO (FUNÇÃO AUXILIAR UNIVERSAL)
 * Centraliza as regras de negócio para garantir consistência absoluta entre telas.
 */
const calculateVisualStatus = (quantity, min, max) => {
    if (quantity <= 0) {
        return { alertColor: 'red', statusTag: 'Ruptura' };
    }
    if (quantity < min) {
        return { alertColor: 'red', statusTag: 'Estoque Baixo' }; // Vermelho para criticidade de compra
    }
    if (quantity > max) {
        return { alertColor: 'orange', statusTag: 'Excesso' }; // Laranja para alertar sobrecapitalização
    }
    return { alertColor: 'green', statusTag: 'Normal' }; // Verde para operação segura
};

/**
 * 📦 LISTAR PRODUTOS (GET -> /api/stock)
 */
exports.listProducts = async (req, res) => {
    try {
        // Aplica o isolamento corporativo (Multitenancy)
        const products = await Product.find({ company: req.user.company });
        
        // Mapeia os produtos injetando o status visual calibrado em tempo de execução
        const mappedProducts = products.map(p => {
            const prodObj = p.toObject();
            prodObj.statusVisual = calculateVisualStatus(
                prodObj.quantityInStock,
                prodObj.minimumStock,
                prodObj.maximumStock
            );
            return prodObj;
        });

        return res.status(200).json(mappedProducts);
    } catch (error) {
        console.error('[Controller Stock - List Error]:', error.message);
        return res.status(500).json({ message: 'Erro interno ao listar inventário.', error: error.message });
    }
};

/**
 * 📥 CADASTRAR PRODUTO (POST -> /api/stock)
 */
exports.createProduct = async (req, res) => {
    try {
        const { name, category, acquisitionCost, sellingPrice, quantityInStock, minimumStock, maximumStock, isIndeterminateExpiration, expirationDate, location } = req.body;

        // Geração de SKU incremental baseado em Timestamp para simulação de código de barras
        const generatedSku = `SKU-${Date.now()}`;

        const newProduct = new Product({
            company: req.user.company, // Vincula à empresa do token logado
            sku: generatedSku,
            name,
            category,
            acquisitionCost,
            sellingPrice,
            quantityInStock,
            minimumStock,
            maximumStock,
            isIndeterminateExpiration,
            expirationDate: isIndeterminateExpiration ? null : expirationDate,
            location
        });

        await newProduct.save();
        return res.status(201).json({ message: 'Insumo lançado e endereçado com sucesso no armazém!', product: newProduct });
    } catch (error) {
        console.error('[Controller Stock - Create Error]:', error.message);
        return res.status(400).json({ message: 'Falha ao processar lançamento.', error: error.message });
    }
};

/**
 * 📈 INDICADORES DO DASHBOARD (GET -> /api/stock/metrics)
 */
exports.getDashboardMetrics = async (req, res) => {
    try {
        const products = await Product.find({ company: req.user.company });

        let totalRevenue = 0;
        let totalCosts = 0;
        let totalItemsVolume = 0;

        products.forEach(p => {
            totalRevenue += (p.sellingPrice * p.quantityInStock);
            totalCosts += (p.acquisitionCost * p.quantityInStock);
            totalItemsVolume += p.quantityInStock;
        });

        const estimatedProfit = totalRevenue - totalCosts;

        return res.status(200).json({
            financials: {
                totalRevenue,
                totalCosts,
                estimatedProfit
            },
            indicators: {
                stockLevel: totalItemsVolume
            }
        });
    } catch (error) {
        console.error('[Controller Stock - Metrics Error]:', error.message);
        return res.status(500).json({ message: 'Erro ao consolidar indicadores logísticos.', error: error.message });
    }
};

/**
 * ♻️ ALERTAS ESG VENCIMENTOS (GET -> /api/esg/expiration-alerts)
 */
exports.getExpirationAlerts = async (req, res) => {
    try {
        // Busca apenas produtos com validade estrita da empresa logada
        const products = await Product.find({ 
            company: req.user.company, 
            isIndeterminateExpiration: false,
            expirationDate: { $ne: null }
        });

        const activeAlerts = [];
        const today = new Date();

        products.forEach(p => {
            const expDate = new Date(p.expirationDate);
            const timeDiff = expDate.getTime() - today.getTime();
            const diasRestantes = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            // Filtro ecológico: Janela crítica de risco de descarte (vence em até 6 meses / 180 dias)
            if (diasRestantes <= 180 && diasRestantes > 0) {
                activeAlerts.push({
                    productId: p._id,
                    productName: p.name,
                    sku: p.sku,
                    quantity: p.quantityInStock,
                    diasRestantes: diasRestantes
                });
            }
        });

        // Ordena do mais urgente para o menos urgente
        activeAlerts.sort((a, b) => a.diasRestantes - b.diasRestantes);

        return res.status(200).json({ alerts: activeAlerts });
    } catch (error) {
        console.error('[Controller ESG - Alerts Error]:', error.message);
        return res.status(500).json({ message: 'Erro ao processar análise preditiva ESG.', error: error.message });
    }
};

/**
 * 📥 IMPORTAÇÃO AUTOMÁTICA EM LOTE VIA XML DE NOTA FISCAL (NF-e)
 * POST -> /api/stock/invoice/xml
 */
exports.importInvoiceXml = async (req, res) => {
    try {
        const { xmlData } = req.body;

        if (!xmlData || xmlData.trim() === '') {
            return res.status(400).json({ message: 'Conteúdo XML inválido ou vazio.' });
        }

        // Extração do Nome do Fornecedor (Tag <xNome> interna ao bloco <emit>)
        const emitNomeMatch = xmlData.match(/<emit>[\s\S]*?<xNome>([\s\S]*?)<\/xNome>/);
        const supplierName = emitNomeMatch ? emitNomeMatch[1].trim() : "Fornecedor XML";

        // Isolamento de todos os blocos de produtos detalhados (<det>)
        const productBlocks = xmlData.match(/<det nItem=".*?">[\s\S]*?<\/det>/g);

        if (!productBlocks || productBlocks.length === 0) {
            return res.status(400).json({ message: 'Nenhum produto estruturado no padrão NF-e (<det>) foi localizado no XML.' });
        }

        const processedItems = [];

        for (const block of productBlocks) {
            const nameMatch = block.match(/<xProd>([\s\S]*?)<\/xProd>/);
            const qtyMatch = block.match(/<qCom>([\s\S]*?)<\/qCom>/);
            const priceMatch = block.match(/<vUnCom>([\s\S]*?)<\/vUnCom>/);

            if (nameMatch && qtyMatch && priceMatch) {
                const name = nameMatch[1].trim();
                const quantity = Math.ceil(parseFloat(qtyMatch[1]));
                const costPrice = parseFloat(priceMatch[1]);
                const sellingPrice = parseFloat((costPrice * 1.5).toFixed(2)); // Sugestão didática: 50% de markup

                let product = await Product.findOne({ name: name, company: req.user.company });

                if (product) {
                    // Se o item já existir: soma o estoque e atualiza parâmetros mercantis
                    product.quantityInStock += quantity;
                    product.acquisitionCost = costPrice;
                    product.sellingPrice = sellingPrice;
                    product.supplier = supplierName;
                    await product.save();
                    processedItems.push({ name, action: `Estoque Incrementado (+${quantity} un)` });
                } else {
                    // Se for novo: instancia e aloca na Doca de conferência padrão WMS
                    const generatedSku = `SKU-XML-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    product = new Product({
                        company: req.user.company,
                        sku: generatedSku,
                        name: name,
                        category: "Importado via NF-e",
                        acquisitionCost: costPrice,
                        sellingPrice: sellingPrice,
                        quantityInStock: quantity,
                        minimumStock: Math.ceil(quantity * 0.3), // Margem padrão didática de 30%
                        maximumStock: Math.ceil(quantity * 2),
                        supplier: supplierName,
                        isIndeterminateExpiration: true,
                        location: {
                            sector: "RECEBIMENTO",
                            row: "DOCA 01",
                            building: "CONFERENCIA",
                            floor: "NIVEL 0",
                            apartment: "PALLET-TRIAGEM"
                        }
                    });
                    await product.save();
                    processedItems.push({ name, action: `Novo Produto Cadastrado e Endereçado (${quantity} un)` });
                }
            }
        }

        return res.status(200).json({
            message: `Nota Fiscal do fornecedor "${supplierName}" processada com sucesso!`,
            summary: processedItems
        });

    } catch (error) {
        console.error('[Controller Stock - XML Import Error]:', error.message);
        return res.status(500).json({ message: 'Erro crítico ao realizar o parse estrutural da NF-e.', error: error.message });
    }
};

// --- STUBS ADICIONAIS DA GRADE CURRICULAR ---
exports.processGeneralInventory = async (req, res) => { return res.status(501).json({ message: 'Rota pronta para Auditoria de Inventário Geral.' }); };
exports.getRotativeInventorySheet = async (req, res) => { return res.status(501).json({ message: 'Rota pronta para Cronograma de Contagem Rotativa.' }); };