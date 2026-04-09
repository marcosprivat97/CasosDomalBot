const CompositionModule = require('../src/modules/composition.module');
const path = require('path');
const logger = require('../src/logger');

async function generateFinalDemo() {
    const baseImagePath = "C:\\Users\\seven beatx\\.gemini\\antigravity\\brain\\fae597eb-209b-4309-b8ef-0191c9a1dca7\\mysterious_sphere_minas_v6_1775756338323.png";
    const title = "MORADORES DE MINAS GERAIS RELATAM ESFERAS LUMINOSAS NOS CÉUS E O MISTÉRIO SOBRE O BRASIL SÓ AUMENTA";
    const subtitle = "Fenômenos inexplicáveis foram registrados em vídeo e estão sendo investigados por especialistas. Fatos reais e bizarros para você refletir.";

    logger.info("🎨 Gerando Arte Final Realista para demonstração...");
    
    try {
        const finalPath = await CompositionModule.compose(baseImagePath, title, subtitle);
        console.log(`✅ ARTE FINAL GERADA: ${finalPath}`);
    } catch (error) {
        console.error("❌ Erro:", error);
    }
}

generateFinalDemo();
