const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    sector: { type: String, trim: true, default: 'Não Alocado' },
    row: { type: String, trim: true, required: [true, 'A rua/corredor do galpão é obrigatória.'] },
    building: { type: String, trim: true },
    floor: { type: String, trim: true },
    apartment: { type: String, trim: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    company: { type: String, required: [true, 'A empresa é obrigatória.'], trim: true },
    sku: { type: String, trim: true },
    name: { type: String, required: [true, 'O nome do produto é obrigatório.'], trim: true },
    category: { type: String, trim: true, default: 'Geral' },
    sellingPrice: { type: Number, required: [true, 'O preço de venda é obrigatório.'], min: 0 },
    acquisitionCost: { type: Number, required: [true, 'O custo de aquisição é obrigatório.'], min: 0 },
    supplier: { type: String, trim: true, default: 'Não Definido' },
    isIndeterminateExpiration: { type: Boolean, default: false },
    expirationDate: { type: Date },
    quantityInStock: { type: Number, required: [true, 'A quantidade é obrigatória.'], min: 0, default: 0 },
    minimumStock: { type: Number, required: [true, 'O estoque mínimo é obrigatório.'], min: 0 },
    maximumStock: { type: Number, required: [true, 'O estoque máximo é obrigatório.'], min: 0 },
    location: { type: LocationSchema, required: [true, 'O endereçamento WMS é obrigatório.'] },
    
    /* --- 🔮 NOVOS CAMPOS PARA O MOTOR DE INTELIGÊNCIA ARTIFICIAL --- */
    leadTimeDays: { 
        type: Number, 
        default: 7, // Tempo padrão que o fornecedor leva para entregar (em dias)
        min: 1 
    },
    salesHistory: {
        type: [Number], 
        default: [0, 0, 0] // Representa as vendas dos últimos 3 meses [Mês-3, Mês-2, Mês-1]
    },
    photo: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

ProductSchema.pre('save', function(next) {
    if (this.minimumStock > this.maximumStock) {
        return next(new Error('Regra Logística Violada: O estoque mínimo não pode ser maior do que o estoque máximo.'));
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema);