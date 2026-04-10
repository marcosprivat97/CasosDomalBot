const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const logger = require('../logger');

/**
 * Publica uma imagem com texto na Página do Facebook.
 * @param {string} message - O texto do post.
 * @param {string} imagePath - O caminho local da imagem.
 */
async function postToFacebook(message, imagePath) {
    const pageId = process.env.FB_PAGE_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;

    if (!pageId || !accessToken || accessToken === 'SEU_TOKEN_AQUI') {
        logger.warn('⚠️ FB_PAGE_ID ou FB_ACCESS_TOKEN ausente. Simulando postagem...');
        return { id: 'mock_' + Date.now() };
    }

    try {
        logger.info(`📤 [FB] Publicando na página ${pageId}...`);
        
        const form = new FormData();
        form.append('message', message);
        form.append('source', fs.createReadStream(imagePath));
        form.append('access_token', accessToken);

        const response = await axios.post(`https://graph.facebook.com/v21.0/${pageId}/photos`, form, {
            headers: form.getHeaders(),
            timeout: 60000
        });

        logger.important(`✅ [FB] Post publicado com sucesso! ID: ${response.data.id}`);
        return { id: response.data.id };
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        logger.error(`❌ [FB] Erro ao publicar: ${errorMsg}`);
        throw new Error(`Falha no Facebook: ${errorMsg}`);
    }
}

/**
 * Adiciona um comentário a um post existente.
 */
async function addCommentToPost(postId, message) {
    const accessToken = process.env.FB_ACCESS_TOKEN;
    if (!accessToken || accessToken === 'SEU_TOKEN_AQUI') return;

    try {
        await axios.post(`https://graph.facebook.com/v21.0/${postId}/comments`, {
            message: message,
            access_token: accessToken
        });
        logger.info(`💬 [FB] Comentário adicionado ao post ${postId}`);
    } catch (error) {
        logger.error(`❌ [FB] Erro ao comentar: ${error.message}`);
    }
}

module.exports = {
    postToFacebook,
    addCommentToPost
};
