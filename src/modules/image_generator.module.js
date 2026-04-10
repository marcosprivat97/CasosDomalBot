const axios = require('axios');

const fs = require('fs');
const path = require('path');
const logger = require('../logger');

class ImageGeneratorModule {
    constructor() {
        this.providers = [
            { name: 'serpapi', priority: 'web', type: 'web' },
            { name: 'serper', priority: 'web', type: 'web' },
            { name: 'freepik', priority: 'web', type: 'web' },
            { name: 'pollinations', priority: 'ai', type: 'ai' }
        ];
    }

    /**
     * Ciclo Elite v12.0: Provedores Sucessivos & Validação
     */
    async generate(theme, visualData = {}, forcedPriority = null) {
        // CORREÇÃO: theme (argumento específico) deve vir antes de campos genéricos do objeto
        const query = theme || visualData.busca_foto_1 || visualData.palavra_chave_busca;
        const layout = visualData.decisao_layout || 'single_foto';

        // Suporte para Collages (Dual)
        if (layout === 'dual_collage' && visualData.busca_foto_2 && !forcedPriority) {
            return await this._generateDual(theme, visualData);
        }

        const preferredSource = forcedPriority || await this._getPreferredSource();
        logger.info(`📸 [IMAGE GENERATOR] Iniciando busca para: "${query}" | Preferência: ${preferredSource.toUpperCase()}`);

        // Reordenar provedores baseado na preferência do sistema
        const executionPlan = [...this.providers].sort((a, b) => {
            if (a.type === preferredSource && b.type !== preferredSource) return -1;
            if (a.type !== preferredSource && b.type === preferredSource) return 1;
            return 0;
        });

        for (const provider of executionPlan) {
            try {
                logger.info(`🔄 [PROV] Tentando provedor: ${provider.name.toUpperCase()}...`);
                const buffer = await this._callProvider(provider, query, visualData);
                
                if (await this._validateImage(buffer)) {
                    logger.important(`✅ [IMAGE] Sucesso via ${provider.name.toUpperCase()}!`);
                    await this._updateUsage(provider.type);
                    return buffer;
                }
            } catch (e) {
                logger.warn(`⚠️ [PROV] ${provider.name.toUpperCase()} falhou: ${e.message}`);
            }
        }

        logger.error(`🚨 [FALHA TOTAL] Nenhum provedor conseguiu obter a imagem.`);
        return null;
    }

    async _callProvider(provider, query, visualData) {
        const ImageModule = require('./image.module');
        const SerpApiModule = require('./serpapi.module');
        const SerperModule = require('./serper.module');

        switch (provider.name) {
            case 'serpapi':
                const serpRes = await SerpApiModule.searchImages(query, 1);
                return serpRes[0];
            case 'serper':
                const serperRes = await SerperModule.searchImages(query, 1);
                return serperRes[0];
            case 'freepik':
                return await ImageModule.searchFreepikImages(query);
            case 'pollinations':
                const prompt = visualData.prompt_flux || visualData.prompt_ia || query;
                return await this._tryPollinations(this._enrichPrompt(prompt));
            default:
                return null;
        }
    }

    /**
     * Validação de Qualidade e Integridade (Anti-Corrupção)
     */
    async _validateImage(buffer) {
        if (!buffer || !Buffer.isBuffer(buffer)) return false;
        
        // Tamanho mínimo razoável (30KB) para evitar thumbnails ou erros
        if (buffer.length < 30000) {
            logger.warn(`⚠️ [VALIDATION] Imagem rejeitada por tamanho insuficiente (${Math.round(buffer.length/1024)}KB)`);
            return false;
        }

        return true; // No futuro, usar Sharp aqui para checar dimensões
    }

    async _getPreferredSource() {
        const BrainModule = require('./brain.module');
        const brain = BrainModule.getBrain();
        const serpUsageToday = brain.serp_usage_today || 0;
        
        // Quota Safety: 6 buscas web por dia para economizar SerpApi
        if (serpUsageToday >= 6) return 'ai';
        return brain.last_image_source === 'web' ? 'ai' : 'web';
    }

    async _updateUsage(type) {
        const BrainModule = require('./brain.module');
        const updates = { last_image_source: type };
        if (type === 'web') {
            const brain = BrainModule.getBrain();
            updates.serp_usage_today = (brain.serp_usage_today || 0) + 1;
        }
        BrainModule.updateBrain(updates);
    }

    _enrichPrompt(prompt) {
        return `Hyper-realistic RAW photo of ${prompt}, documentary style, fujifilm photography, cinematic lighting, 8k, highly detailed, no text, no logo.`;
    }

    async _tryPollinations(prompt) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(response.data);
    }

    async _generateDual(theme, visualData) {
        logger.info(`🎭 [HYBRID DUAL] FOTO 1 (WEB) + FOTO 2 (IA)...`);
        const img1 = await this.generate(visualData.busca_foto_1 || theme, { ...visualData, decisao_layout: 'single' }, 'web');
        const img2 = await this.generate(visualData.busca_foto_2 || theme, { ...visualData, decisao_layout: 'single' }, 'ai');
        return (img1 && img2) ? { img1, img2 } : (img1 || img2);
    }
}

module.exports = new ImageGeneratorModule();
