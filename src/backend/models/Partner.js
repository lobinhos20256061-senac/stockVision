const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, 'O nome da empresa parceira é obrigatório.'],
        trim: true
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    paymentCondition: {
        type: String,
        required: true,
        enum: ['Pix', 'Boleto', 'À Vista', 'Crédito']
    },
    deliveryDays: {
        type: Number, // Prazo de entrega convertido estritamente em dias úteis
        required: [true, 'O prazo de entrega em dias é obrigatório para o cálculo da IA.']
    },
    priceTier: {
        type: String,
        required: true,
        enum: ['Baixo', 'Médio', 'Alto']
    },
    categorySupplied: {
        type: String,
        required: true,
        trim: true // Categoria de produtos que este parceiro atende
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Partner', PartnerSchema);