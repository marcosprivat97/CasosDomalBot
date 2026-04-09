require('dotenv').config();
const axios = require('axios');

async function scanProvider() {
    const key = process.env.NOVA_API_KEY_1;
    if (!key) return console.log("❌ Chave não encontrada.");

    const endpoints = [
        { name: "SambaNova", url: "https://api.sambanova.ai/v1/models" },
        { name: "Novita AI", url: "https://api.novita.ai/v3/openai/models" },
        { name: "Together AI", url: "https://api.together.xyz/v1/models" },
        { name: "Anyscale", url: "https://api.endpoints.anyscale.com/v1/models" }
    ];

    console.log(`🔍 Escaneando provedor para a chave: ${key.substring(0, 8)}...`);

    for (const api of endpoints) {
        try {
            console.log(`📡 Testando ${api.name}...`);
            const res = await axios.get(api.url, {
                headers: { "Authorization": `Bearer ${key}` },
                timeout: 5000
            });
            console.log(`✅ SUCESSO! O provedor é: ${api.name}`);
            console.log("📂 Modelos disponíveis:", res.data.data.map(m => m.id).slice(0, 3));
            return;
        } catch (e) {
            console.log(`❌ ${api.name} recusou: ${e.response ? e.response.status : e.message}`);
        }
    }
    console.log("🛑 Nenhum provedor reconheceu a chave. Possibilidade: Local Ollama ou Link Customizado.");
}

scanProvider();
