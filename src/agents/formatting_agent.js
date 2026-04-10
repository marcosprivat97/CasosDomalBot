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

### REGRAS CRÍTICAS DE DESIGN:
1. ESPAÇAMENTO EXTREMO: Use obrigatoriamente TRÊS quebras de linha (\n\n\n) entre parágrafos para o texto "respirar".
2. EMOJIS OBRIGATÓRIOS: Comece CADA parágrafo com um emoji temático e misterioso.
3. SEM LISTAS: Transforme qualquer tópico em prosa fluida.
4. HASHTAGS: Adicione 3 a 5 hashtags virais no final do texto.

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
