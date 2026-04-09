require('dotenv').config();
const { runViralCycle } = require('./src/scheduler');
const logger = require('./src/logger');

/**
 * Script de Teste "Maestria Viral"
 * Este script executa um ciclo completo de postagem idêntico ao que o agendador faria.
 */
async function testFlight() {
    logger.info('--- 🚀 INICIANDO TESTE DE VÔO: MARKETING ESPECIALISTA ---');

    try {
        const result = await runViralCycle();
        logger.info('--- ✅ TESTE CONCLUÍDO COM SUCESSO! ---');
        logger.info(`Post ID no Facebook: ${result.id}`);
    } catch (err) {
        logger.error(`--- ❌ FALHA NO TESTE: ${err.message}`);
        if (err.response) {
            logger.error('Detalhes do Erro FB: ' + JSON.stringify(err.response.data));
        }
        process.exit(1);
    }
}

testFlight();
