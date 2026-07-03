const mongoose = require('mongoose');

const ReverseLogisticsSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'A ocorrência precisa estar vinculada a uma empresa.'],
        trim: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'O produto original é obrigatório.']
    },
    productName: {
        type: String,
        required: [true, 'O nome do produto no momento da avaria é obrigatório.']
    },
    sku: {
        type: String,
        trim: true
    },
    lote: {
        type: String,
        required: [true, 'O lote do produto é obrigatório para rastreabilidade.']
    },
    quantity: {
        type: Number,
        required: [true, 'A quantidade de itens retirados do estoque comum é obrigatória.'],
        min: [1, 'A quantidade mínima para abertura de ocorrência é 1 unidade.']
    },
    issueType: {
        type: String,
        required: [true, 'O tipo de problema é obrigatório.'],
        enum: {
            values: ['Avariado', 'Vencido', 'Defeituoso'],
            message: '{VALUE} não é um tipo de problema logístico válido.'
        }
    },
    destinationStatus: {
        type: String,
        enum: ['Pendente', 'Reaproveitamento', 'Descarte Sustentável', 'Reciclagem'],
        default: 'Pendente' // Inicia pendente até que a IA ou o gestor defina o destino
    },
    observations: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ReverseLogistics', ReverseLogisticsSchema);