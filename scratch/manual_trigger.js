const Orchestrator = require('../src/agents/orchestrator');
const logger = require('../src/logger');

async function triggerManualPost() {
    const orch = Orchestrator;
    
    const newsItem = {
      title: "Locais sagrados em Jerusalém reabrem após 40 dias fechados devido à guerra",
      link: "https://g1.globo.com/turismo-e-viagem/noticia/2026/04/09/locais-sagrados-em-jerusalem-reabrem-apos-40-dias-fechados-devido-as-restricoes-de-guerra-impostas-por-israel.ghtml",
      source: "G1 - Mundo",
      category: "Mundo / Religião"
    };

    logger.important(`🎯 [MANUAL TRIGGER] Forçando publicação imediata sobre: ${newsItem.title}`);
    
    try {
        const result = await orch.produceContent(newsItem);
        logger.important(`✨ [SUCESSO] Post manual finalizado: ${result.type}`);
    } catch (error) {
        logger.error(`❌ [FALHA] Erro no post manual: ${error.stack}`);
    }
}

triggerManualPost();
