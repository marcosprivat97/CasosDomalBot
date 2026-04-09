const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const brainPath = path.join(__dirname, '../../data/brain.json');

const BrainModule = {
    getBrain() {
        if (!fs.existsSync(brainPath)) {
            return { knowledge_base: {}, performance_insights: {}, strategy_evolution: {}, last_update: "" };
        }
        return JSON.parse(fs.readFileSync(brainPath, 'utf8'));
    },

    saveBrain(data) {
        try {
            data.last_update = new Date().toISOString();
            const tempPath = `${brainPath}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
            fs.renameSync(tempPath, brainPath); // Operação atômica
            logger.info("🧠 [CÉREBRO] Memória persistente atualizada (Escrita Atômica).");
        } catch (e) {
            logger.error(`❌ Erro crítico ao salvar cérebro: ${e.message}`);
        }
    },

    addInsight(type, insight) {
        const brain = this.getBrain();
        if (!brain.knowledge_base[type]) brain.knowledge_base[type] = [];
        brain.knowledge_base[type].unshift({
            date: new Date().toISOString(),
            ...insight
        });
        // Manter top 20 insights por categoria
        brain.knowledge_base[type] = brain.knowledge_base[type].slice(0, 20);
        this.saveBrain(brain);
    },

    recordPerformance(performance) {
        const brain = this.getBrain();
        brain.performance_insights.top_topics.unshift(performance);
        brain.performance_insights.top_topics = brain.performance_insights.top_topics.slice(0, 50);
        this.saveBrain(brain);
    },

    updateBrain(updates) {
        const brain = this.getBrain();
        Object.assign(brain, updates);
        this.saveBrain(brain);
    },

    getInsightsForAI() {
        const brain = this.getBrain();
        const viralPatterns = brain.knowledge_base?.viral_patterns || [];
        const topTopics = brain.performance_insights?.top_topics || [];
        
        let summary = "RESUMO DE INTELIGÊNCIA ACUMULADA:\n";
        
        if (viralPatterns.length > 0) {
            summary += "- Padrões Virais Identificados:\n";
            viralPatterns.slice(0, 5).forEach(p => {
                summary += `  * ${p.insight} (Ação: ${p.acao_pratica})\n`;
            });
        }
        
        if (topTopics.length > 0) {
            summary += "- Performance Recente (Top Temas):\n";
            topTopics.slice(0, 3).forEach(t => {
                summary += `  * ${t.tema} (Engagement: ${t.metrics?.engagement_rate}%)\n`;
            });
        }
        
        if (summary === "RESUMO DE INTELIGÊNCIA ACUMULADA:\n") {
            summary += "Ainda não há dados acumulados suficientes. Foque em curiosidades globais de alto impacto.";
        }
        
        return summary;
    }
};

module.exports = BrainModule;
