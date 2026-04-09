const { runViralCycle } = require('./src/scheduler');
const logger = require('./src/logger');

async function testDrive() {
    logger.info('🚀 INICIANDO TESTE REAL DE POSTAGEM DE ELITE...');
    try {
        await runViralCycle();
        logger.info('✅ TESTE CONCLUÍDO! Verifique sua página do Facebook e o console do Dashboard.');
    } catch (error) {
        logger.error('❌ FALHA NO TESTE DE VOO:', error.message);
    }
}

testDrive();
