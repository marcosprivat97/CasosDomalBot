const axios = require('axios');

async function checkRSS() {
    const url = 'https://g1.globo.com/rss/g1/brasil/';
    try {
        const response = await axios.get(url);
        const data = response.data;
        
        // Procurar por tags de mídia no primeiro item
        const firstItem = data.match(/<item>([\s\S]*?)<\/item>/);
        if (firstItem) {
            console.log('--- CONTEÚDO DO ITEM ---');
            console.log(firstItem[1].substring(0, 500));
            
            const mediaMatch = firstItem[1].match(/<(?:media:content|enclosure)[^>]+url=["']([^"']+)["']/i);
            console.log('\nFOTO DETECTADA NO RSS:', mediaMatch ? mediaMatch[1] : 'NÃO ENCONTRADA');
        }
    } catch (e) {
        console.error('ERRO:', e.message);
    }
}

checkRSS();
