const { groqRequest, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente de Formatação v12.1 — Estilo Narrativa Imersiva
 * Garante que o texto longo seja formatado para leitura fluida, sem listas ou resumos.
 */
async function runFormattingAgent({ texto_bruto, nicho }) {
  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Você é o Editor de Layout da Casos Domal. Sua missão é formatar a história para máxima imersão.

### REGRAS CRÍTICAS DE DESIGN (NÃO NEGOCIÁVEL):
1. ESPAÇAMENTO EXTREMO: Use obrigatoriamente TRÊS quebras de linha (\n\n\n) entre parágrafos. Se o texto vier sem espaços, você DEVE criá-los.
2. EMOJIS CONTEXTUAIS: Comece CADA parágrafo com um emoji que combine com o assunto (Ex: 🕵️ para mistério, ✈️ para aviação).
3. PROIBIDO RESUMIR: Mantenha a densidade do texto original. Sua função é APENAS formatar o vácuo e os emojis.
4. HASHTAGS: Garanta um bloco de 5 hashtags virais separadas por espaço no final.

RESULTADO OBRIGATÓRIO (JSON):
{
  "legenda_formatada": "Texto com espaços largos, emojis e hashtags"
}`
      },
      {
        role: "user",
        content: `FORMATE ESTA HISTÓRIA:
${texto_bruto}`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runFormattingAgent };
