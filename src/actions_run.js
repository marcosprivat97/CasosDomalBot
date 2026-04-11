/**
 * CLOUD RUN v1.0 - GITHUB ACTIONS ENTRY POINT
 * Executa um único ciclo de postagem e encerra o processo.
 */
const orchestrator = require('./agents/orchestrator');
const { runVisualLearning } = require('./agents/visual_master.agent');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// CARIMBO DE VERSÃO - PARA GARANTIR QUE O CÓDIGO NOVO ESTÁ RODANDO
console.log("=======================================================");
console.log("🚀 CASOS DOMAL VIRAL BOT - v12.8.0 [AUTO-LEARNING MODE]");
console.log("=======================================================");

async function runCloudCycle() {
    logger.important("🤖 INICIANDO CICLO VIRAL - v12.8.0 - AUTO-LEARNING ENABLED");
    
    try {
        // 0. AUTO-APRENDIZADO (O Robô estuda antes de trabalhar)
        logger.info("🧬 [CYCLE] Acionando Robô Professor para atualização de tendências...");
        try {
            await runVisualLearning();
            logger.info("✅ [LEARNING] Ciclo de aprendizado concluído.");
        } catch (learnError) {
            logger.warn(`⚠️ [LEARNING SKIP] Falha no aprendizado: ${learnError.message}. Seguindo ciclo com base de dados anterior.`);
        }
        
        // 1. Forçar Configuração de Auto-Approve (Necessário para nuvem 24/7)
        const configPath = path.join(__dirname, '..', 'data', 'config.json');
        let config = { isActive: true, autoApprove: true };
        
        if (fs.existsSync(configPath)) {
            config = { ...JSON.parse(fs.readFileSync(configPath, 'utf8')), ...config };
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logger.info("✅ Configuração de Auto-Approve garantida.");

        // 2. Executar Ciclo Viral Profissional
        // Passamos 'false' para isManual para que ele TENTE postar no Facebook
        const result = await orchestrator.runViralCycle(false);
        
        logger.important(`✅ Ciclo finalizado com sucesso: ${result.type}`);
        
        // Pequena pausa para garantir que os logs sejam gravados
        setTimeout(() => process.exit(0), 2000);
        
    } catch (error) {
        logger.error(`❌ Falha Crítica no Ciclo de Nuvem: ${error.message}`);
        setTimeout(() => process.exit(1), 2000);
    }
}

// Handler para erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

runCloudCycle();
