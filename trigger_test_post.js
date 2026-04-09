require('dotenv').config();
const orchestrator = require('./src/agents/orchestrator');
const logger = require('./src/logger');

async function triggerLivePost() {
    logger.important("🚀 Iniciando disparo de postagem REAL para teste do novo sistema visual...");
    
    try {
        // O modo 'false' indica que não é manual, ou seja, ele fará o ciclo completo
        // de Scout, Redação e Geração de Imagem via IA.
        const result = await orchestrator.runViralCycle(false);
        
        if (result && result.success) {
            logger.important(`✅ Postagem concluída com sucesso! Verifique sua página no Facebook.`);
        } else {
            logger.error(`❌ A postagem não foi concluída conforme o esperado.`);
        }
    } catch (error) {
        logger.error(`💥 Falha crítica no disparo de teste: ${error.message}`);
        console.error(error);
    }
}

triggerLivePost();
