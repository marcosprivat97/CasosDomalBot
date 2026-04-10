const HistoryModule = require('./history.module');
const FacebookModule = require('./facebook.module');
const logger = require('../logger');

/**
 * AuditorModule v1.0.0
 * Resgatando o feedback real do público para orientar a estratégia.
 */
const AuditorModule = {
    /**
     * Coleta a performance dos últimos N posts para o CEO decidir a estratégia.
     */
    async generatePerformanceReport(limit = 10) {
        logger.info(`🔍 [AUDITOR] Iniciando auditoria estratégica dos últimos posts...`);
        const records = HistoryModule.getRecentRecords(limit);
        
        if (records.length === 0) {
            logger.warn(`⚠️ [AUDITOR] Sem histórico de IDs para auditoria. Iniciando em modo descoberta.`);
            return { reach_total: 0, avg_engagement: 0, posts_auditados: 0 };
        }

        let totalReach = 0;
        let totalEngagement = 0;
        let auditedCount = 0;

        for (const record of records) {
            if (!record.id) continue;
            
            const metrics = await FacebookModule.getPostMetrics(record.id);
            if (metrics) {
                totalReach += metrics.reach;
                totalEngagement += (metrics.engagement || 0);
                auditedCount++;
                logger.info(`📊 [AUDITOR] Caso: '${record.tema}' -> Alcance: ${metrics.reach} | Engaj: ${metrics.engagement}`);
            }
        }

        const report = {
            reach_total: totalReach,
            avg_engagement: auditedCount > 0 ? Number((totalEngagement / auditedCount).toFixed(2)) : 0,
            posts_auditados: auditedCount,
            last_audit_timestamp: new Date().toISOString()
        };

        const status = report.reach_total > 500 ? "🔥 QUENTE" : "🧊 MORNO/FRIO";
        logger.important(`📈 [AUDITOR] Relatório Finalizado (${status}): Alcance Total ${report.reach_total} | Engajamento Médio ${report.avg_engagement}`);
        
        return report;
    }
};

module.exports = AuditorModule;
