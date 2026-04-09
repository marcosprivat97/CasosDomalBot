require('dotenv').config();
const logger = require('./logger');

// Validação Crítica de Ambiente
const requiredEnv = ['GROQ_API_KEY', 'FB_PAGE_ID', 'FB_ACCESS_TOKEN', 'HF_TOKEN'];
const missing = requiredEnv.filter(key => !process.env[key]);

if (missing.length > 0) {
    logger.error('CRITICAL: Variáveis de ambiente faltando no .env:');
    missing.forEach(key => logger.error(` -> ${key}`));
    logger.error('O robô não pode continuar sem essas chaves. Verifique seu arquivo .env');
    process.exit(1);
}

require('./scheduler');
logger.info('🚀 Antigravity Bot v6.0-PRO (Casos Domal) iniciado com sucesso!');
