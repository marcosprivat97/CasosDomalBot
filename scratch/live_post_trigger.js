require('dotenv').config();
const { searchImages } = require('../src/agents/utils');
const { createViralCollage } = require('../src/image');
const { postToFacebook } = require('../src/facebook');
const logger = require('../src/logger');
const fs = require('fs');
const path = require('path');

async function runEmergencyDemo() {
    try {
        logger.important("🚨 [PROTOCOLO DE EMERGÊNCIA] BYPASS DE IA PARA DEMONSTRAÇÃO VISUAL");
        
        // 1. DADOS VIRAIS (Hardcoded para evitar Rate Limit das IAs)
        const tema = "O MISTÉRIO DA ESFERA GIGANTE EM MINAS GERAIS";
        const titulo_imagem = "A ESFERA DE MINAS";
        const subtitulo_imagem = "CUIDADO: É BIZARRO";
        const legenda = `🛸 O MISTÉRIO QUE PAROU MINAS GERAIS! 🛸

Moradores de uma pequena cidade no interior de MG entraram em pânico hoje ao encontrar esse objeto metálico gigante. Ninguém sabe a origem, e o exército já cercou a área. 😱

Seria tecnologia humana ou... algo de fora? O que você acha que é isso? Deixe seu palpite nos comentários! 👇👇

#CasosDomal #Mistério #MinasGerais #UFO #Bizarro`;

        logger.info(`🔍 Buscando imagens reais para o tema: ${tema}`);
        
        // 2. Motor de Busca (Fixed v6.3)
        let images = await searchImages(tema, 2);
        
        if (images.length === 0) {
            logger.warn("⚠️ Nenhuma imagem encontrada. Usando Stock de Emergência...");
            const stockBuffer = require("../src/modules/image.module").getStockBackground();
            images = [{ buffer: stockBuffer }];
        }

        // 3. Motor de Arte (V4.4 + Logo V2)
        logger.info("🎨 Gerando Arte Final Premium...");
        const imageBuffer = await createViralCollage(
            images[0].buffer, 
            images[1] ? images[1].buffer : null, 
            titulo_imagem, 
            subtitulo_imagem,
            { type: 'feed', documentaryMode: true }
        );

        const tempPath = path.join(__dirname, `../data/output/emergency_demo_${Date.now()}.png`);
        fs.writeFileSync(tempPath, imageBuffer);
        
        // 4. Postagem Real
        logger.important("🚀 POSTANDO NO FACEBOOK...");
        const postClonePath = path.join(__dirname, `../temp_emergency_post.png`);
        fs.copyFileSync(tempPath, postClonePath);
        
        const fbResult = await postToFacebook(legenda, postClonePath);
        
        logger.important(`🔥 SUCESSO ABSOLUTO! Postagem ID: ${fbResult.id}`);
        console.log("\n--- PREVIEW ---");
        console.log("IMAGEM SALVA LOCALMENTE PARA VOCÊ VER:", tempPath);
        console.log("----------------\n");

    } catch (error) {
        logger.error(`❌ Erro no disparo de emergência: ${error.message}`);
        console.error(error);
    }
}

runEmergencyDemo();
