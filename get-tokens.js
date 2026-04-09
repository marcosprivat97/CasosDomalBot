// Script para buscar o Token de Pgina usando o ID de Usurio Direto
require('dotenv').config();
const axios = require('axios');

async function getPageTokens() {
    const userToken = process.env.FB_ACCESS_TOKEN;
    const userId = "26186158274389240"; // Seu ID de usurio Marcos Fernandes
    
    if (!userToken || userToken.startsWith('YOUR_')) {
        console.error('ERRO: Preencha o FB_ACCESS_TOKEN no .env');
        return;
    }

    try {
        console.log(`--- Buscando Pginas para o ID: ${userId} ---`);
        
        // Tentativa direta com o ID do usurio
        const response = await axios.get(`https://graph.facebook.com/${userId}/accounts`, {
            params: { access_token: userToken }
        });

        const pages = response.data.data;
        
        if (!pages || pages.length === 0) {
            console.log('Nenhuma pgina encontrada. O seu token ainda no tem permisso para ler pginas.');
            return;
        }

        console.log('\nSUCESSO! Copie o TOKEN da sua pgina abaixo:\n');
        
        pages.forEach(page => {
            console.log(`PAGINA: ${page.name}`);
            console.log(`TOKEN: ${page.access_token}`);
            console.log('-------------------------------------------');
        });
    } catch (error) {
        console.error('ERRO: O seu token de usurio ainda no tem as permissões Pages.');
        console.log('V ao Graph Explorer e garanta que marcou: pages_show_list e pages_read_engagement');
    }
}

getPageTokens();
