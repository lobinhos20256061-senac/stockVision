const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Função auxiliar para gerar tokens JWT com segurança e legibilidade
const generateToken = (id) => {
    const payload = { 
        id: id 
    };
    
    const secretKey = process.env.JWT_SECRET || 'secret_stockvision_key';
    
    const options = {
        expiresIn: '1d'
    };

    return jwt.sign(payload, secretKey, options);
};

/**
 * 🏢 REGISTRAR EMPRESA E ADMINISTRADOR
 * POST -> /api/auth/register
 */
exports.registerCompany = async (req, res) => {
    try {
        const { fullname, email, company, password } = req.body;

        // Verifica de forma explícita se o usuário já existe no banco de dados
        const userExists = await User.findOne({ 
            email: email 
        });

        if (userExists) {
            return res.status(400).json({ 
                message: 'Este e-mail já está cadastrado no sistema.' 
            });
        }

        // O primeiro usuário da empresa é gravado com privilégios de Admin
        const user = await User.create({
            fullname: fullname,
            email: email,
            company: company,
            password: password,
            isAdmin: true
        });

        const token = generateToken(user._id);

        return res.status(201).json({
            message: 'Empresa e Administrador cadastrados com sucesso!',
            token: token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                company: user.company,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Erro ao registrar administrador.', 
            error: error.message 
        });
    }
};

/**
 * 🔑 AUTENTICAÇÃO / LOGIN
 * POST -> /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Procura o usuário correspondente ao e-mail fornecido
        const user = await User.findOne({ 
            email: email 
        });

        if (!user) {
            return res.status(401).json({ 
                message: 'Credenciais inválidas. E-mail não localizado.' 
            });
        }

        // Realiza o confronto hash de segurança da senha
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                message: 'Credenciais inválidas. Senha incorreta.' 
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: 'Autenticação efetuada com sucesso!',
            token: token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                company: user.company,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Erro ao efetuar login.', 
            error: error.message 
        });
    }
};

/**
 * 👥 REGISTRAR FUNCIONÁRIO
 * POST -> /api/auth/employees
 */
exports.registerEmployee = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        const userExists = await User.findOne({ 
            email: email 
        });

        if (userExists) {
            return res.status(400).json({ 
                message: 'Este e-mail de funcionário já está em uso.' 
            });
        }

        // Cria o funcionário atrelando-o à mesma empresa do Admin (Multitenancy)
        const employee = await User.create({
            fullname: fullname,
            email: email,
            company: req.user.company, 
            password: password,
            isAdmin: false
        });

        return res.status(201).json({
            message: 'Funcionário credenciado com sucesso na organização!',
            employee: {
                _id: employee._id,
                fullname: employee.fullname,
                email: employee.email,
                company: employee.company,
                isAdmin: employee.isAdmin
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Erro ao cadastrar funcionário.', 
            error: error.message 
        });
    }
};

/**
 * 🔒 RECUPERAÇÃO / REDEFINIÇÃO DE SENHA POR EMAIL
 * POST -> /api/auth/reset-employee-password
 */
exports.resetEmployeePassword = async (req, res) => {
    try {
        const { employeeEmail, newPassword } = req.body;

        if (!employeeEmail || !newPassword) {
            return res.status(400).json({ 
                message: 'O e-mail do funcionário e a nova senha são obrigatórios.' 
            });
        }

        // Regra estrita: O Admin só localiza usuários pertencentes à sua própria organização
        const employee = await User.findOne({ 
            email: employeeEmail, 
            company: req.user.company 
        });

        if (!employee) {
            return res.status(404).json({ 
                message: 'Funcionário não localizado ou não pertence à sua organização.' 
            });
        }

        // Aplica a nova credencial de acesso informada
        employee.password = newPassword;
        await employee.save();

        return res.status(200).json({ 
            message: `Senha do usuário [${employeeEmail}] redefinida com sucesso pela administração corporativa!` 
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Erro ao redefinir credenciais.', 
            error: error.message 
        });
    }
};