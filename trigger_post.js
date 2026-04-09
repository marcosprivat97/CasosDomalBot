require('dotenv').config();
const { runViralCycle } = require('./src/scheduler');
const logger = require('./src/logger');

async function trigger() {
    try {
        logger.info('🚀 DISPARANDO POSTAGEM REAL DE CURIOSIDADE (Nicho V7)...');
        const result = await runViralCycle();
        if (result) {
            logger.info('✅ POSTAGEM REALIZADA COM SUCESSO NO FACEBOOK!');
            console.log('FB Response ID:', result.id || result.post_id);
        } else {
            logger.warn('⚠️ O ciclo terminou sem postagem (talvez sem mídia compatível no momento).');
        }
    } catch (err) {
        logger.error('💥 FALHA CRÍTICA NO DISPARO REAL:', err.message);
    }
}

trigger();
