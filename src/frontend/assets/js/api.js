/**
 * STOCKVISION - CENTRAL DE COMUNICAÇÃO COM A API (fetch)
 * Este arquivo centraliza todas as chamadas HTTP para o servidor Node.js.
 */

const BASE_URL = 'https://stockvision-d2r0.onrender.com/api';

// const BASE_URL = 'http://localhost:3000/api';

/**
 * 💾 GERENCIADOR DE SESSÃO LOCAL (LocalStorage)
 */
const TokenManager = {
    saveToken: (token) => localStorage.setItem('sv_token', token),
    getToken: () => localStorage.getItem('sv_token'),
    clearToken: () => localStorage.removeItem('sv_token'),
    saveUser: (user) => localStorage.setItem('sv_user', JSON.stringify(user)),
    getUser: () => JSON.parse(localStorage.getItem('sv_user')),
    clearAll: () => {
        localStorage.removeItem('sv_token');
        localStorage.removeItem('sv_user');
    }
};

/**
 * 🛡️ MÓDULO DE AUTENTICAÇÃO E GOVERNANÇA CORPORATIVA
 */
const AuthAPI = {
    registerCompany: async (fullname, email, company, password) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, company, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao registrar empresa/usuário.');
            if (data.token) {
                TokenManager.saveToken(data.token);
                TokenManager.saveUser(data.user);
            }
            return data;
        } catch (error) { throw error; }
    },

    login: async (email, password) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha na autenticação.');
            TokenManager.saveToken(data.token);
            TokenManager.saveUser(data.user);
            return data;
        } catch (error) { throw error; }
    },

    registerEmployee: async (fullname, email, password) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/auth/employees`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fullname, email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar funcionário.');
            return data;
        } catch (error) { throw error; }
    }
};

/**
 * 📦 MÓDULO DE OPERAÇÃO DE ESTOQUE, HISTÓRICO, ESG, PREVISÃO DE IA E XML
 */
const StockAPI = {
    getInventory: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao carregar estoque.');
            return data;
        } catch (error) { throw error; }
    },

    getDashboardMetrics: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/metrics`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar indicadores.');
            return data;
        } catch (error) { throw error; }
    },

    getExpirationAlerts: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/esg/expiration-alerts`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao buscar alertas de vencimento.');
            return data.alerts;
        } catch (error) { throw error; }
    },

    createProduct: async (productPayload) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productPayload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar produto no servidor.');
            return data;
        } catch (error) { throw error; }
    },

    updateProduct: async (id, updatedFields) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedFields)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar dados logísticos do produto.');
            return data;
        } catch (error) { throw error; }
    },

    deleteProduct: async (id) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao remover material.');
            return data;
        } catch (error) {
            console.error('[API Stock - Delete Error]:', error.message);
            throw error;
        }
    },

    getDemandForecast: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/demand/forecast`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar análise preditiva da IA.');
            return data;
        } catch (error) {
            console.error('[API Demand - Forecast Error]:', error.message);
            throw error;
        }
    },

    importInvoiceXml: async (xmlData) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/invoice/xml`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ xmlData })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar arquivo fiscal.');
            return data;
        } catch (error) {
            console.error('[API Stock - XML Invoice Error]:', error.message);
            throw error;
        }
    },

    getReverseAnalytics: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/reverse/analytics`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao ler indicadores ESG.');
            return data;
        } catch (error) { throw error; }
    },

    createReverseReturn: async (payload) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/reverse/return`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar manifesto de devolução.');
            return data;
        } catch (error) { throw error; }
    },

    getRotativeSheet: async (category = '', sector = '') => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/inventory/rotative?category=${category}&sector=${sector}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao gerar folha rotativa.');
            return data;
        } catch (error) { throw error; }
    },

    submitInventoryAudit: async (countedItems) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/inventory/general`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ countedItems })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar auditoria.');
            return data;
        } catch (error) { throw error; }
    },

    /**
     * --- 📈 CONECTORES ADICIONADOS PARA A PARTE 3 (MOTORES DE VENDA) ---
     */

    /**
     * GET -> /api/sales/analytics
     */
    getSalesRankingABC: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/sales/analytics`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar a curva ABC.');
            return data;
        } catch (error) { throw error; }
    },

    /**
     * POST -> /api/sales/checkout
     */
    registerProductOutputSale: async (productId, quantitySold) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/sales/checkout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId, quantitySold })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar saída de produto.');
            return data;
        } catch (error) { throw error; }
    }
};