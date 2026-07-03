const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * MIDDLEWARE: protect
 * Objetivo: Intercepta a requisição, extrai o Token JWT do cabeçalho (Header),
 * valida-o e anexa o usuário autenticado ao objeto da requisição (req.user).
 */
const protect = async (req, res, next) => {
    let token;

    // Verifica se o token foi enviado no cabeçalho Authorization no padrão 'Bearer <TOKEN>'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // CORREÇÃO AQUI: Adicionado o [1] para pegar apenas a string do hash JWT, descartando a palavra 'Bearer'
            token = req.headers.authorization.split(' ')[1];

            // Decodifica e valida o token usando a chave secreta global
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Busca o usuário correspondente no banco de dados, excluindo o campo da senha por segurança
            req.user = await User.findById(decoded.id).select('-password');

            // Verifica se o usuário ainda existe no sistema
            if (!req.user) {
                return res.status(401).json({ message: 'Acesso negado. Usuário não encontrado no sistema.' });
            }

            // Verifica se a conta corporativa foi desativada pelo ADM
            if (!req.user.isActive) {
                return res.status(403).json({ message: 'Acesso negado. Esta conta corporativa foi desativada.' });
            }

            // Tudo correto! Avança para o próximo middleware ou controller
            return next();

        } catch (error) {
            // Dica pedagógica: Exibe o erro real no terminal do VS Code para ajudar no debug em aula
            console.error('[Middleware Protect Error]:', error.message);
            return res.status(401).json({ message: 'Acesso negado. Token de autenticação inválido ou expirado.' });
        }
    }

    // Se nenhum token foi fornecido no cabeçalho
    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token de autenticação não fornecido.' });
    }
};

/**
 * MIDDLEWARE: admin
 * Objetivo: Bloqueia o acesso caso o usuário logado (já validado pelo middleware protect)
 * não possua privilégios de Administrador (isAdmin === false).
 */
const admin = (req, res, next) => {
    // Como o middleware 'protect' roda antes, já temos o req.user preenchido com segurança
    if (req.user && req.user.isAdmin) {
        return next(); // Usuário é ADM, permite o acesso à rota
    } else {
        return res.status(403).json({ 
            message: 'Acesso restrito. Esta operação exige credenciais de Administrador (ADM).' 
        });
    }
};

module.exports = { protect, admin };