const trendsModule = require('./modules/trends.module');
const logger = require('./logger');

/**
 * Interface de Compatibilidade para o Scheduler v5.0 (Elite Edition)
 * Agora retorna o objeto completo da noticia { title, link, source }.
 */
async function getTrendingTopic() {
    try {
        const topics = await trendsModule.getTrendingTopics();
        
        if (!topics || topics.length === 0) {
            throw new Error('Nenhuma tendencia ou noticia encontrada.');
        }

        // Seleciona um topico aleatorio entre os primeiros (mais recentes/relevantes)
        const chosen = topics[Math.floor(Math.random() * Math.min(10, topics.length))];
        logger.info(`🔥 Caso Real capturado: ${chosen.title}`);
        return chosen;

    } catch (error) {
        logger.warn(`⚠️ Usando backup de temas de curiosidade: ${error.message}`);
        const intenseFallbacks = [
            { title: 'O maior mistério não resolvido da arqueologia moderna', link: null, source: 'Arquivos Secretos' },
            { title: 'A descoberta espacial que mudou nossa visão do universo', link: null, source: 'Ciência Chocante' },
            { title: 'O segredo por trás do evento que parou o mundo', link: null, source: 'Casos Reais' }
        ];
        return intenseFallbacks[Math.floor(Math.random() * intenseFallbacks.length)];
    }
}

module.exports = { 
    getTrendingTopic,
    getLatestNews: () => trendsModule.getLatestNews()
};

