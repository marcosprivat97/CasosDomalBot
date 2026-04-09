require('dotenv').config();
const axios = require('axios');

async function scanSiliconFlow() {
    let key = process.env.NOVA_API_KEY_1;
    if (!key) return console.log("❌ Chave não encontrada.");

    // Tenta com e sem prefixo sk-
    const variations = [key, `sk-${key}`];

    console.log(`🔍 [SILICONFLOW] Testando DNA para a chave iniciada em: ${key.substring(0, 8)}...`);

    for (const token of variations) {
        try {
            console.log(`📡 Testando com Token: ${token.substring(0, 5)}...`);
            const res = await axios.post("https://api.siliconflow.cn/v1/chat/completions", {
                model: "deepseek-ai/DeepSeek-V3",
                messages: [{ role: "user", content: "Diga Ok" }],
                max_tokens: 10
            }, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                timeout: 5000
            });
            
            console.log("✅ SUCESSO ABSOLUTO NA SILICONFLOW!");
            console.log("📄 Resposta:", res.data.choices[0].message.content);
            console.log(`🔑 VOCÊ DEVE USAR O PREFIXO: ${token.startsWith('sk-') ? 'Sim' : 'Não'}`);
            return;
        } catch (e) {
            console.log(`❌ SiliconFlow recusou (${token.substring(0, 5)}): ${e.response ? e.response.status : e.message}`);
        }
    }
}

scanSiliconFlow();
