const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

class ImageGeneratorModule {
    constructor() {
        this.hf = new HfInference(process.env.HF_TOKEN);
        // Pode ser expandido para SiliconFlow, DeepInfra, etc.
    }

    /**
     * Ciclo Mestre de Geração: Web Search (Prioridade) -> IA Generation (Fallback)
     */
    async generate(theme, visualData = {}) {
        const query1 = visualData.busca_foto_1 || visualData.palavra_chave_busca || theme;
        const query2 = visualData.busca_foto_2;
        const layout = visualData.decisao_layout || 'single_foto';

        logger.info(`🔍 [VISUAL] Iniciando busca inteligente (${layout}) para: "${query1}"`);

        // Caso seja DUAL, gera os dois componentes
        if (layout === 'dual_collage' && query2) {
            return await this._generateDual(theme, visualData);
        }

        // Caso seja SINGLE (Padrão)
        return await this._generateSingle(query1, visualData);
    }

    async _generateSingle(queryBase, visualData) {
        // Variações Circulares com Filtros Negativos para evitar Texto/Logo
        const searchVariations = [
            `${queryBase} -text -logo -subtitle`, 
            `${queryBase} real photo -meme -poster`,
            this._getEnglishSearchTerm(visualData.prompt_flux || queryBase) + ' -text -poster'
        ];

        for (let i = 0; i < searchVariations.length; i++) {
            try {
                logger.info(`🌐 [WEB SEARCH] Tentativa ${i + 1}/${searchVariations.length}: "${searchVariations[i]}"`);
                const buffer = await this._tryWebSearch(searchVariations[i]);
                if (buffer) return buffer;
            } catch (e) {
                logger.debug(`⚠️ Falha na busca web ${i + 1}: ${e.message}`);
            }
        }

        // Se falhou web, tenta IA
        return await this._generateFallbackIA(visualData.prompt_flux || queryBase);
    }

    async _generateDual(theme, visualData) {
        logger.info(`🎭 [DUAL SEARCH] Buscando 2 temas: "${visualData.busca_foto_1}" e "${visualData.busca_foto_2}"`);
        
        const [img1, img2] = await Promise.all([
            this._generateSingle(visualData.busca_foto_1, visualData),
            this._generateSingle(visualData.busca_foto_2, visualData)
        ]);

        if (img1 && img2) {
            return { img1, img2 }; // Retorna objeto especial para o Orquestrador
        }

        // Se um dos dois falhou, tenta pelo menos o principal
        return img1 || img2;
    }

    async _generateFallbackIA(prompt) {
        logger.warn(`🚨 [IA FALLBACK] Nenhuma foto real encontrada. Gerando via IA...`);
        const enhancedPrompt = this._enrichPrompt(prompt);
        
        if (process.env.HF_TOKEN) {
            try {
                const buffer = await this._tryHuggingFace(enhancedPrompt);
                if (buffer) return buffer;
            } catch (e) {
                logger.warn(`⚠️ [IMAGE IA] Hugging Face falhou.`);
            }
        }

        try {
            const buffer = await this._tryPollinations(enhancedPrompt);
            if (buffer) return buffer;
        } catch (e) {
            logger.warn(`⚠️ [IMAGE IA] Pollinations falhou.`);
        }

        return null;
    }

    async _tryWebSearch(query) {
        try {
            const SerpApiModule = require('./serpapi.module');
            const SerperModule = require('./serper.module');
            const ImageModule = require('./image.module');
            
            // Plano A: SerpApi (Google Images Oficial)
            try {
                const serpBuffers = await SerpApiModule.searchImages(query, 1);
                if (serpBuffers && serpBuffers.length > 0) {
                    logger.important(`✅ [SERPAPI] Foto REAL obtida!`);
                    return serpBuffers[0];
                }
            } catch (e) {
                logger.warn(`⚠️ SerpApi falhou, tentando Serper...`);
            }

            // Plano B: Serper.dev (Google Images Fallback)
            try {
                const serperBuffers = await SerperModule.searchImages(query, 1);
                if (serperBuffers && serperBuffers.length > 0) {
                    logger.important(`✅ [SERPER] Foto REAL obtida via Backup!`);
                    return serperBuffers[0];
                }
            } catch (e) {
                logger.warn(`⚠️ Serper falhou, tentando Freepik...`);
            }

            // Plano C: Freepik (Qualidade Premium e Limpa)
            const freepikBuffer = await ImageModule.searchFreepikImages(query);
            if (freepikBuffer) {
                logger.info(`✅ [VISUAL] Foto Premium obtida via Freepik!`);
                return freepikBuffer;
            }

            // Plano D: Bing (Fallback de busca aberta)
            return await ImageModule.searchBingImages(query);
        } catch (e) {
            logger.warn(`⚠️ Erro na cadeia de busca web: ${e.message}`);
            return null;
        }
    }

    _enrichPrompt(prompt) {
        if (prompt.includes('no text')) return prompt;
        return `RAW photo of ${prompt}, documentary style, fujifilm photography, realistic textures, no text, no logo, no watermark, sharp focus, 8k`;
    }

    async _tryHuggingFace(prompt) {
        logger.info(`📸 [IMAGE IA] Tentando FLUX.1-schnell...`);
        const response = await this.hf.textToImage({
            model: 'black-forest-labs/FLUX.1-schnell',
            inputs: prompt,
            parameters: { width: 1024, height: 1024 }
        });

        if (response && response instanceof Blob) {
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        return null;
    }

    async _tryPollinations(prompt) {
        logger.info(`🌪️ [IMAGE IA] Tentando Reserva (Pollinations)...`);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        if (response.data && response.data.length > 50000) {
            return Buffer.from(response.data);
        }
        return null;
    }

    _getEnglishSearchTerm(fullPrompt) {
        if (!fullPrompt) return "";
        // Tenta pegar o núcleo do assunto antes da vírgula
        return fullPrompt.split(',')[0].replace(/RAW photo of/i, '').trim();
    }
}

module.exports = new ImageGeneratorModule();
