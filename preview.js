require('dotenv').config();
const { generateStory } = require('./src/story');
const trendsModule = require('./src/modules/trends.module');
const imageModule = require('./src/modules/image.module');
const { createViralCollage } = require('./src/image');
const logger = require('./src/logger');
const fs = require('fs');
const path = require('path');

/**
 * Motor de Preview Elite v5.3.1 (Real Images Only)
 * Gera o post completo APENAS SE encontrar uma foto real nos portais.
 */
async function generatePreview() {
    console.log('🔍 [MODO PREVIEW ELITE] Buscando impacto real nos portais...');
    
    try {
        // 1. Capturar Lista de Notícias
        const newsList = await trendsModule.getLatestNews();
        
        let selectedNews = null;
        let realImageBuffer = null;

        // 2. Loop de busca por foto real (vítima/assassino/cena)
        for (const news of newsList) {
            console.log(`📡 Analisando: ${news.title.substring(0, 50)}...`);
            const buffer = await imageModule.extractRealImageFromNews(news);
            
            if (buffer) {
                console.log(`✅ SUCESSO! Foto real capturada para este caso.`);
                selectedNews = news;
                realImageBuffer = buffer;
                break;
            }
            console.log(`❌ Sem foto real satisfatória, tentando próxima...`);
        }

        if (!selectedNews || !realImageBuffer) {
            console.error('❌ Nenhuma foto real encontrada em nenhuma das notícias atuais.');
            return;
        }

        // 3. Storytelling
        const story = await generateStory(selectedNews);
        console.log('\n--- LEGENDA GERADA (5 ETAPAS) ---');
        console.log(story.caption);
        console.log('-------------------------------\n');

        // 4. Montagem Visual
        const finalImageBuffer = await createViralCollage(
            realImageBuffer, 
            null, 
            story.title, 
            story.subtitle
        );

        // 5. Salvar Preview
        const previewPath = path.join(__dirname, 'preview_post_v5_3.jpg');
        fs.writeFileSync(previewPath, finalImageBuffer);
        
        console.log(`✅ PREVIEW REAL GERADO! Caminho: ${previewPath}`);
        console.log(`\nCASO: ${selectedNews.title}`);
        
        return { story, previewPath };

    } catch (error) {
        console.error('❌ Erro no Preview:', error.message);
    }
}

generatePreview();
