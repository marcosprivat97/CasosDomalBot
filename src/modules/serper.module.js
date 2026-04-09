const axios = require('axios');
const logger = require('../logger');
require('dotenv').config();

/**
 * SerperModule - Motor de Busca de Imagens (Serper.dev)
 * Localização: src/modules/serper.module.js
 */
class SerperModule {
    constructor() {
        this.apiKey = (process.env.SERPER_API_KEY || "").trim();
    }

    /**
     * Busca imagens reais via Serper.dev (Google Images)
     * @param {string} query Termo de busca
     * @param {number} limit Quantidade de resultados
     * @returns {Promise<Buffer[]>} Lista de buffers de imagem
     */
    async searchImages(query, limit = 1) {
        if (!this.apiKey) {
            logger.error("❌ SERPER_API_KEY não configurada no .env");
            return [];
        }

        try {
            logger.info(`🌐 [SERPER] Buscando alternativa no Google: "${query}"`);
            
            const data = JSON.stringify({
                "q": query,
                "gl": "br", // Geolocalização Brasil
                "hl": "pt-br" // Idioma Português do Brasil
            });

            const response = await axios.post('https://google.serper.dev/images', data, {
                headers: { 
                    'X-API-KEY': this.apiKey, 
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const results = response.data.images;
            if (!results || results.length === 0) {
                logger.warn(`⚠️ [SERPER] Nenhuma imagem encontrada para: ${query}`);
                return [];
            }

            const buffers = [];
            for (let i = 0; i < Math.min(results.length, limit * 3); i++) {
                const imgUrl = results[i].imageUrl;
                if (!imgUrl) continue;

                try {
                    const buffer = await this.downloadImage(imgUrl);
                    if (buffer) {
                        buffers.push(buffer);
                        if (buffers.length >= limit) break;
                    }
                } catch (e) {
                    logger.debug(`⚠️ Falha ao baixar imagem do Serper (${imgUrl}): ${e.message}`);
                }
            }

            return buffers;
        } catch (error) {
            logger.error(`❌ Erro na API do Serper.dev: ${error.message}`);
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
            const hex = buffer.toString('hex', 0, 4);
            const isValid = hex.startsWith('ffd8ff') || hex.startsWith('89504e47') || hex.startsWith('52494646');

            if (!isValid) return null;
            return buffer;
        } catch (e) {
            return null;
        }
    }
}

module.exports = new SerperModule();
