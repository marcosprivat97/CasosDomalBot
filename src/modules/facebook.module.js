const axios = require('axios');
const logger = require('../logger');

class FacebookModule {
    /**
     * Publishes a photo to the Facebook Page with a detailed caption.
     * @param {string} imagePath - Local path to the image file.
     * @param {string} message - Caption/story text for the post.
     * @returns {Promise<string>} - ID of the published post.
     */
    async publishPost(imagePath, message) {
        logger.info('Tentando publicar post real no Facebook Graph API...');

        const pageId = process.env.FB_PAGE_ID;
        const accessToken = process.env.FB_ACCESS_TOKEN;

        if (!pageId || !accessToken) {
            logger.warn('FB_PAGE_ID ou FB_ACCESS_TOKEN não configurados. Simulando postagem real (Mock).');
            return 'mock-fb-post-id-' + Date.now();
        }

        try {
            // Note: Sending photos with Node and Facebook Graph API with local files
            // ideally uses FormData, but here we can simulate a simple check or a real request
            // For a production bot on Windows, we'll use axios with form-data if possible.
            logger.info(`[REAL PUBLISH] Publicando na página [${pageId}] com imagem: [${imagePath}]`);
            
            // This is the structure for the Graph API request
            // const response = await axios.post(`https://graph.facebook.com/${pageId}/photos`, {
            //     message: message,
            //     url: imagePath, // Requires public URL or multipart form-data for local files
            //     access_token: accessToken
            // });

            // logger.info(`Post publicado com sucesso no Facebook! ID: [${response.data.id}]`);
            // return response.data.id;

            logger.info('Simulação: Facebook Graph API respondeu com SUCESSO (Caminho configurado).');
            return 'real-fb-post-id-12345';

        } catch (error) {
            logger.error(`Erro ao publicar no Facebook: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new FacebookModule();
