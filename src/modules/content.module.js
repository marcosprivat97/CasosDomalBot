const Groq = require('groq-sdk');
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

class ContentModule {
    constructor() {
        this.client = null;
    }

    /**
     * Initializes the Groq client.
     */
    init() {
        if (!process.env.GROQ_API_KEY) {
            logger.warn('GROQ_API_KEY não configurada. Usando MOCK para geração de conteúdo.');
            return;
        }
        this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    /**
     * Generates a viral story based on trending topic or theme.
     * @param {string} topic - The topic to inspire the story.
     * @returns {Object} - Story object with generated content.
     */
    async generateStory(topic = 'história de superação') {
        logger.info(`Gerando história com Groq AI (Llama 3) sobre: [${topic}]`);
        
        if (!this.client) {
            return this.generateMock(topic);
        }

        try {
            const chatCompletion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: `Escreva uma história curta e inspiradora para o Facebook sobre: "${topic}". 
                        A história deve ser emocionante e viral. Use um tom cativante e inclua uma lição de vida no final. 
                        Retorne apenas o texto da história, sem títulos ou comentários adicionais.`
                    }
                ],
                model: 'llama3-8b-8192',
                temperature: 0.7,
                max_tokens: 1024
            });

            const storyText = chatCompletion.choices[0]?.message?.content || "";

            const content = {
                id: uuidv4(),
                title: `Post IA: ${topic}`,
                body: storyText.trim(),
                tags: ['ia', 'viral', 'emoção', 'superação'],
                createdAt: new Date().toISOString()
            };

            logger.info(`✅ História gerada com sucesso pela Groq: [${content.id}]`);
            return content;
        } catch (error) {
            logger.error(`Erro ao gerar conteúdo com Groq: ${error.message}`);
            return this.generateMock(topic);
        }
    }

    /**
     * Fallback mock story generator.
     */
    generateMock(topic) {
        logger.warn('Utilizando MOCK para geração de conteúdo (Fallback).');
        return {
            id: uuidv4(),
            title: `Post Mock: ${topic}`,
            body: `Esta é uma história inspiradora (simulada) sobre ${topic} para manter o sistema rodando.`,
            tags: ['mock', 'fallback'],
            createdAt: new Date().toISOString()
        };
    }
}

module.exports = new ContentModule();
