const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require(require('path').join(process.cwd(), 'src', 'logger'));

class ImageModule {
    constructor() {
        this.memoryPath = path.join(process.cwd(), 'data', 'image_memory.json');
        this._initMemory();
    }

    _initMemory() {
        if (!fs.existsSync(path.dirname(this.memoryPath))) {
            fs.mkdirSync(path.dirname(this.memoryPath), { recursive: true });
        }
        if (!fs.existsSync(this.memoryPath)) {
            fs.writeFileSync(this.memoryPath, JSON.stringify({ urls: [] }, null, 2));
        }
    }

    _isAlreadyUsed(url) {
        try {
            const memory = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
            return memory.urls.includes(url);
        } catch (e) { return false; }
    }

    _addToMemory(url) {
        try {
            const memory = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8')) || { urls: [] };
            if (!memory.urls) memory.urls = [];
            
            if (!memory.urls.includes(url)) {
                memory.urls.push(url);
                // Manter apenas as últimas 500 imagens para não pesar
                if (memory.urls.length > 500) memory.urls.shift();
                fs.writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2));
            }
        } catch (e) {
            logger.error(`❌ Erro ao salvar memória de imagem: ${e.message}`);
        }
    }
    async extractRealImageFromNews(news) {
        try {
            const images = { main: null, secondary: null };

            // 1. TENTATIVA DIRETA: Extrair a imagem original da própria página da notícia
            if (news.link && !news.link.includes('evergreen')) {
                logger.info(`🔗 [DIRETO] Tentando capturar foto original da fonte: ${news.link}`);
                const directImgUrl = await this.extractDeepImage(news.link);
                if (directImgUrl && !this._isAlreadyUsed(directImgUrl)) {
                    images.main = await this.downloadImageToBuffer(directImgUrl, news.link);
                    if (images.main && images.main.length > 50000) {
                        logger.info(`✨ Sucesso! Foto original capturada.`);
                        this._addToMemory(directImgUrl);
                    } else {
                        images.main = null;
                    }
                }
            }

            // 2. TENTATIVA POR BUSCA (BING - Mais estável)
            if (!images.main) {
                const subject = news.palavra_chave_busca || news.personagem_principal || news.tema || news.title;
                logger.info(`🔍 [BING] Buscando foto principal para: "${subject}"`);
                images.main = await this.searchBingImages(subject);
            }

            // 3. SEGUNDA FOTO
            if (news.decisao_fotos === '2_fotos' || !images.main) { // Se falhou a 1, tenta a 2 ou o acervo
                const query2 = news.prompt_foto_2 || `${news.tema} detail`;
                logger.info(`🔍 [BING 2] Buscando outra foto: "${query2}"`);
                images.secondary = await this.searchBingImages(query2);
            }

            // 4. FALLBACK SUPREMO: ACERVO DE EMERGÊNCIA (STOCK)
            if (!images.main) {
                logger.warn(`🚨 [STOCK] Nenhuma imagem encontrada na web. Usando Acervo de Mistério...`);
                images.main = this.getStockBackground();
            }
            if ((news.decisao_fotos === '2_fotos' || !images.main) && !images.secondary) {
                images.secondary = this.getStockBackground();
            }

            return images.secondary ? [images.main, images.secondary] : images.main;
        } catch (error) {
            logger.error(`❌ Erro na extração sênior de imagem: ${error.message}`);
            return this.getStockBackground(); // Jamais retorna null agora
        }
    }

    getStockBackground() {
        try {
            const stockDir = path.join(process.cwd(), 'data', 'stock');
            if (fs.existsSync(stockDir)) {
                const files = fs.readdirSync(stockDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
                if (files.length > 0) {
                    const randomFile = files[Math.floor(Math.random() * files.length)];
                    return fs.readFileSync(path.join(stockDir, randomFile));
                }
            }
            return null;
        } catch (e) { return null; }
    }

    async searchFreepikImages(query) {
        try {
            const { safeFetch } = require('../agents/utils');
            const apiKey = process.env.FREEPIK_API_KEY;
            
            if (!apiKey || apiKey === 'YOUR_FREEPIK_API_KEY') {
                logger.warn(`⚠️ Freepik API Key não configurada. Pulando busca premium.`);
                return null;
            }

            logger.info(`💎 [FREEPIK] Pesquisando: ${query}`);
            
            const response = await safeFetch('https://api.freepik.com/v1/resources', {
                params: {
                    term: query,
                    'filters[content_type][photo]': 1,
                    'filters[orientation][landscape]': 1,
                    limit: 10,
                    order: 'relevance'
                },
                headers: {
                    'x-freepik-api-key': apiKey,
                    'Accept-Language': 'pt-BR,en-US;q=0.9'
                }
            });

            const resources = response.data?.data || [];
            logger.info(`📸 [FREEPIK] Encontrados ${resources.length} recursos premium.`);

            for (const resource of resources) {
                const imageUrl = resource.image?.source?.url || resource.image?.source;
                if (imageUrl && !this._isAlreadyUsed(imageUrl)) {
                    const buffer = await this.downloadImageToBuffer(imageUrl);
                    if (buffer && buffer.length > 30000) {
                        this._addToMemory(imageUrl);
                        return buffer;
                    }
                }
            }

            return null;
        } catch (e) {
            logger.error(`❌ Erro na API do Freepik: ${e.message}`);
            return null;
        }
    }

    async searchBingImages(query) {
        try {
            const { safeFetch } = require('../agents/utils');
            const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
            
            logger.info(`🔍 [BING IMAGES] Pesquisando: ${query}`);
            
            const response = await safeFetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            // Converte entidades HTML para aspas reais para facilitar o match da regex
            const html = response.data.toString().replace(/&quot;/g, '"');
            
            const murlRegex = /"murl":"(https:[^"]+?)"/g;
            const candidates = [];
            let match;
            
            while ((match = murlRegex.exec(html)) !== null) {
                let url = match[1]
                    .replace(/\\/g, '')
                    .split('"')[0]    // Corta em aspas reais
                    .split('?')[0]    // Remove parâmetros de busca que podem invalidar
                    .trim();
                
                if (this._isValidImage(url) && !this._isAlreadyUsed(url)) {
                    candidates.push(url);
                }
            }

            // Se ainda não achou, tenta uma regex mais agressiva para qualquer URL de imagem
            if (candidates.length < 5) {
                const imgRegex = /https:\/\/[^"'\s<>]+?\.(jpg|jpeg|png|webp)/gi;
                let iMatch;
                while ((iMatch = imgRegex.exec(html)) !== null) {
                    const url = iMatch[0];
                    if (this._isValidImage(url) && !this._isAlreadyUsed(url) && !candidates.includes(url)) {
                        candidates.push(url);
                    }
                }
            }

            logger.info(`📸 [BING] Encontrados ${candidates.length} candidatos potenciais.`);

            for (const imageUrl of candidates.slice(0, 10)) {
                const buffer = await this.downloadImageToBuffer(imageUrl);
                if (buffer && buffer.length > 30000) { // Baixamos um pouco o limite para 30kb para fotos reais
                    this._addToMemory(imageUrl);
                    return buffer;
                }
            }

            return null;
        } catch (e) {
            logger.error(`❌ Erro no Scraper Bing: ${e.message}`);
            return null;
        }
    }

    /**
     * Fallback de Pesquisa Web para encontrar fotos reais.
     */
    async searchFallbackImage(query) {
        try {
            logger.info(`🌐 Iniciando busca global por: ${query}`);
            const { safeFetch } = require('../agents/utils');
            
            // Plano A: Tenta extrair da busca do Bing
            const bingImg = await this.searchBingImages(query);
            if (bingImg) return bingImg;

            // Plano B: Tenta extrair qualquer imagem grande que apareça na página de busca (DuckDuckGo ou Bing)
            const backupUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
            const backupImg = await this.extractDeepImage(backupUrl);
            if (backupImg) {
                return await this.downloadImageToBuffer(backupImg, backupUrl);
            }

            return null;
        } catch (e) {
            logger.error(`❌ Erro no Fallback de Busca: ${e.message}`);
            return null;
        }
    }

    /**
     * Scraper de OG:IMAGE e Meta Tags de Portais.
     */
    async extractDeepImage(newsUrl) {
        if (!newsUrl || newsUrl.includes('google.com')) return null;
        try {
            const { safeFetch } = require('../agents/utils');
            const urlObj = new URL(newsUrl);
            const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

            const response = await safeFetch(newsUrl, { 
                headers: { 
                    'Accept': 'text/html,application/xhtml+xml,application/xml'
                }
            });
            const html = response.data.toString();

            // 1. Tentar og:image
            const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                             html.match(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            
            if (ogMatch && ogMatch[1]) {
                const imgUrl = this._normalizeUrl(ogMatch[1], baseUrl, newsUrl);
                if (this._isValidImage(imgUrl)) {
                    logger.info(`💎 Foto real (OG) capturada: ${imgUrl.substring(0, 60)}...`);
                    return imgUrl;
                }
            }

            // 2. Tentar Twitter Image e Schema.org
            const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (twitterMatch && twitterMatch[1]) {
                const imgUrl = this._normalizeUrl(twitterMatch[1], baseUrl, newsUrl);
                if (this._isValidImage(imgUrl)) return imgUrl;
            }

            // 3. Tentar JSON-LD
            const jsonLdMatch = html.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
            if (jsonLdMatch) {
                for (const script of jsonLdMatch) {
                    try {
                        const content = script.replace(/<[^>]*>?/gm, '');
                        const imgMatch = content.match(/"image":\s*\{\s*"url":\s*"([^"]+)"/i) || 
                                         content.match(/"image":\s*"([^"]+)"/i) || 
                                         content.match(/"url":\s*"([^"]+\.(jpg|jpeg|png|webp))"/i);
                        if (imgMatch && imgMatch[1]) {
                            const imgUrl = this._normalizeUrl(imgMatch[1], baseUrl, newsUrl);
                            if (this._isValidImage(imgUrl)) return imgUrl;
                        }
                    } catch(e) {}
                }
            }

            // 4. Fallback: procurar por imagens grandes
            const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
            for (const img of imgMatches) {
                const srcMatch = img.match(/src=["']([^"']+)["']/i);
                if (srcMatch && srcMatch[1]) {
                    const imgUrl = this._normalizeUrl(srcMatch[1], baseUrl, newsUrl);
                    if (this._isValidImage(imgUrl) && !imgUrl.includes('logo') && !imgUrl.includes('icon')) {
                        return imgUrl;
                    }
                }
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    _isValidImage(url) {
        if (!url || typeof url !== 'string' || url.length < 10) return false;
        const lowUrl = url.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const hasValidExt = validExtensions.some(ext => lowUrl.includes(ext));
        if (!hasValidExt && !lowUrl.includes('image')) return false;

        const blackList = [
            'facebook', 'placeholder', 'sprite', 'loading', 'author', 'reporter', 
            'logo', 'avatar', 'pixel', 'adzerk', 'doubleclick', 'analytics',
            'badge', 'button', 'dot.gif', 'tracking', 'pixel', 'banner', 'newsletter',
            'base64', 'data:image'
        ];
        return !blackList.some(item => lowUrl.includes(item));
    }

    _normalizeUrl(url, baseUrl, newsUrl) {
        let cleanUrl = url.trim();
        cleanUrl = cleanUrl.split('?')[0]; 

        if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;
        else if (cleanUrl.startsWith('/')) cleanUrl = baseUrl + cleanUrl;
        else if (!cleanUrl.startsWith('http')) {
            try {
                cleanUrl = new URL(cleanUrl, newsUrl).href;
            } catch (e) { return null; }
        }
        return cleanUrl;
    }

    async downloadImageToBuffer(url, referer = '') {
        try {
            const { safeFetch } = require('../agents/utils');
            const urlObj = new URL(url);
            const response = await safeFetch(url, {
                responseType: 'arraybuffer',
                headers: {
                    'Referer': referer || `${urlObj.protocol}//${urlObj.hostname}/`
                }
            });
            const buffer = Buffer.from(response.data);

            // Validação de Magic Bytes para garantir que é uma imagem
            const header = buffer.toString('hex', 0, 4).toUpperCase();
            const isJpg = header.startsWith('FFD8FF');
            const isPng = header === '89504E47';
            const isWebp = buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP';
            
            if (!isJpg && !isPng && !isWebp) {
                logger.warn(`⚠️ O arquivo baixado não possui um cabeçalho de imagem válido: ${url.substring(0, 50)}...`);
                return null;
            }

            return buffer;
        } catch (error) {
            logger.debug(`❌ Falha no download da imagem: ${error.message}`);
            return null;
        }
    }

    /**
     * Atalho Sênior para buscar, baixar e salvar fotos reais.
     */
    async getGeneralViralImage(query, options = {}) {
        try {
            logger.info(`🔍 [ImageModule] Buscando foto real de: ${query}`);
            const buffer = await this.searchFallbackImage(query);
            
            if (!buffer) return null;

            const name = `img_${Date.now()}.jpg`;
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
            
            const filePath = path.join(dataDir, name);
            fs.writeFileSync(filePath, buffer);
            
            return {
                path: filePath,
                name: name,
                url: 'Extracao Real via Scraper'
            };
        } catch (e) {
            logger.error(`❌ Erro no wrapper getGeneralViralImage: ${e.message}`);
            return null;
        }
    }
}

module.exports = new ImageModule();
