require('dotenv').config();
const ImageGenerator = require('./src/modules/image_generator.module');
const { createViralCollage } = require('./src/image');
const fs = require('fs');
const path = require('path');
const logger = require('./src/logger');

async function generateChatDemo() {
    logger.info("🎬 Iniciando geração de demonstração visual (FOTO REAL + BRANDING)...");

    const tema = "Ratanabá - A Cidade Perdida da Amazônia";
    const visualData = {
        tema: "Ratanabá",
        palavra_chave_busca: "Ratanabá cidade perdida foto real",
        prompt_principal: "Ancient stone structures in the Amazon jungle, realistic photography"
    };

    try {
        // 1. Buscar foto real (Prioridade)
        const realBuffer = await ImageGenerator.generate(tema, visualData);
        
        if (!realBuffer) {
            throw new Error("Não foi possível encontrar uma foto real nem gerar via IA.");
        }

        // 2. Aplicar Branding e Edição
        const finalBuffer = await createViralCollage(
            realBuffer, 
            null, 
            "RATANABÁ: A CIDADE PERDIDA?", 
            "EXPEDIÇÃO REVELA ESTRUTURAS CHOCANTES",
            { type: 'feed', documentaryMode: true }
        );

        const outPath = path.join(process.cwd(), 'ratanaba_real_demo.jpg');
        fs.writeFileSync(outPath, finalBuffer);
        
        console.log(`\n✅ DEMO CONCLUÍDA!`);
        console.log(`📂 Caminho absoluto: ${outPath}`);

    } catch (e) {
        console.error(`❌ Erro na demo: ${e.message}`);
    }
}

generateChatDemo();
