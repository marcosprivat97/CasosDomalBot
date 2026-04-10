const { groqRequest, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente de Formatação v12.1 — Estilo Narrativa Imersiva
 * Garante que o texto longo seja formatado para leitura fluida, sem listas ou resumos.
 */
async function runFormattingAgent({ texto_bruto, nicho }) {
  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4, // Estabilidade total no formato
    messages: [
      {
        role: "system",
        content: `Você é o Editor de Layout da Casos Domal. Sua missão é garantir a legibilidade de uma história longa no celular.

### REGRAS CRÍTICAS (ANTI-RESUMO):
1. PROIBIDO USAR TÓPICOS OU LISTAS (- ou *). O Facebook penaliza textos que parecem listas de IA.
2. PRESERVAÇÃO TOTAL: Se o texto tem fatos e detalhes, MANTENHA TODOS. Não resuma nada.
3. ESPAÇAMENTO ELITE: Garanta exatamente \n\n entre cada parágrafo para o texto "respirar".
4. EMOJIS DISCRETOS: Use um emoji único e misterioso no início de cada parágrafo (Ex: 🌑, 🕵️, 🏛️).
5. CAIXA ALTA ESTRATÉGICA: Use apenas em nomes próprios ou termos técnicos de impacto extremo.

O resultado deve ser um "Artigo de Elite" que o leitor não consegue parar de ler.`
      },
      {
        role: "user",
        content: `FORMATE ESTA HISTÓRIA (NÃO RESUMA):
${texto_bruto}

REQUISITO: Transforme qualquer lista em parágrafos narrativos. Mantenha a densidade de fatos.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runFormattingAgent };
