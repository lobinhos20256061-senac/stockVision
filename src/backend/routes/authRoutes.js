const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Importação clara e nominal dos middlewares de segurança e escopo
const { protect, admin } = require('../middlewares/authMiddleware');

/**
 * --- ROTAS PÚBLICAS DE ACESSO ---
 */
router.post('/register', authController.registerCompany);
router.post('/login', authController.login);

/**
 * --- ROTAS PRIVADAS DE COLABORADORES (REQUER AUTENTICAÇÃO) ---
 */
router.post('/employees', protect, authController.registerEmployee);

/**
 * --- ROTAS ADMINISTRATIVAS RESTREITAS (REQUER TOKEN E PERFIL ADMIN) ---
 */
router.post(
    '/reset-employee-password', 
    protect, 
    admin, 
    authController.resetEmployeePassword
);

module.exports = router;