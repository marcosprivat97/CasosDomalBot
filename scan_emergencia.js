const { groqRequest, novaApiRequest } = require('./src/agents/utils');
const logger = require('./src/logger');
const axios = require('axios');
require('dotenv').config();

async function scanAllApis() {
    logger.important("🔍 SCANNER DE EMERGÊNCIA: BUSCANDO CÉREBRO DISPONÍVEL...");

    // 1. Testar SambaNova (Ciclone) Keys 1 a 6
    for (let i = 1; i <= 6; i++) {
        const key = process.env[`NOVA_API_KEY_${i}`];
        if (!key) continue;
        try {
            console.log(`\n🌀 Testando SambaNova (Chave ${i})...`);
            const res = await axios.post("https://api.sambanova.ai/v1/chat/completions", {
                model: "Meta-Llama-3.1-70B-Instruct",
                messages: [{ role: "user", content: "hi" }],
                max_tokens: 5
            }, { headers: { "Authorization": `Bearer ${key}` }, timeout: 5000 });
            console.log(`✅ CHAVE ${i} VIVA!`);
            return;
        } catch (e) {
            console.log(`❌ Chave ${i} morta: ${e.response ? e.response.status : e.message}`);
        }
    }

    // 2. Testar Groq
    try {
        console.log("\n🐺 Testando Groq...");
        const { Groq } = require("groq-sdk");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        await groq.chat.completions.create({ model: "llama-3.1-8b-instant", messages: [{role:"user", content:"hi"}], max_tokens: 5 });
        console.log("✅ GROQ VOLTOU À VIDA!");
        return;
    } catch (e) {
        console.log(`❌ Groq continua esgotado: ${e.message}`);
    }

    console.log("\n⚠️ CONCLUSÃO: Todas as IAs principais estão sem crédito.");
}

scanAllApis();
