const axios = require('axios');
const logger = require('../logger');
require('dotenv').config();

/**
 * SerpApiModule - Motor de Busca de Imagens Reais (Google Images)
 * Localização: src/modules/serpapi.module.js
 */
class SerpApiModule {
    constructor() {
        this.apiKey = (process.env.SERP_API_KEY || "").trim();
    }

    /**
     * Busca imagens reais no Google Images via SerpApi
     * @param {string} query Termo de busca
     * @param {number} limit Quantidade de resultados
     * @returns {Promise<Buffer[]>} Lista de buffers de imagem
     */
    async searchImages(query, limit = 1) {
        if (!this.apiKey) {
            logger.error("❌ SERP_API_KEY não configurada no .env");
            return [];
        }

        try {
            logger.info(`🔍 [SERPAPI] Buscando fotos reais no Google: "${query}"`);
            
            const response = await axios.get('https://serpapi.com/search.json', {
                params: {
                    engine: 'google_images',
                    q: query,
                    api_key: this.apiKey,
                    ijn: 0,
                    safe: 'off'
                },
                timeout: 10000
            });

            const results = response.data.images_results;
            if (!results || results.length === 0) {
                logger.warn(`⚠️ [SERPAPI] Nenhuma imagem encontrada para: ${query}`);
                return [];
            }

            const buffers = [];
            // Tenta pegar as melhores imagens até atingir o limite
            for (let i = 0; i < Math.min(results.length, limit * 3); i++) {
                const imgUrl = results[i].original || results[i].thumbnail;
                if (!imgUrl) continue;

                try {
                    const buffer = await this.downloadImage(imgUrl);
                    if (buffer) {
                        buffers.push(buffer);
                        if (buffers.length >= limit) break;
                    }
                } catch (e) {
                    logger.warn(`⚠️ Falha ao baixar imagem da SerpApi (${imgUrl}): ${e.message}`);
                }
            }

            return buffers;
        } catch (error) {
            logger.error(`❌ Erro crítico na SerpApi: ${error.message}`);
            return [];
        }
    }

    /**
     * Download e validação da imagem (Magic Bytes)
     */
    async downloadImage(url) {
        try {
            const response = await axios.get(url, { 
                responseType: 'arraybuffer',
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const buffer = Buffer.from(response.data);
            
            // Validação simples de Magic Bytes (JPEG, PNG, WEBP)
            const hex = buffer.toString('hex', 0, 4);
            const isValid = hex.startsWith('ffd8ff') || // JPEG
                            hex.startsWith('89504e47') || // PNG
                            hex.startsWith('52494646');   // WEBP/RIFF

            if (!isValid) {
                logger.warn(`⚠️ Formato inválido ignorado: ${url}`);
                return null;
            }

            return buffer;
        } catch (e) {
            return null;
        }
    }
}

module.exports = new SerpApiModule();
