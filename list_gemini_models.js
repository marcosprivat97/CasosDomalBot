const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log("🔍 Consultando modelos disponíveis para esta chave...");
        // Infelizmente o SDK do Node não tem um método genérico fácil de listagem direta sem usar o client REST
        // Mas podemos tentar inferir ou usar um modelo clássico.
        
        // Tentativa de gerar conteúdo com o nome base
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Diga 'OK' se você está funcionando.");
        console.log("✅ Resposta do Gemini 1.5 Flash:", result.response.text());

    } catch (e) {
        console.log("❌ Erro no 1.5-Flash:", e.message);
        
        try {
            console.log("🔄 Tentando Gemini Pro (Legado)...");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Diga 'OK' se você está funcionando.");
            console.log("✅ Resposta do Gemini Pro:", result.response.text());
        } catch (e2) {
            console.log("❌ Erro no Gemini Pro:", e2.message);
        }
    }
}

listModels();
