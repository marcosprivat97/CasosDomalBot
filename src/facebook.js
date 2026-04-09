const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('./logger');

// Throttling de Erros (Silencia logs repetitivos por 5 minutos)
const errorCache = new Map();
function throttledLogError(key, message) {
    const now = Date.now();
    const lastLog = errorCache.get(key) || 0;
    if (now - lastLog > 300000) { // 5 minutos
        logger.error(`${key}: ${message}`);
        errorCache.set(key, now);
    }
}

/**
 * Publica no Facebook Graph API (Versão Sênior)
 * @param {string} caption A legenda viral
 * @param {string} imagePath O caminho do arquivo gerado pelo Sharp
 */
async function postToFacebook(caption, imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Arquivo de imagem não encontrado: ${imagePath}`);
        }

        const form = new FormData();
        form.append('source', fs.createReadStream(imagePath));
        form.append('caption', caption);
        form.append('access_token', process.env.FB_ACCESS_TOKEN);

        const url = `https://graph.facebook.com/v18.0/${process.env.FB_PAGE_ID}/photos`;

        logger.info(`Conectando a Graph API para postar imagem...`);
        const response = await axios.post(url, form, {
            headers: { ...form.getHeaders() },
            timeout: 60000 // 60s para upload de imagem
        });

        return response.data;
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`Falha critica na postagem Facebook: ${errorMsg}`);
        throw new Error(`Facebook API Error: ${errorMsg}`);
    } finally {
        // Limpeza de arquivo temporario GARANTIDA (v11.5)
        if (fs.existsSync(imagePath)) {
            try {
                fs.unlinkSync(imagePath);
                logger.info('Arquivo temporario removido localmente.');
            } catch (unlinkErr) {
                logger.error(`Falha ao remover arquivo temporario: ${unlinkErr.message}`);
            }
        }
    }
}

/**
 * Publica VÍDEO no Facebook Graph API
 * @param {string} description A legenda do vídeo
 * @param {string} videoPath Caminho do arquivo de vídeo processado
 */
async function postVideoToFacebook(description, videoPath) {
    try {
        if (!fs.existsSync(videoPath)) {
            throw new Error(`Arquivo de vídeo não encontrado: ${videoPath}`);
        }

        const form = new FormData();
        form.append('file', fs.createReadStream(videoPath));
        form.append('description', description);
        form.append('access_token', process.env.FB_ACCESS_TOKEN);

        const url = `https://graph.facebook.com/v18.0/${process.env.FB_PAGE_ID}/videos`;

        logger.info(`Conectando a Graph API para postar vídeo (Elite v6.0)...`);
        const response = await axios.post(url, form, {
            headers: { ...form.getHeaders() },
            timeout: 300000 // 5 minutos para upload de vídeo (arquivos maiores)
        });

        // Limpeza de arquivo temporario pos-sucesso
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            logger.info('Arquivo de vídeo temporário removido localmente.');
        }

        return response.data;
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`Falha critica na postagem de VÍDEO no Facebook: ${errorMsg}`);
        throw new Error(`Facebook Video API Error: ${errorMsg}`);
    }
}

/**
 * Busca métricas reais da página (Seguidores, Curtidas, etc)
 */
async function getPageMetrics() {
    try {
        const url = `https://graph.facebook.com/v18.0/${process.env.FB_PAGE_ID}?fields=followers_count,fan_count,name&access_token=${process.env.FB_ACCESS_TOKEN}`;
        const response = await axios.get(url, { timeout: 10000 });
        return {
            followers: response.data.followers_count || 0,
            likes: response.data.fan_count || 0,
            name: response.data.name
        };
    } catch (error) {
        const isAuthError = error.response && (error.response.status === 401 || (error.response.data.error && error.response.data.error.code === 190));
        const msg = isAuthError ? 'TOKEN INVALIDO OU EXPIRADO' : error.message;
        
        throttledLogError('Erro ao buscar metricas da pagina', msg);
        
        if (isAuthError) {
            const authErr = new Error('FB_AUTH_FAILED');
            authErr.status = 401;
            throw authErr;
        }
        return { followers: 0, likes: 0, name: 'Página' };
    }
}

/**
 * Busca Alcance e Impressões (Insights)
 */
async function getPageInsights() {
    try {
        const url = `https://graph.facebook.com/v19.0/${process.env.FB_PAGE_ID}/insights?metric=page_impressions_unique,page_post_engagements&period=day&access_token=${process.env.FB_ACCESS_TOKEN}`;
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data.data;
        
        const reach = data.find(i => i.name === 'page_impressions_unique')?.values[0]?.value || 0;
        const engagement = data.find(i => i.name === 'page_post_engagements')?.values[0]?.value || 0;
        
        return { reach, engagement };
    } catch (error) {
        const isAuthError = error.response && (error.response.status === 401 || (error.response.data.error && error.response.data.error.code === 190));
        const msg = isAuthError ? 'TOKEN INVÁLIDO OU EXPIRADO' : error.message;

        throttledLogError('Erro ao buscar insights da página', msg);
        
        if (isAuthError) {
            const authErr = new Error('FB_AUTH_FAILED');
            authErr.status = 401;
            throw authErr;
        }
        return { reach: 0, engagement: 0 };
    }
}

/**
 * Busca métricas específicas de um post (CURTIDAS, COMENTÁRIOS, SHARES e ALCANCE)
 */
async function getPostMetrics(postId) {
    try {
        // 1. Curtidas e Comentários (via campos extras no post)
        const urlMain = `https://graph.facebook.com/v19.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${process.env.FB_ACCESS_TOKEN}`;
        const resMain = await axios.get(urlMain, { timeout: 15000 });
        
        const likes = resMain.data.likes?.summary?.total_count || 0;
        const comments = resMain.data.comments?.summary?.total_count || 0;
        const shares = resMain.data.shares?.count || 0;

        // 2. Alcance Orgânico (via insights do post)
        const urlInsights = `https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions_unique,post_engaged_users&access_token=${process.env.FB_ACCESS_TOKEN}`;
        const resInsights = await axios.get(urlInsights, { timeout: 15000 });
        
        const reach = resInsights.data.data?.find(m => m.name === 'post_impressions_unique')?.values[0]?.value || 0;
        const engaged_users = resInsights.data.data?.find(m => m.name === 'post_engaged_users')?.values[0]?.value || 0;
        
        const engagement_rate = reach > 0 ? ((engaged_users / reach) * 100).toFixed(2) : 0;

        return { likes, comments, shares, reach, engagement_rate };
    } catch (error) {
        logger.error(`❌ Erro ao buscar métricas do post ${postId}: ${error.message}`);
        return { likes: 0, comments: 0, shares: 0, reach: 0, engagement_rate: 0 };
    }
}
/**
 * Busca a contagem de comentários recentes (Soma dos últimos 5 posts)
 */
async function getRecentCommentsCount() {
    try {
        const url = `https://graph.facebook.com/v19.0/${process.env.FB_PAGE_ID}/feed?limit=5&fields=comments.summary(true)&access_token=${process.env.FB_ACCESS_TOKEN}`;
        const response = await axios.get(url, { timeout: 15000 });
        
        if (!response.data || !response.data.data) return 0;
        
        const posts = response.data.data;
        let totalComments = 0;
        
        posts.forEach(post => {
            totalComments += post.comments?.summary?.total_count || 0;
        });
        
        return totalComments;
    } catch (error) {
        // Silencia erro para não travar o dashboard se falhar
        throttledLogError('Erro ao buscar total de comentarios recentes', error.message);
        return 0;
    }
}


/**
 * Busca comentários de um post específico
 */
async function getComments(postId) {
    try {
        const url = `https://graph.facebook.com/v19.0/${postId}/comments?fields=id,message,from,like_count,comment_count&access_token=${process.env.FB_ACCESS_TOKEN}`;
        const response = await axios.get(url, { timeout: 15000 });
        return response.data.data || [];
    } catch (error) {
        logger.error(`❌ Erro ao buscar comentários do post ${postId}: ${error.message}`);
        return [];
    }
}

/**
 * Adiciona um comentário em um post (Elite v11.0 - Monetização)
 */
async function addCommentToPost(postId, message) {
    try {
        const url = `https://graph.facebook.com/v19.0/${postId}/comments`;
        const response = await axios.post(url, {
            message: message,
            access_token: process.env.FB_ACCESS_TOKEN
        }, { timeout: 15000 });
        return response.data;
    } catch (error) {
        logger.error(`❌ Erro ao adicionar comentário no post ${postId}: ${error.message}`);
        return null;
    }
}

/**
 * Responde a um comentário específico
 */
async function replyToComment(commentId, message) {
    try {
        const url = `https://graph.facebook.com/v19.0/${commentId}/comments`;
        const response = await axios.post(url, {
            message: message,
            access_token: process.env.FB_ACCESS_TOKEN
        }, { timeout: 15000 });
        return response.data;
    } catch (error) {
        logger.error(`❌ Erro ao responder comentário ${commentId}: ${error.message}`);
        throw error;
    }
}

/**
 * Curte um comentário específico
 */
async function likeComment(commentId) {
    try {
        const url = `https://graph.facebook.com/v19.0/${commentId}/likes`;
        const response = await axios.post(url, {
            access_token: process.env.FB_ACCESS_TOKEN
        }, { timeout: 10000 });
        return response.data;
    } catch (error) {
        logger.error(`❌ Erro ao curtir comentário ${commentId}: ${error.message}`);
        return null;
    }
}

/**
 * Publica um STORY no Facebook Page (Versão Elite v10.0)
 * @param {string} imagePath Caminho da imagem 9:16
 */
async function postStoryToFacebook(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Arquivo de imagem para Story não encontrado: ${imagePath}`);
        }

        const form = new FormData();
        form.append('source', fs.createReadStream(imagePath));
        form.append('access_token', process.env.FB_ACCESS_TOKEN);

        const url = `https://graph.facebook.com/v19.0/${process.env.FB_PAGE_ID}/photo_stories`;

        logger.info(`📤 Publicando STORY no Facebook (Formato Vertical)...`);
        const response = await axios.post(url, form, {
            headers: { ...form.getHeaders() },
            timeout: 60000 
        });

        throw new Error(`Facebook Stories API Error: ${errorMsg}`);
    } finally {
        // Limpeza de Story
        if (fs.existsSync(imagePath)) {
            try {
                fs.unlinkSync(imagePath);
            } catch (e) {}
        }
    }
}

module.exports = { 
    postToFacebook, 
    postVideoToFacebook, 
    getPageMetrics, 
    getPageInsights, 
    getRecentCommentsCount,
    getPostMetrics,
    getComments,
    replyToComment,
    likeComment,
    postStoryToFacebook
};
