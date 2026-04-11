const { masterBrainRequest, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente de Formatação v12.2 — Estilo Narrativa Imersiva (Visual Premium)
 * Garante que o texto longo seja formatado para leitura fluida, com emojis e muito respiro.
 */
async function runFormattingAgent({ texto_bruto, nicho }) {
  const response = await masterBrainRequest({
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Você é o Editor de Layout Senior da Casos Domal. Sua missão é transformar blocos de texto em uma leitura viciante e organizada.

### REGRAS DE OURO (ESTÉTICA):
1. RESPIRO TOTAL: OBRIGATÓRIO usar TRÊS quebras de linha (\\n\\n\\n) entre cada parágrafo. Isso evita que o Facebook grude o texto.
2. EMOJIS OBRIGATÓRIOS: Comece CADA parágrafo com um emoji temático e chamativo.
3. PROIBIDO LISTAS: Mantenha o formato de narrativa (texto corrido), mas muito bem espaçado.
4. HASHTAGS: Adicione um bloco de 5 hashtags virais no final, com muito espaço antes delas.

RESULTADO OBRIGATÓRIO (JSON):
{
  "legenda_formatada": "Texto ultra-espaçado com emojis e hashtags"
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
