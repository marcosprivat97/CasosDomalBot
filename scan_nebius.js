require('dotenv').config();
const axios = require('axios');

async function scanNebius() {
    const key = process.env.NOVA_API_KEY_1;
    if (!key) return console.log("❌ Chave não encontrada.");

    console.log(`🔍 [NEBIUS AI] Testando a chave: ${key.substring(0, 8)}...`);

    try {
        const res = await axios.post("https://api.studio.nebius.ai/v1/chat/completions", {
            model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
            messages: [{ role: "user", content: "Diga Ok" }]
        }, {
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
        });
        
        console.log("✅ SUCESSO NA NEBIUS AI!");
        console.log("📄 Resposta:", res.data.choices[0].message.content);
    } catch (e) {
        console.log(`❌ Nebius AI recusou: ${e.response ? e.response.status : e.message}`);
        if (e.response && e.response.data) console.log("📦 Detalhes:", JSON.stringify(e.response.data));
    }
}

scanNebius();
