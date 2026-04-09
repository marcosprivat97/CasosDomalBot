require('dotenv').config();
const axios = require('axios');

async function listAllModels() {
    const key = process.env.NOVA_API_KEY_1;
    if (!key) return console.log("❌ Chave não encontrada.");

    try {
        console.log(`🔍 [SAMBANOVA] Listando todos os modelos para a chave: ${key.substring(0, 8)}...`);
        const res = await axios.get("https://api.sambanova.ai/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
        });
        
        const models = res.data.data.map(m => m.id);
        console.log("📂 MODELOS DISPONÍVEIS:", JSON.stringify(models, null, 2));
        
        // Testa um POST rápido com o primeiro modelo da lista
        if (models.length > 0) {
            console.log(`📡 Testando POST com o modelo: ${models[0]}...`);
            try {
                const postRes = await axios.post("https://api.sambanova.ai/v1/chat/completions", {
                    model: models[0],
                    messages: [{ role: "user", content: "oi" }]
                }, {
                    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
                });
                console.log("✅ SUCESSO NO POST!");
            } catch (postError) {
                console.log(`❌ FALHA NO POST (${models[0]}):`, postError.response ? postError.response.status : postError.message);
            }
        }
    } catch (e) {
        console.log(`❌ Erro na SambaNova: ${e.message}`);
    }
}

listAllModels();
