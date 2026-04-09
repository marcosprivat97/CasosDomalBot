const axios = require('axios');
const logger = require('./logger');

/**
 * Motor de Geração Visual Realista (Pollinations - Grátis e Ilimitado)
 */
async function generateImage(prompt, retries = 3) {
  // SUFIXOS DE REALISMO BRUTAL: Para fotos documentais, reais e sem cara de IA
  const enhancedPrompt = `${prompt}, RAW photo, realistic textures, documentary style, 8k, sharp focus, fujifilm photography, historical press photo`;
  
  try {
    logger.info('📸 IA Visual: Gerando imagem via Pollinations...');
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;
    
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    logger.info('🎨 Imagem capturada com Sucesso!');
    return Buffer.from(response.data);
  } catch (err) {
    logger.error(`💥 FALHA NA GERAÇÃO DE IMAGEM: ${err.message}`);
    
    // Tenta uma versão simplificada em caso de erro
    try {
        logger.warn('🔄 Tentativa de Backup Pollinations (Simples)...');
        const simpleUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
        const resp2 = await axios.get(simpleUrl, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(resp2.data);
    } catch (err2) {
        logger.error(`❌ Falha Crítica na Geração Visual: ${err2.message}`);
        throw new Error('Incapaz de gerar imagens no momento.');
    }
  }
}

module.exports = { generateImage };
