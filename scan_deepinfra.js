require('dotenv').config();
const axios = require('axios');

async function scanDeepInfra() {
    const key = process.env.NOVA_API_KEY_1;
    if (!key) return console.log("❌ Chave não encontrada.");

    console.log(`🔍 [DEEPINFRA] Testando a chave: ${key.substring(0, 8)}...`);

    try {
        const res = await axios.post("https://api.deepinfra.com/v1/openai/chat/completions", {
            model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
            messages: [{ role: "user", content: "Diga Ok" }]
        }, {
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
        });
        
        console.log("✅ SUCESSO NA DEEPINFRA!");
        console.log("📄 Resposta:", res.data.choices[0].message.content);
    } catch (e) {
        console.log(`❌ DeepInfra recusou: ${e.response ? e.response.status : e.message}`);
        if (e.response && e.response.data) console.log("📦 Detalhes:", JSON.stringify(e.response.data));
    }
}

scanDeepInfra();
