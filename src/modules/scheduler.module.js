const cron = require('node-cron');
const logger = require('../logger');
const contentModule = require('./content.module');
const imageModule = require('./image.module');
const compositionModule = require('./composition.module');
const learningModule = require('./learning.module');
const { withRetry } = require('./fallback.module');
const healthModule = require('./health.module');

class SchedulerModule {
    constructor() {
        this.postsPerDay = 5;
    }

    /**
     * Initializes the scheduler and sets up cron jobs.
     */
    init() {
        logger.info(`Agendador iniciado. Meta: ${this.postsPerDay} posts por dia.`);

        // Agendamento: A cada 4 horas e 48 minutos (para dar 5 posts por dia)
        // Simplificado para 5 horários fixos para demonstração: 
        // 08:00, 12:00, 15:00, 18:00, 21:00
        const scheduleTimes = ['0 8 * * *', '0 12 * * *', '0 15 * * *', '0 18 * * *', '0 21 * * *'];

        scheduleTimes.forEach((time, index) => {
            cron.schedule(time, () => {
                logger.info(`Executando post agendado #${index + 1}`);
                this.executePostCycle();
            }, {
                timezone: "America/Sao_Paulo"
            });
        });

        // Teste de execução imediata ao iniciar (opcional)
        // this.executePostCycle();
    }

    /**
     * The core posting cycle logic with retry and fallback.
     */
    async executePostCycle() {
        try {
            await withRetry(async () => {
                // 1. Gerar Conteúdo
                const content = await contentModule.generateStory();

                // 2. Gerar Imagem
                const imagePath = await imageModule.generateImage();

                // 3. Compor Imagem Final
                const finalPostPath = await compositionModule.compose(imagePath, content.body);

                // 4. Publicar (Mock)
                logger.info(`[PUBLISH] Publicando no Facebook: ${finalPostPath}`);
                
                // 5. Aprender
                await learningModule.updatePerformance(content);

                // 6. Atualizar Health
                healthModule.updateLastExecution();
                
            }, 3, 5000, 'Ciclo de Postagem');

        } catch (error) {
            logger.error(`O ciclo de postagem falhou após todas as tentativas: ${error.message}`);
            healthModule.incrementErrors();
        }
    }
}

module.exports = new SchedulerModule();
