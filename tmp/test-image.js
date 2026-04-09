const imageModule = require('./src/modules/image.module');
const logger = require('./src/logger');


async function testExtraction() {
    const testUrls = [
        'https://g1.globo.com/ma/maranhao/noticia/2026/04/03/adolescente-morre-afogado-no-rio-preguicas-em-barreirinhas.ghtml',
        'https://noticias.uol.com.br/cotidiano/ultimas-noticias/2024/04/02/corpo-e-encontrado-em-carro-no-rio.htm'
    ];

    for (const url of testUrls) {
        console.log(`\n--- Testando URL: ${url} ---`);
        const imgUrl = await imageModule.extractRealImageFromNews(url);
        
        if (imgUrl) {
            console.log(`✅ URL extraída: ${imgUrl}`);
            const buffer = await imageModule.downloadImageToBuffer(imgUrl, url);
            if (buffer && buffer.length > 0) {
                console.log(`✅ Download SUCESSO! Tamanho: ${buffer.length} bytes`);
            } else {
                console.log(`❌ Download FALHOU (Provável 403 ou similar)`);
            }
        } else {
            console.log(`❌ Extração FALHOU (Meta-tag não encontrada)`);
        }
    }
}

testExtraction();
