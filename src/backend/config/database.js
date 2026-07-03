const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Liga ao MongoDB utilizando a URI armazenada nas variáveis de ambiente
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[MongoDB] Base de dados ligada com sucesso: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Erro MongoDB] Falha ao ligar ao banco: ${error.message}`);
        // Encerra o processo com falha (1) caso a ligação falte
        process.exit(1);
    }
};

module.exports = connectDB;