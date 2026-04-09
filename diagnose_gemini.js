const axios = require('axios');
require('dotenv').config();

async function deepCheck() {
    const key = (process.env.GEMINI_API_KEY || "").trim();
    if (!key) {
        console.log("❌ ERRO: Chave não encontrada no .env");
        return;
    }

    try {
        console.log("🔍 [REST API] Listando modelos autorizados...");
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        
        if (res.data && res.data.models) {
            console.log("\n✅ MODELOS DISPONÍVEIS:");
            res.data.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        } else {
            console.log("⚠️ Resposta vazia do Google.");
        }
    } catch (e) {
        console.log("❌ Falha crítica no diagnóstico:");
        if (e.response) {
            console.log(`Status: ${e.response.status}`);
            console.log(`Mensagem: ${JSON.stringify(e.response.data)}`);
        } else {
            console.log(e.message);
        }
    }
}

deepCheck();
