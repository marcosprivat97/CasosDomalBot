const axios = require('axios');

const GEMINI_API_KEY = "AIzaSyDq1Sv0ARMq0Do-8YzEd-uQw9lv1Hcleoo";

async function diagnoseGemini() {
    console.log("🕵️ Diagnosticando Google Gemini...");
    
    // 1. Tentar listar os modelos para ver se a chave é válida e o que está disponível
    try {
        console.log("📋 Listando modelos disponíveis...");
        const listResponse = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );
        console.log("✅ Chave Válida! Modelos encontrados:", listResponse.data.models.length);
        
        // Mostrar os 3 primeiros modelos para conferir o nome exato
        listResponse.data.models.slice(0, 5).forEach(m => console.log(` - ${m.name}`));
        
        // 2. Tentar uma chamada com o primeiro modelo da lista
        const firstModel = listResponse.data.models.find(m => m.name.includes("gemini-1.5-flash") || m.name.includes("gemini-pro"));
        if (firstModel) {
            console.log(`\n🎯 Testando geração com: ${firstModel.name}...`);
            const genResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/${firstModel.name}:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: "Oi" }] }] }
            );
            console.log("✅ SUCESSO NA GERAÇÃO!");
            console.log("Resposta:", genResponse.data.candidates[0].content.parts[0].text);
        }

    } catch (e) {
        console.error("❌ FALHA NO DIAGNÓSTICO GEMINI:");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Dados:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Erro:", e.message);
        }
    }
}

diagnoseGemini();
