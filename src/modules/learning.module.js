const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const statsFilePath = path.join('src', 'data', 'stats.json');

class LearningModule {
    constructor() {
        this.stats = this.loadStats();
    }

    /**
     * Loads performance statistics from the JSON file.
     * @returns {Object} - Loaded stats.
     */
    loadStats() {
        try {
            if (fs.existsSync(statsFilePath)) {
                const data = fs.readFileSync(statsFilePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            logger.error(`Erro ao carregar estatísticas: ${error.message}`);
        }
        return { totalPosts: 0, averageScore: 0, topics: {} };
    }

    /**
     * Updates statistics with new post information.
     * @param {Object} postData - Data of the new post.
     */
    async updatePerformance(postData) {
        logger.info('Atualizando desempenho do post...');
        
        // Simulação de cálculo de score
        const score = Math.floor(Math.random() * 100);
        this.stats.totalPosts++;
        this.stats.averageScore = (this.stats.averageScore * (this.stats.totalPosts - 1) + score) / this.stats.totalPosts;

        // Atualizar tópicos preferidos
        postData.tags.forEach(tag => {
            this.stats.topics[tag] = (this.stats.topics[tag] || 0) + 1;
        });

        this.saveStats();
        logger.info(`Desempenho atualizado. Score desse post: [${score}]. Recorde de posts: [${this.stats.totalPosts}]`);
    }

    /**
     * Saves statistics to the JSON file.
     */
    saveStats() {
        try {
            fs.writeFileSync(statsFilePath, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            logger.error(`Erro ao salvar estatísticas: ${error.message}`);
        }
    }
}

module.exports = new LearningModule();
