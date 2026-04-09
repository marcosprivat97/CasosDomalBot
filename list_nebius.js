require('dotenv').config();
const axios = require('axios');

async function listNebiusModels() {
    const key = process.env.NOVA_API_KEY_1;
    if (!key) return console.log("❌ Chave não encontrada.");

    console.log(`🔍 [NEBIUS AI] Listando modelos para a chave: ${key.substring(0, 8)}...`);

    try {
        const res = await axios.get("https://api.studio.nebius.ai/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
        });
        
        const models = res.data.data.map(m => m.id);
        console.log("✅ CONECTADO À NEBIUS AI!");
        console.log("📂 MODELOS:", JSON.stringify(models, null, 2));
    } catch (e) {
        console.log(`❌ Nebius AI recusou GET: ${e.response ? e.response.status : e.message}`);
    }
}

listNebiusModels();
