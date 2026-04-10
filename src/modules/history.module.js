const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const historyPath = path.join(__dirname, '../../data/posted_history.json');

const HistoryModule = {
    _initHistory() {
        if (!fs.existsSync(path.dirname(historyPath))) {
            fs.mkdirSync(path.dirname(historyPath), { recursive: true });
        }
        if (!fs.existsSync(historyPath)) {
            fs.writeFileSync(historyPath, JSON.stringify({ posted_topics: [] }, null, 2));
        }
    },

    getHistory() {
        this._initHistory();
        try {
            return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch (e) {
            return { posted_topics: [] };
        }
    },

    /**
     * Verifica se um tema já foi postado (usando fuzzy matching básico)
     */
    isTopicRepeated(title) {
        if (!title) return false;
        const history = this.getHistory();
        const cleanTitle = title.toLowerCase().trim();
        
        return history.posted_topics.some(t => {
            const cleanExisting = t.toLowerCase().trim();
            // Check para igualdade exata ou se um contém o outro (títulos similares)
            return cleanExisting === cleanTitle || 
                   (cleanTitle.length > 10 && cleanExisting.includes(cleanTitle)) ||
                   (cleanExisting.length > 10 && cleanTitle.includes(cleanExisting));
        });
    },

    /**
     * Registra um novo tema no histórico
     */
    recordTopic(title) {
        if (!title) return;
        this._initHistory();
        try {
            const history = this.getHistory();
            if (!history.posted_topics.includes(title)) {
                history.posted_topics.push(title);
                
                // Limite técnico de 2000 temas para não explodir o JSON
                if (history.posted_topics.length > 2000) {
                    history.posted_topics.shift();
                }
                
                fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
                logger.info(`📝 [HISTORY] Tema registrado com sucesso: ${title}`);
            }
        } catch (e) {
            logger.error(`❌ Erro ao salvar histórico: ${e.message}`);
        }
    },

    /**
     * Retorna os temas mais recentes para passar no prompt da IA
     */
    getRecentTopics(limit = 50) {
        const history = this.getHistory();
        return history.posted_topics.slice(-limit).reverse();
    }
};

module.exports = HistoryModule;
