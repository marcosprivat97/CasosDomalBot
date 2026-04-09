require('dotenv').config();
const composition = require('./src/modules/composition.module');
const axios = require('axios');
const logger = require('./src/logger');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const historyModule = require('./src/modules/history.module');

async function publishEmergency() {
    const headline = "VINI JR: O MAIOR SALÁRIO DA ESPANHA! 💰";
    const caption = `🚨 TÁ DE BRINCADEIRA? O NOSSO CRIA SIMPLESMENTE ZEROU A EUROPA! 🤯🚨
...
#CasosDomal #ViniJr #RealMadrid #LaLiga #BailaVini #Futebol #FofocaEsportiva #ViniBaila #Milionario #CriaDaBase`;

    const inputImagePath = path.join(__dirname, 'data/vini_base.png');
    
    logger.info("🎨 [Casos Domal] Iniciando Composição Ética...");
    
    try {
        // Verifica se já foi postado para evitar "cisma"
        if (historyModule.isTitlePosted(headline)) {
            logger.warn(`⚠️ O caso "${headline}" já consta no histórico. Abortando duplicata.`);
            return;
        }

        // 1. Estampar a Manchete (Usando o novo motor unificado)
        const composedImagePath = await composition.compose(inputImagePath, headline);
        logger.info(`✅ Imagem épica pronta: ${composedImagePath}`);

        // 2. Publicar no Facebook
        logger.info("🚀 [Casos Domal] Publicando POST DE ELITE no Facebook...");
        const fbUrl = `https://graph.facebook.com/v19.0/${process.env.FB_PAGE_ID}/photos`;
        
        const form = new FormData();
        form.append('source', fs.createReadStream(composedImagePath));
        form.append('caption', caption);
        form.append('access_token', process.env.FB_ACCESS_TOKEN);

        const fbResponse = await axios.post(fbUrl, form, {
            headers: form.getHeaders(),
            timeout: 60000
        });

        logger.info(`🔥 SUCESSO LENDÁRIO! Post da Casos Domal publicado ID: ${fbResponse.data.id}`);
        console.log(`\n\n✅ [VINI JR] POST PUBLICADO COM SUCESSO!\nID do Post: ${fbResponse.data.id}\n`);

        // 3. Salvar no histórico para evitar repetição!
        historyModule.add(headline, "emergency_vini_jr", 'image');

    } catch (error) {
        logger.error(`❌ Erro no disparo final: ${error.message}`);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

publishEmergency();
