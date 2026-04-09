const ImageGenerator = require('./src/modules/image_generator.module');
const { createViralCollage } = require('./src/image');
const fs = require('fs');
const path = require('path');
const logger = require('./src/logger');

async function generateFinalProof() {
    logger.important("💎 GERANDO PROVA FINAL: FREEPIK + DESIGN DUAL COLLAGE");
    
    // Simulação do que o Diretor Visual decidiria
    const directInstructions = {
        decisao_layout: "dual_collage",
        busca_foto_1: "ancient gold city ruins underground",
        busca_foto_2: "mysterious light in a deep dark cave",
        tema: "A CIDADE PERDIDA DE RATANABÁ"
    };

    try {
        logger.info("🔍 [FREEPIK] Buscando imagens premium para Ratanabá...");
        const visualResult = await ImageGenerator.generate(directInstructions.tema, directInstructions);

        if (!visualResult || !visualResult.img1) {
            throw new Error("O Freepik não retornou as fotos necessárias no momento.");
        }

        logger.info("🎨 [SHARP] Compondo a Arte Final com branding premium...");
        const imageBuffer = await createViralCollage(
            visualResult.img1, 
            visualResult.img2, 
            "RATANABÁ: A CIDADE DE OURO", 
            "Descobertas incríveis no coração da Amazônia",
            { type: 'feed', documentaryMode: true }
        );

        const finalPath = path.join(process.cwd(), 'PROVA_FINAL_FREEPIK.jpg');
        fs.writeFileSync(finalPath, imageBuffer);
        
        console.log(`\n✅ SUCESSO!`);
        console.log(`📂 Imagem Gerada: ${finalPath}`);
        console.log(`🚀 Este é o padrão que o seu robô vai seguir agora!`);

    } catch (e) {
        console.error("💥 Erro na geração da prova:", e.message);
    }
}

generateFinalProof();
