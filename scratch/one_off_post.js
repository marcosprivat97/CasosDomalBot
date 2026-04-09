require('dotenv').config();
const logger = require('../src/logger');
const trendsModule = require('../src/trend');
const orchestrator = require('../src/agents/orchestrator');
const imageModule = require('../src/modules/image.module');
const { createViralCollage } = require('../src/image');
const { postToFacebook } = require('../src/facebook');
const fs = require('fs');
const path = require('path');

async function forcePost() {
    try {
        logger.info('🚀 [FORCE POST] Iniciando geração imediata de conteúdo viral...');

        // 1. Capturar uma tendência de curiosidade
        const news = await trendsModule.getTrendingTopic();
        logger.info(`🔍 Tema selecionado: ${news.title}`);

        // 2. Produzir conteúdo (Cérebro do Bot)
        const production = await orchestrator.produceContent(news);
        if (production.status === 'descartado') {
            logger.error('❌ Conteúdo descartado pelos agentes. Tentando novamente...');
            return forcePost();
        }

        const { writer, visual } = production;

        // 3. Buscar Imagem (Mão na massa)
        logger.info('📸 Buscando imagens impactantes...');
        const mediaBuffer = await imageModule.extractRealImageFromNews({
            ...news,
            ...visual
        });

        if (!mediaBuffer) {
            logger.error('❌ Falha ao obter imagens para este post.');
            return;
        }

        // 4. Montar Arte Final
        logger.info('🎨 Compondo layout Casos Domal Elite...');
        const img1 = Array.isArray(mediaBuffer) ? mediaBuffer[0] : mediaBuffer;
        const img2 = Array.isArray(mediaBuffer) ? mediaBuffer[1] : null;

        const finalBuffer = await createViralCollage(img1, img2, writer.titulo_imagem, writer.subtitulo_imagem);
        
        const tempPath = path.join(__dirname, `../temp_forced_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, finalBuffer);

        // 5. PUBLICAR NO FACEBOOK
        logger.info(`🚀 Publicando agora: "${writer.titulo_imagem}"`);
        const fbResponse = await postToFacebook(writer.post_completo, tempPath);

        if (fbResponse && fbResponse.id) {
            logger.info(`✅ SUCESSO ABSOLUTO! Post publicado com ID: ${fbResponse.id}`);
            // Adicionar ao histórico para evitar repetição
            const historyModule = require('../src/modules/history.module');
            historyModule.add(news.title, news.link, 'image');
        }

        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    } catch (error) {
        logger.error(`❌ Erro no Force Post: ${error.stack}`);
    }
}

forcePost();
