const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const HISTORY_PATH = path.join(__dirname, '..', '..', 'data', 'history_v9.json');

class HistoryModule {
    constructor() {
        this.history = this._loadHistory();
    }

    _loadHistory() {
        try {
            if (!fs.existsSync(HISTORY_PATH)) {
                return [];
            }
            const content = fs.readFileSync(HISTORY_PATH, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            logger.error('❌ Erro ao carregar histórico:', error.message);
            return [];
        }
    }

    /**
     * Verifica se o link fornecido já foi postado.
     * @param {string} link URL da notícia
     * @returns {boolean}
     */
    isPosted(link) {
        if (!link) return false;
        const cleanLink = link.split('?')[0].trim().toLowerCase();
        
        return this.history.some(item => {
            const itemLink = (typeof item === 'string') ? item : (item?.link || '');
            if (!itemLink) return false;
            
            return itemLink.split('?')[0].trim().toLowerCase() === cleanLink;
        });
    }

    /**
     * Verifica se o título (ou algo muito similar) já foi postado.
     * @param {string} title Título da notícia
     * @returns {boolean}
     */
    isTitlePosted(title) {
        if (!title) return false;
        const cleanTitle = title.toLowerCase().trim();
        
        // Remove pontuações comuns para comparação
        const normalize = (t) => t.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const normTitle = normalize(cleanTitle);

        return this.history.some(item => {
            const itemTitle = normalize((item?.title || '').toLowerCase());
            if (!itemTitle) return false;

            // Se o título for idêntico ou um for subconjunto do outro (notícias repetidas)
            return itemTitle === normTitle || itemTitle.includes(normTitle) || normTitle.includes(itemTitle);
        });
    }

    /**
     * Registra um novo post no histórico (v12.0 - Unificado)
     */
    add(entry) {
        // Normaliza para o novo formato unificado
        const historyEntry = {
            id: entry.id || `manual_${Date.now()}`,
            titulo: entry.titulo || entry.title,
            link: entry.link,
            texto: entry.texto || entry.post_completo || "",
            timestamp: entry.timestamp || new Date().toISOString(),
            status_analise: entry.status_analise || "pendente",
            type: entry.type || 'image'
        };

        this.history.push(historyEntry);
        
        // Limita o histórico a 500 itens para não pesar
        if (this.history.length > 500) {
            this.history.shift();
        }

        this._saveHistory();
    }

    _saveHistory() {
        try {
            const tempPath = `${HISTORY_PATH}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(this.history, null, 2));
            fs.renameSync(tempPath, HISTORY_PATH);
        } catch (error) {
            logger.error('❌ Erro crítico ao salvar histórico:', error.message);
        }
    }
}

module.exports = new HistoryModule();
