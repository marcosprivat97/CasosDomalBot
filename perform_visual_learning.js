const { runVisualLearning } = require("./src/agents/visual_master.agent.js");
const logger = require("./src/logger");

async function startLearningCycle() {
    console.log("\n--- INICIANDO CICLO DE APRENDIZADO VISUAL ---");
    try {
        const lesson = await runVisualLearning();
        
        console.log("\n✅ APRENDIZADO CONCLUÍDO COM SUCESSO!");
        console.log("------------------------------------------");
        console.log(`Versão da Lógica: ${lesson.versao_logica}`);
        console.log(`Mudanças: ${lesson.mudancas_aplicadas.join(", ")}`);
        console.log(`Novo Estilo: ${lesson.novas_diretrizes.estilo_imagem}`);
        console.log(`Teoria do Clique: ${lesson.novas_diretrizes.teoria_do_clique}`);
        console.log("------------------------------------------");
        console.log("\nO robô editor agora está mais 'profissional' e usará estas técnicas no próximo post!");
        
    } catch (error) {
        logger.error(`❌ Falha no ciclo de aprendizado: ${error.message}`);
        process.exit(1);
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    startLearningCycle();
}

module.exports = { startLearningCycle };
