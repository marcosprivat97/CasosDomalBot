const logger = require('../logger');
const axios = require('axios');

/**
 * NewsModule Elite v9.5 - Viral Curiosity Edition
 * Aprimorado para extrair imagens reais e lidar com múltiplos feeds de curiosidades.
 */
class TrendsModule {
    constructor() {
        this.sources = [
            { name: 'G1 - Mundo', url: 'https://g1.globo.com/rss/g1/mundo/' },
            { name: 'G1 - Ciência', url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/' },
            { name: 'UOL - Notícias', url: 'https://rss.uol.com.br/feed/noticias.xml' },
            { name: 'BBC Brasil', url: 'https://www.bbc.com/portuguese/index.xml' },
            { name: 'R7 - Internacional', url: 'https://noticias.r7.com/internacional/feed.xml' },
            { name: 'Hypeness', url: 'https://www.hypeness.com.br/feed/' },
            { name: 'Mega Curioso', url: 'https://www.megacurioso.com.br/rss' }
        ];

        this.viralKeywords = [
            'descoberta', 'mistério', 'choca', 'revela', 'estudo', 'guerra', 'bizarro', 
            'espaço', 'planeta', 'cientistas', 'história', 'antigo', 'secreto',
            'misterioso', 'inexplicável', 'surpreendente', 'incrível', 'raro', 
            'desconhecido', 'proibido', 'perigo', 'avisado', 'encontrado', 'revelado',
            'bíblico', 'profecia', 'amazônia', 'interior', 'brasil', 'lenda', 'ufologia'
        ];

        this.blacklistKeywords = [
            'futebol', 'gol', 'neymar', 'messi', 'champions league', 'brasileirão', 
            'flamengo', 'palmeiras', 'estádio', 'fifa', 'jogador', 'técnico', 
            'escalação', 'copa do mundo', 'partida', 'campeonato', 'venceu', 'perdeu'
        ];
    }

    async getLatestNews() {
        logger.info('📰 [Viral Scraper] Iniciando varredura estratégica de notícias mundiais e curiosidades...');
        const { safeFetch } = require('../agents/utils');
        let allNews = [];

        // Fontes expandidas e robustas
        const activeSources = [...this.sources];

        for (const source of activeSources) {
            try {
                logger.info(`📡 Acessando feed: ${source.name}...`);
                const response = await safeFetch(source.url, { 
                    headers: { 'Accept': 'application/xml,text/xml,application/rss+xml' }
                });
                
                const data = response.data.toString();

                // Validação de Integridade XML (Senior Level)
                if (!data.trim().startsWith('<')) {
                    logger.warn(`⚠️ Fonte ${source.name} retornou conteúdo não-XML. Possível bloqueio ou erro 403/429.`);
                    continue;
                }

                // Extração robusta de itens do RSS
                const items = data.match(/<item>([\s\S]*?)<\/item>/g) || [];
                
                if (items.length === 0) {
                    logger.debug(`ℹ️ Nenhum <item> encontrado no feed ${source.name}.`);
                    continue;
                }
                
                const sourceNews = items.map(item => {
                    // Limpeza CDATA e tags
                    const clean = (str) => (str || '').replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
                    
                    const title = clean((item.match(/<title>([\s\S]*?)<\/title>/) || [null, ''])[1]);
                    const link = clean((item.match(/<link>([\s\S]*?)<\/link>/) || [null, ''])[1]);
                    const descriptionMatch = item.match(/<description>([\s\S]*?)<\/description>/);
                    const description = descriptionMatch ? clean(descriptionMatch[1]) : "";
                    
                    // Prioridade 1: <media:content> ou <media:thumbnail> ou <enclosure>
                    const mediaMatch = item.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/i);
                    let image = mediaMatch ? mediaMatch[1] : null;

                    // Prioridade 2: <img> dentro da description
                    if (!image && description) {
                        const imgInDesc = description.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (imgInDesc) image = imgInDesc[1];
                    }

                    if (title && link) {
                        return {
                            title,
                            link,
                            description: description.replace(/<[^>]*>?/gm, '').substring(0, 300), // Remove HTML
                            image: image,
                            source: source.name
                        };
                    }
                    return null;
                }).filter(n => n && this.isViral(n.title) && !this.isBlacklisted(n.title));

                allNews = allNews.concat(sourceNews);
            } catch (error) {
                const status = error.response ? error.response.status : 'TIMEOUT';
                logger.warn(`⚠️ Fonte ${source.name} ignorada após falhas críticas (${status}).`);
                continue;
            }
        }

        // Remover duplicados por link
        allNews = Array.from(new Map(allNews.map(item => [item.link, item])).values());
        
        logger.info(`✅ Varredura finalizada. ${allNews.length} notícias virais filtradas.`);
        return allNews;
    }

    isViral(title) {
        const lowerTitle = title.toLowerCase();
        return this.viralKeywords.some(kw => lowerTitle.includes(kw.toLowerCase()));
    }

    isBlacklisted(title) {
        const lowerTitle = title.toLowerCase();
        return this.blacklistKeywords.some(kw => lowerTitle.includes(kw.toLowerCase()));
    }

    async getTrendingTopics() {
        const news = await this.getLatestNews();
        if (news.length === 0) return [];
        return news.sort(() => Math.random() - 0.5);
    }
}

module.exports = new TrendsModule();
