require('dotenv').config();
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const logger = require('./logger');

// Inicializando a SDK Oficial da Hugging Face com o Router Estável
const hf = new HfInference(process.env.HF_TOKEN, {
  endpointUrl: "https://router.huggingface.co"
});

/**
 * Motor de Geração Visual Maestria (Hugging Face SDK + fal-ai)
 */
async function generateImage(prompt, retries = 3) {
  // SUFIXOS DE REALISMO BRUTAL (Misto): Para fotos documentais, reais e sem cara de IA
  const enhancedPrompt = `RAW photo of ${prompt}, shot on 35mm lens, f/8, high shutter speed, realistic textures, natural lighting, documentary style, 8k, sharp focus, fujifilm photography, historical press photo, no post-processing filters, no cgi, no digital art style`;
  
  for (let i = 0; i < retries; i++) {
    try {
      logger.info(`📸 IA Visual Realista [Tentativa ${i + 1}]: Gerando imagem com FLUX.1-schnell (Router)...`);
      
      // Pequeno delay entre gerações sucessivas para evitar 429
      if (i > 0) await new Promise(r => setTimeout(r, 8000));

      // Usando FLUX.1-schnell (O REI do realismo Grátis na HF)
      const response = await hf.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: enhancedPrompt,
        parameters: {
          guidance_scale: 3.5, // Equilibrado para o Schnell
          num_inference_steps: 4, // Schnell é otimizado para 4 passos
          width: 1024,
          height: 1024,
        }
      });

      // Converter Blob/ArrayBuffer para Buffer Node.js
      const arrayBuffer = await response.arrayBuffer();
      logger.info('🎨 Imagem de Alta Fidelidade capturada com Sucesso!');
      return Buffer.from(arrayBuffer);

    } catch (error) {
      const statusCode = error.response?.status || error.status;
      
      if (statusCode === 401 || statusCode === 403) {
        logger.error(`❌ ERRO DE AUTENTICAÇÃO HF (401/403): O seu HF_TOKEN no arquivo .env parece inválido ou expirado.`);
        throw new Error('HF_TOKEN_INVALIDO');
      }

      logger.error(`❌ Erro Visual na SDK HF: ${error.message}`);
      
      if (statusCode === 503 || statusCode === 429) {
        logger.warn(`⏳ Servidor da Hugging Face sob carga ou Rate Limit... aguardando 15s (Tentativa ${i+1}/${retries}).`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      if (i === retries - 1) {
        return generateBackupImage(prompt);
      }
    }
  }
}

/**
 * Backup Estratégico (Pollinations)
 */
async function generateBackupImage(prompt) {
  try {
    logger.warn('🌪️ Acionando Plano B (Pollinations)...');
    const encodedPrompt = encodeURIComponent(`${prompt}, photorealistic, cinematic`);
    const backupUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    
    const response = await axios.get(backupUrl, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(response.data);
  } catch (err) {
    logger.error(`💥 FALHA CRÍTICA EM TODAS AS FRENTES: ${err.message}`);
    throw new Error('Incapaz de gerar imagens no momento.');
  }
}

module.exports = { generateImage };
