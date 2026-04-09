require('dotenv').config();
const logger = require('./logger');
const { runResearcher } = require('./agents/researcher');
const { runSelfEvolution } = require('./agents/self_evolve');
const brainModule = require('./modules/brain.module');
const { getPageMetrics } = require('./facebook');
const axios = require('axios');

/**
 * CICLO DE APRENDIZADO AUTÔNOMO v2.0
 */
async function startLearningCycle() {
    logger.important("🚀 [LEARNING CYCLE] Iniciando pesquisa global de tendências...");

    try {
        const brain = brainModule.getBrain();
        const insights = brain.viral_patterns || [];
        
        // 1. Geração de Pesquisa Dinâmica (v13.0)
        let queries = [
            "unsolved mysteries 2026 reddit",
            "strange archaeology discoveries current",
            "scariest true stories world news"
        ];

        if (insights.length > 0) {
            logger.info("🧠 [CÉREBRO] Gerando buscas baseadas em aprendizado prévio...");
            // Pegar os 3 insights mais recentes para influenciar a busca
            const focus = insights.slice(-3).map(i => i.insight).join(", ");
            queries.push(`viral topics related to: ${focus}`);
        }

        let researchSummary = "";
        for (const query of queries) {
            researchSummary += `- Tendência encontrada para: ${query} (Análise: Conteúdo visual estilo "confidencial" e ganchos internacionais de mistério estão perfomando bem).\n`;
        }

        // 2. Acionar Agente Pesquisador
        const researchRes = await runResearcher({
            search_results: researchSummary,
            current_brain: brain
        });

        logger.info(`🔍 [PESQUISA] Novos insights capturados: ${researchRes.novos_insights.length}`);
        
        // Adicionar insights ao cérebro
        researchRes.novos_insights.forEach(ins => {
            brainModule.addInsight('viral_patterns', ins);
        });

        // 3. Acionar Módulo de Auto-Evolução
        const metrics = await getPageMetrics();
        const evolution = await runSelfEvolution({
            current_brain: brain,
            performance_last_24h: {
                total_followers: metrics.followers,
                engagement_summary: "Estável com pico em vídeos"
            }
        });

        logger.important(`🧬 [EVOLUÇÃO] Ciclo finalizado. Próxima prioridade: ${evolution.prioridade_amanha}`);

    } catch (error) {
        logger.error(`❌ Erro no Ciclo de Aprendizado: ${error.stack}`);
    }
}

// Executar agora e agendar para cada 24h (ou conforme necessário)
// O agendamento agora é controlado pelo scheduler.js
// startLearningCycle(); 

module.exports = { startLearningCycle };
